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

export async function createAccommodation(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({
      message: "A JSON object is required.",
    });
    return;
  }

  const allowedFields = [
    "hotel_id",
    "name",
    "description",
    "room_type",
    "capacity",
    "bed_description",
    "price_per_night",
    "currency",
  ];

  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    res.status(400).json({
      message: "The request contains unsupported fields.",
    });
    return;
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    typeof body.hotel_id !== "string" ||
    !uuidPattern.test(body.hotel_id)
  ) {
    res.status(400).json({
      message: "A valid hotel_id is required.",
    });
    return;
  }

  const textFields = [
    { key: "name", max: 150 },
    { key: "description", max: 10000 },
    { key: "room_type", max: 50 },
    { key: "bed_description", max: 150 },
  ];

  for (const { key, max } of textFields) {
    const value = body[key];

    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.trim().length > max
    ) {
      res.status(400).json({
        message: `${key} must contain between 1 and ${max} characters.`,
      });
      return;
    }
  }

  if (
    !Number.isInteger(body.capacity) ||
    body.capacity < 1 ||
    body.capacity > 32767
  ) {
    res.status(400).json({
      message: "Capacity must be a whole number between 1 and 32767.",
    });
    return;
  }

  // Accept a decimal string to preserve monetary precision.
  if (
    typeof body.price_per_night !== "string" ||
    !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(body.price_per_night)
  ) {
    res.status(400).json({
      message:
        "Price must be a non-negative decimal string with at most two decimal places.",
    });
    return;
  }

  // Our initial hotel uses South African rand.
  if (body.currency !== "ZAR") {
    res.status(400).json({
      message: "Currency must be ZAR.",
    });
    return;
  }

  try {
    const hotel = await pool.query(
      "SELECT id FROM hotels WHERE id = $1",
      [body.hotel_id]
    );

    if (hotel.rows.length === 0) {
      res.status(404).json({
        message: "Hotel not found.",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO accommodations (
        hotel_id,
        name,
        description,
        room_type,
        capacity,
        bed_description,
        price_per_night,
        currency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        body.hotel_id,
        body.name.trim(),
        body.description.trim(),
        body.room_type.trim(),
        body.capacity,
        body.bed_description.trim(),
        body.price_per_night,
        body.currency,
      ]
    );

    const accommodation = result.rows[0];

    res
      .location(`/api/accommodations/${accommodation.id}`)
      .status(201)
      .json({
        message: "Accommodation created successfully.",
        data: accommodation,
      });
  } catch {
    console.error("Unable to create accommodation.");

    res.status(500).json({
      message: "Unable to create accommodation.",
    });
  }
}