import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync.js";
import * as awarenessProtocol from "y-protocols/awareness.js";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { verifyToken } from "../middlewares/auth.middleware.js";
import Document from "../models/Document.js";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const SAVE_DEBOUNCE_MS = 3000;

/**
 * In-memory room registry: documentId -> Room
 * Each room has a Y.Doc, awareness, connections, and a debounced saver.
 */
const rooms = new Map();

class Room {
  constructor(documentId) {
    this.documentId = documentId;
    this.ydoc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.ydoc);
    this.awareness.setLocalState(null);
    this.connections = new Map(); // ws -> { userId, role, controlledIds }
    this.saveTimer = null;
    this.loaded = false;

    this.ydoc.on("update", (update, origin) => {
      this.broadcast(this.encodeSyncUpdate(update), origin);
      this.scheduleSave();
    });

    this.awareness.on("update", ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed);
      const buf = this.encodeAwarenessUpdate(changedClients);
      this.broadcast(buf, null);
    });
  }

  async load() {
    if (this.loaded) return;
    try {
      const doc = await Document.findById(this.documentId);
      if (doc?.yjsState) {
        Y.applyUpdate(this.ydoc, new Uint8Array(doc.yjsState), "load");
      }
    } catch (err) {
      console.error(`[yjs] Load failed for ${this.documentId}:`, err.message);
    }
    this.loaded = true;
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE_MS);
  }

  async save() {
    try {
      const state = Y.encodeStateAsUpdate(this.ydoc);
      await Document.findByIdAndUpdate(this.documentId, {
        yjsState: Buffer.from(state),
      });
    } catch (err) {
      console.error(`[yjs] Save failed for ${this.documentId}:`, err.message);
    }
  }

  encodeSyncUpdate(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    return encoding.toUint8Array(encoder);
  }

  encodeAwarenessUpdate(clients) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients)
    );
    return encoding.toUint8Array(encoder);
  }

  broadcast(message, origin) {
    this.connections.forEach((meta, ws) => {
      if (ws === origin) return;
      if (ws.readyState !== ws.OPEN) return;
      try {
        ws.send(message);
      } catch (e) {
        console.error("[yjs] broadcast error:", e.message);
      }
    });
  }

  addConnection(ws, meta) {
    this.connections.set(ws, { ...meta, controlledIds: new Set() });

    // Send sync step 1 (request remote updates)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, this.ydoc);
    ws.send(encoding.toUint8Array(encoder));

    // Send current awareness state
    const states = this.awareness.getStates();
    if (states.size > 0) {
      const ae = encoding.createEncoder();
      encoding.writeVarUint(ae, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        ae,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(states.keys())
        )
      );
      ws.send(encoding.toUint8Array(ae));
    }
  }

  removeConnection(ws) {
    const meta = this.connections.get(ws);
    if (meta?.controlledIds.size) {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        Array.from(meta.controlledIds),
        null
      );
    }
    this.connections.delete(ws);

    if (this.connections.size === 0) {
      // Persist final state and discard room from memory
      this.save().finally(() => {
        if (this.connections.size === 0) {
          this.ydoc.destroy();
          this.awareness.destroy();
          rooms.delete(this.documentId);
        }
      });
    }
  }

  handleMessage(ws, data) {
    const meta = this.connections.get(ws);
    if (!meta) return;

    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          if (meta.role === "viewer") {
            // Viewers can sync (read), but their updates must be ignored
            const peekDecoder = decoding.createDecoder(message);
            decoding.readVarUint(peekDecoder); // skip messageType
            const subType = decoding.readVarUint(peekDecoder);
            if (subType === 2 /* update */ || subType === 1 /* SyncStep2 */) {
              return; // silently drop write attempts
            }
          }
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, this.ydoc, ws);
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case MESSAGE_AWARENESS: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(this.awareness, update, ws);
          // Track which client IDs this connection controls
          const decodedUpdate = awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            Array.from(this.awareness.getStates().keys())
          );
          // Add awareness clientIDs from the update to the connection's controlledIds
          const inner = decoding.createDecoder(update);
          const len = decoding.readVarUint(inner);
          for (let i = 0; i < len; i++) {
            const clientID = decoding.readVarUint(inner);
            decoding.readVarUint(inner); // clock
            decoding.readVarString(inner); // state json
            meta.controlledIds.add(clientID);
          }
          break;
        }
      }
    } catch (err) {
      console.error("[yjs] message error:", err.message);
    }
  }
}

async function getOrCreateRoom(documentId) {
  let room = rooms.get(documentId);
  if (!room) {
    room = new Room(documentId);
    rooms.set(documentId, room);
    await room.load();
  } else if (!room.loaded) {
    await room.load();
  }
  return room;
}

async function authorizeConnection(documentId, userId) {
  const doc = await Document.findById(documentId);
  if (!doc) return null;
  const role = doc.getRole(userId);
  return role ? { doc, role } : null;
}

export function attachYjsServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (request, socket, head) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (!url.pathname.startsWith("/yjs/")) {
        socket.destroy();
        return;
      }

      const documentId = url.pathname.replace("/yjs/", "").split("/")[0];
      if (!documentId) {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
        return;
      }

      const token = url.searchParams.get("token");
      const decoded = verifyToken(token);
      if (!decoded) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const access = await authorizeConnection(documentId, decoded.id);
      if (!access) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, {
          documentId,
          userId: decoded.id,
          role: access.role,
        });
      });
    } catch (err) {
      console.error("[yjs] upgrade error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", async (ws, request, ctx) => {
    ws.binaryType = "arraybuffer";

    const room = await getOrCreateRoom(ctx.documentId);
    room.addConnection(ws, { userId: ctx.userId, role: ctx.role });

    console.log(
      `[yjs] ${ctx.userId} (${ctx.role}) joined ${ctx.documentId} (rooms=${rooms.size})`
    );

    ws.on("message", (data) => room.handleMessage(ws, data));
    ws.on("close", () => room.removeConnection(ws));
    ws.on("error", () => room.removeConnection(ws));

    // ping/pong for keepalive
    let pongReceived = true;
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        ws.terminate();
        return;
      }
      pongReceived = false;
      try {
        ws.ping();
      } catch {
        ws.terminate();
      }
    }, 30000);
    ws.on("pong", () => {
      pongReceived = true;
    });
    ws.on("close", () => clearInterval(pingInterval));
  });

  return wss;
}
