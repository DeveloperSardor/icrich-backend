import { Router } from "express";
import mongoose from "mongoose";

const HealthRouter = Router();

const DB_STATE = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

HealthRouter.get("/", (_req, res) => {
  const state = mongoose.connection.readyState;
  const ok = state === 1;
  res.status(ok ? 200 : 503).json({
    success: ok,
    service: "icrich-api",
    database: DB_STATE[state] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

export default HealthRouter;
