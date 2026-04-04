import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import connectDB from "./config/db.js";
import { setupYjsWebSocket } from "./config/websocket.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import userRoutes from "./routes/user.routes.js";
import errorHandler, { notFound } from "./middlewares/error.middleware.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Health Check ────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Collaborative Editor API is running",
    version: "1.0.0",
  });
});

// ─── REST Routes ─────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/users", userRoutes);

// ─── Error Handling ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Create HTTP Server + WebSocket ──────────────────────────────────
const server = createServer(app);

// Attach y-websocket for realtime collaboration
setupYjsWebSocket(server);

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  );
  console.log(`WebSocket server available at ws://localhost:${PORT}/<documentId>`);
});

export default app;
