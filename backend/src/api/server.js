import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "../config.js";
import { authMiddleware } from "./middleware/auth.js";
import groupsRouter from "./routes/groups.js";
import keywordsRouter from "./routes/keywords.js";
import messagesRouter from "./routes/messages.js";
import configRouter from "./routes/config.js";
import statusRouter from "./routes/status.js";

/**
 * Create and configure Express API server
 */
export function createServer() {
  const app = express();

  // Security middleware
  app.set("trust proxy", config.api.trustProxy);
  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: [
        config.api.frontendUrl,
        "http://localhost:3000",
        "https://vortex.ryurex.com",
      ],
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: "100kb",
      strict: true,
      type: "application/json",
    }),
  );

  // Health check (no auth required)
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes (auth required)
  app.use("/api/groups", authMiddleware, groupsRouter);
  app.use("/api/keywords", authMiddleware, keywordsRouter);
  app.use("/api/messages", authMiddleware, messagesRouter);
  app.use("/api/config", authMiddleware, configRouter);
  app.use("/api/status", authMiddleware, statusRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}

/**
 * Start API server
 */
export function startServer() {
  const app = createServer();

  app.listen(config.api.port, () => {
    console.log(`🚀 API Server running on http://localhost:${config.api.port}`);
    console.log(`📡 CORS enabled for: ${config.api.frontendUrl}`);
  });

  return app;
}
