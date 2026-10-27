import "../types/session";
import { NextFunction, Request, Response } from "express";
import pool from "../config/db";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      message: "You must sign in first.",
    });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        message: "Your account is unavailable.",
      });
      return;
    }

    res.locals.user = result.rows[0];
    next();
  } catch {
    console.error("Unable to verify the current user.");

    res.status(500).json({
      message: "Unable to verify your account.",
    });
  }
}

export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!res.locals.user) {
    res.status(401).json({
      message: "You must sign in first.",
    });
    return;
  }

  if (res.locals.user.role !== "admin") {
    res.status(403).json({
      message: "Admin access is required.",
    });
    return;
  }

  next();
}