import { Request, Response } from "express";
import pool from "../config/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReviewInput = { rating: number; comment: string };

function parseReviewInput(body: unknown): ReviewInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const value = body as Record<string, unknown>;
  if (
    !Number.isInteger(value.rating) ||
    (value.rating as number) < 1 ||
    (value.rating as number) > 5 ||
    typeof value.comment !== "string"
  ) {
    return null;
  }

  const comment = value.comment.trim();
  if (comment.length < 1 || comment.length > 2000) return null;

  return { rating: value.rating as number, comment };
}

export async function getAccommodationReviews(
  req: Request,
  res: Response
): Promise<void> {
  const { accommodationId } = req.params;

  if (typeof accommodationId !== "string" || !uuidPattern.test(accommodationId)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
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

    const [summary, reviews] = await Promise.all([
      pool.query(
        `
        SELECT COUNT(*)::integer AS count,
               ROUND(AVG(rating)::numeric, 2) AS average_rating
        FROM reviews
        WHERE accommodation_id = $1
        `,
        [accommodationId]
      ),
      pool.query(
        `
        SELECT
          r.id,
          r.user_id,
          u.full_name AS guest_name,
          r.rating,
          r.comment,
          r.created_at,
          r.updated_at
        FROM reviews AS r
        JOIN users AS u ON u.id = r.user_id
        WHERE r.accommodation_id = $1
        ORDER BY r.created_at DESC, r.id
        `,
        [accommodationId]
      ),
    ]);

    res.status(200).json({
      data: {
        count: summary.rows[0].count,
        average_rating: summary.rows[0].average_rating,
        reviews: reviews.rows,
      },
    });
  } catch {
    console.error("Unable to retrieve accommodation reviews.");
    res.status(500).json({ message: "Unable to retrieve reviews." });
  }
}

export async function createReview(
  req: Request,
  res: Response
): Promise<void> {
  const { accommodationId } = req.params;
  const userId = req.session.userId;
  const input = parseReviewInput(req.body);

  if (typeof accommodationId !== "string" || !uuidPattern.test(accommodationId)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  if (!input) {
    res.status(400).json({ message: "Rating must be 1–5 and comment 1–2,000 characters." });
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

    const completedStay = await pool.query(
      `
      SELECT 1
      FROM bookings AS b
      JOIN booking_rooms AS br ON br.booking_id = b.id
      JOIN rooms AS r ON r.id = br.room_id
      WHERE b.user_id = $1
        AND r.accommodation_id = $2
        AND b.status = 'completed'
        AND b.check_out <= CURRENT_DATE
      LIMIT 1
      `,
      [userId, accommodationId]
    );

    if (completedStay.rows.length === 0) {
      res.status(403).json({
        message: "You can review an accommodation after completing a stay there.",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO reviews (user_id, accommodation_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, accommodation_id, rating, comment, created_at, updated_at
      `,
      [userId, accommodationId, input.rating, input.comment]
    );

    res.status(201).json({ data: result.rows[0], message: "Review created." });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ message: "You have already reviewed this accommodation." });
      return;
    }

    console.error("Unable to create review.");
    res.status(500).json({ message: "Unable to create review." });
  }
}

export async function updateReview(
  req: Request,
  res: Response
): Promise<void> {
  const { reviewId } = req.params;
  const userId = req.session.userId;
  const input = parseReviewInput(req.body);

  if (typeof reviewId !== "string" || !uuidPattern.test(reviewId)) {
    res.status(400).json({ message: "A valid review ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  if (!input) {
    res.status(400).json({ message: "Rating must be 1–5 and comment 1–2,000 characters." });
    return;
  }

  try {
    const result = await pool.query(
      `
      UPDATE reviews
      SET rating = $1, comment = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING id, accommodation_id, rating, comment, created_at, updated_at
      `,
      [input.rating, input.comment, reviewId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Review not found." });
      return;
    }

    res.status(200).json({ data: result.rows[0], message: "Review updated." });
  } catch {
    console.error("Unable to update review.");
    res.status(500).json({ message: "Unable to update review." });
  }
}

export async function deleteReview(
  req: Request,
  res: Response
): Promise<void> {
  const { reviewId } = req.params;
  const userId = req.session.userId;

  if (typeof reviewId !== "string" || !uuidPattern.test(reviewId)) {
    res.status(400).json({ message: "A valid review ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM reviews WHERE id = $1 AND user_id = $2",
      [reviewId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Review not found." });
      return;
    }

    res.status(200).json({ message: "Review deleted." });
  } catch {
    console.error("Unable to delete review.");
    res.status(500).json({ message: "Unable to delete review." });
  }
}
