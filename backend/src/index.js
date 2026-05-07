import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import userRoutes from "./routes/user.routes.js";
import errorHandler, { notFound } from "./middlewares/error.middleware.js";
import { attachYjsServer } from "./ws/yjsServer.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    message: "Collaborative Editor API is running",
    version: "1.0.0",
  });
});

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

attachYjsServer(server);

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  );
  console.log(`Yjs WebSocket on ws://localhost:${PORT}/yjs/<documentId>`);
});

export default app;
