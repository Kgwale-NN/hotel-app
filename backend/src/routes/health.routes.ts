import { Router } from "express";
import pool from "../config/db";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hotel API is running",
  });
});

healthRouter.get("/database", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      message: "Database connection successful",
    });
  } catch {
    console.error("Database health check failed.");

    res.status(503).json({
      message: "Database is currently unavailable",
    });
  }
});

export default healthRouter;