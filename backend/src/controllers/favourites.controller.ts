import { Request, Response } from "express";
import pool from "../config/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getMyFavourites(
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
      SELECT
        a.id,
        a.name,
        a.room_type,
        a.capacity,
        a.price_per_night,
        a.currency,
        a.is_active,
        h.name AS hotel_name,
        h.city,
        h.country,
        f.created_at AS saved_at,
        (
          SELECT image_url
          FROM accommodation_images
          WHERE accommodation_id = a.id
          ORDER BY sort_order, id
          LIMIT 1
        ) AS cover_image
      FROM favourites AS f
      JOIN accommodations AS a ON a.id = f.accommodation_id
      JOIN hotels AS h ON h.id = a.hotel_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC, a.id
      `,
      [userId]
    );

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve favourites.");
    res.status(500).json({ message: "Unable to retrieve favourites." });
  }
}

export async function addFavourite(
  req: Request,
  res: Response
): Promise<void> {
  const { accommodationId } = req.params;
  const userId = req.session.userId;

  if (typeof accommodationId !== "string" || !uuidPattern.test(accommodationId)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const accommodation = await pool.query(
      "SELECT id FROM accommodations WHERE id = $1 AND is_active = TRUE",
      [accommodationId]
    );

    if (accommodation.rows.length === 0) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO favourites (user_id, accommodation_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, accommodation_id) DO NOTHING
      RETURNING user_id
      `,
      [userId, accommodationId]
    );

    res.status(result.rowCount === 1 ? 201 : 200).json({
      message:
        result.rowCount === 1
          ? "Accommodation added to favourites."
          : "Accommodation is already in favourites.",
    });
  } catch {
    console.error("Unable to add favourite.");
    res.status(500).json({ message: "Unable to add favourite." });
  }
}

export async function removeFavourite(
  req: Request,
  res: Response
): Promise<void> {
  const { accommodationId } = req.params;
  const userId = req.session.userId;

  if (typeof accommodationId !== "string" || !uuidPattern.test(accommodationId)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM favourites WHERE user_id = $1 AND accommodation_id = $2",
      [userId, accommodationId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Favourite not found." });
      return;
    }

    res.status(200).json({ message: "Accommodation removed from favourites." });
  } catch {
    console.error("Unable to remove favourite.");
    res.status(500).json({ message: "Unable to remove favourite." });
  }
}
