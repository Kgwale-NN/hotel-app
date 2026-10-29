import { Request, Response } from "express";
import pool from "../config/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getMyNotifications(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.session.userId;
  const unread = req.query.unread;

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  if (unread !== undefined && unread !== "true" && unread !== "false") {
    res.status(400).json({ message: "Unread filter must be true or false." });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT id, booking_id, type, title, message, read_at, created_at
      FROM notifications
      WHERE user_id = $1
        AND ($2::boolean IS NULL OR ($2::boolean AND read_at IS NULL) OR (NOT $2::boolean AND read_at IS NOT NULL))
      ORDER BY created_at DESC, id
      LIMIT 100
      `,
      [userId, unread === undefined ? null : unread === "true"]
    );

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve notifications.");
    res.status(500).json({ message: "Unable to retrieve notifications." });
  }
}

export async function markNotificationRead(
  req: Request,
  res: Response
): Promise<void> {
  const { notificationId } = req.params;
  const userId = req.session.userId;

  if (typeof notificationId !== "string" || !uuidPattern.test(notificationId)) {
    res.status(400).json({ message: "A valid notification ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = $1 AND user_id = $2
      RETURNING id, read_at
      `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Notification not found." });
      return;
    }

    res.status(200).json({ data: result.rows[0] });
  } catch {
    console.error("Unable to mark notification as read.");
    res.status(500).json({ message: "Unable to update notification." });
  }
}

export async function markAllNotificationsRead(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND read_at IS NULL
      `,
      [userId]
    );

    res.status(200).json({
      message: "Notifications marked as read.",
      updated_count: result.rowCount ?? 0,
    });
  } catch {
    console.error("Unable to mark all notifications as read.");
    res.status(500).json({ message: "Unable to update notifications." });
  }
}
