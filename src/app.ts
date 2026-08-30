import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { createApiRouter } from "./routes/index.js";

export function startServer() {
  const app = express();

  app.use(
    cors({
      origin: env.cors.origin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      status: "Health check successful!",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1", createApiRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  return app;
}
