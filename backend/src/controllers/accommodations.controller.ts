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

export async function getAccommodationById(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({
      message: "A valid accommodation ID is required.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `
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

        json_build_object(
          'id', h.id,
          'name', h.name,
          'address', h.address,
          'city', h.city,
          'country', h.country,
          'latitude', h.latitude,
          'longitude', h.longitude,
          'star_rating', h.star_rating,
          'check_in_time', h.check_in_time,
          'check_out_time', h.check_out_time,
          'policies', h.policies
        ) AS hotel,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', img.id,
                'image_url', img.image_url,
                'alt_text', img.alt_text,
                'sort_order', img.sort_order
              )
              ORDER BY img.sort_order, img.id
            )
            FROM accommodation_images AS img
            WHERE img.accommodation_id = a.id
          ),
          '[]'::json
        ) AS images,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', am.id,
                'name', am.name
              )
              ORDER BY am.name
            )
            FROM accommodation_amenities AS aa
            JOIN amenities AS am ON am.id = aa.amenity_id
            WHERE aa.accommodation_id = a.id
          ),
          '[]'::json
        ) AS amenities

      FROM accommodations AS a
      JOIN hotels AS h ON h.id = a.hotel_id
      WHERE a.id = $1 AND a.is_active = TRUE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Accommodation not found.",
      });
      return;
    }

    res.status(200).json({
      data: result.rows[0],
    });
  } catch {
    console.error("Failed to retrieve accommodation details.");

    res.status(500).json({
      message: "Unable to retrieve accommodation details.",
    });
  }
}