import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as map from "lib0/map";

const messageSync = 0;
const messageAwareness = 1;

// In-memory store for Y.Doc instances, keyed by room name (documentId)
const docs = new Map();

/**
 * Get or create a Y.Doc for a given room (documentId).
 */
const getYDoc = (docName) => {
  return map.setIfUndefined(docs, docName, () => {
    const doc = new Y.Doc({ gc: true });
    doc.name = docName;
    doc.conns = new Map(); // ws -> Set<number> (controlled awareness ids)
    doc.awareness = new awarenessProtocol.Awareness(doc);

    doc.awareness.setLocalState(null);

    // Listen for awareness updates and broadcast to room
    doc.awareness.on("update", ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIds = doc.conns.get(conn);
        if (connControlledIds) {
          added.forEach((clientID) => connControlledIds.add(clientID));
          removed.forEach((clientID) => connControlledIds.delete(clientID));
        }
      }
      // Broadcast awareness info
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(doc.awareness, changedClients)
      );
      const msg = encoding.toUint8Array(encoder);
      doc.conns.forEach((_, c) => {
        send(doc, c, msg);
      });
    });

    // Listen for document updates and broadcast to room
    doc.on("update", (update, origin) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const msg = encoding.toUint8Array(encoder);
      doc.conns.forEach((_, conn) => {
        send(doc, conn, msg);
      });
    });

    return doc;
  });
};

/**
 * Send a message to a WebSocket client.
 */
const send = (doc, conn, msg) => {
  if (
    conn.readyState !== undefined &&
    conn.readyState !== conn.CONNECTING &&
    conn.readyState !== conn.OPEN
  ) {
    closeConn(doc, conn);
    return;
  }
  try {
    conn.send(msg, (err) => {
      if (err) closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

/**
 * Handle a message from client.
 */
const messageListener = (conn, doc, message) => {
  try {
    const uint8 = new Uint8Array(message);
    const decoder = decoding.createDecoder(uint8);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        const msg = encoding.toUint8Array(encoder);
        // If the encoder only contains the messageType, no need to send
        if (encoding.length(encoder) > 1) {
          send(doc, conn, msg);
        }
        break;
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  } catch (err) {
    console.error("[WS] Message handling error:", err);
    doc.emit("error", [err]);
  }
};

/**
 * Close a WebSocket connection and clean up.
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);

    // Remove awareness states for this connection
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );

    // If no more connections to this doc, optionally destroy it
    if (doc.conns.size === 0) {
      doc.destroy();
      docs.delete(doc.name);
      console.log(`[WS] Room destroyed: ${doc.name} (no connections left)`);
    }
  }

  conn.close();
};

/**
 * Setup y-websocket server on the same HTTP server.
 *
 * Each document maps to a WebSocket room using documentId.
 * Yjs handles all CRDT merge logic — server relays updates.
 *
 * Client connects to: ws://host:port/<documentId>
 */
export const setupYjsWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    // Extract documentId (room name) from URL path
    const docName = decodeURIComponent(req.url.slice(1).split("?")[0]);

    if (!docName) {
      ws.close(4001, "Missing document ID in URL");
      return;
    }

    const doc = getYDoc(docName);
    doc.conns.set(ws, new Set());

    console.log(
      `[WS] Client connected to room: ${docName} (${doc.conns.size} clients)`
    );

    // Send initial sync step 1
    {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);
      send(doc, ws, encoding.toUint8Array(encoder));
    }

    // Send existing awareness states
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, ws, encoding.toUint8Array(encoder));
    }

    ws.on("message", (message) => messageListener(ws, doc, message));

    ws.on("close", () => {
      console.log(`[WS] Client disconnected from room: ${docName}`);
      closeConn(doc, ws);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Connection error in room ${docName}:`, err);
      closeConn(doc, ws);
    });
  });

  wss.on("error", (error) => {
    console.error("[WS] WebSocket server error:", error);
  });

  console.log("[WS] Yjs WebSocket server attached to HTTP server");

  return wss;
};
