import { Request, Response } from "express";
import pool from "../config/db";

export async function getAccommodations(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.name,
        a.description,
        a.room_type,
        a.capacity,
        a.bed_description,
        a.size_sqm,
        a.view_type,
        a.price_per_night,
        a.currency,
        h.name AS hotel_name,
        h.city,
        h.country,
        (
          SELECT image_url
          FROM accommodation_images
          WHERE accommodation_id = a.id
          ORDER BY sort_order, id
          LIMIT 1
        ) AS cover_image
      FROM accommodations AS a
      JOIN hotels AS h ON h.id = a.hotel_id
      WHERE a.is_active = TRUE
      ORDER BY a.price_per_night, a.id
    `);

    res.status(200).json({
      data: result.rows,
    });
  } catch {
    console.error("Failed to retrieve accommodations.");

    res.status(500).json({
      message: "Unable to retrieve accommodations.",
    });
  }
}