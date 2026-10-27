import { Request, Response } from "express";
import pool from "../config/db";

export async function getAdminAccommodations(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.name,
        a.room_type,
        a.capacity,
        a.price_per_night,
        a.currency,
        a.is_active,
        h.name AS hotel_name,
        (
          SELECT COUNT(*)::integer
          FROM rooms AS r
          WHERE r.accommodation_id = a.id
        ) AS total_rooms
      FROM accommodations AS a
      JOIN hotels AS h ON h.id = a.hotel_id
      ORDER BY a.created_at DESC, a.id
    `);

    res.status(200).json({
      data: result.rows,
    });
  } catch {
    console.error("Unable to retrieve admin accommodation listings.");

    res.status(500).json({
      message: "Unable to retrieve accommodations.",
    });
  }
}