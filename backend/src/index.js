// ─── Load environment variables ──────────────────────────────────────────────
// Ưu tiên: NODE_ENV đã được set từ CLI (cross-env) → load đúng file .env.{NODE_ENV}
// Fallback: development nếu không có NODE_ENV nào được set
import dotenv from "dotenv";
const NODE_ENV = process.env.NODE_ENV || "development";
const envResult = dotenv.config({ path: `.env.${NODE_ENV}` });
if (envResult.error) {
  console.warn(`[env] Không tìm thấy .env.${NODE_ENV}, thử load .env...`);
  dotenv.config(); // fallback về .env cũ nếu có
}
console.log(`[env] Loaded .env.${NODE_ENV}`);
// ─────────────────────────────────────────────────────────────────────────────

import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import userRoutes from "./routes/user.routes.js";
import versionRoutes from "./routes/version.routes.js";
import errorHandler, { notFound } from "./middlewares/error.middleware.js";
import { attachYjsServer } from "./ws/yjsServer.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — đọc từ env, hỗ trợ nhiều origin (phân cách bằng dấu phẩy)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    message: "Collaborative Editor API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/documents/:id/versions", versionRoutes);
app.use("/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

attachYjsServer(server);

server.listen(PORT, () => {
  console.log(
    `[server] Running in ${process.env.NODE_ENV} mode → http://localhost:${PORT}`
  );
  console.log(
    `[server] Yjs WebSocket  → ws://localhost:${PORT}/yjs/<documentId>`
  );
  console.log(`[server] CORS allowed   → ${allowedOrigins.join(", ")}`);
});

export default app;
