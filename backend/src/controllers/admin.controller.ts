import { Request, Response } from "express";
import pool from "../config/db";
import type { PoolClient } from "pg";

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

export async function createRoom(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const body = req.body;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({
      message: "A valid accommodation ID is required.",
    });
    return;
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "room_number")
  ) {
    res.status(400).json({
      message: "Provide a JSON object containing room_number only.",
    });
    return;
  }

  if (
    typeof body.room_number !== "string" ||
    !/^[A-Za-z0-9-]{1,20}$/.test(body.room_number.trim())
  ) {
    res.status(400).json({
      message:
        "Room number must contain 1–20 letters, numbers or hyphens.",
    });
    return;
  }

  const roomNumber = body.room_number.trim().toUpperCase();

  try {
    const accommodation = await pool.query(
      "SELECT id FROM accommodations WHERE id = $1",
      [id]
    );

    if (accommodation.rows.length === 0) {
      res.status(404).json({
        message: "Accommodation not found.",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO rooms (accommodation_id, room_number)
      VALUES ($1, $2)
      ON CONFLICT (accommodation_id, room_number) DO NOTHING
      RETURNING id, accommodation_id, room_number, is_active
      `,
      [id, roomNumber]
    );

    if (result.rows.length === 0) {
      res.status(409).json({
        message: "This room number already exists for this accommodation.",
      });
      return;
    }

    res.status(201).json({
      message: "Room created successfully.",
      data: result.rows[0],
    });
  } catch {
    console.error("Unable to create room.");

    res.status(500).json({
      message: "Unable to create room.",
    });
  }
}

export async function updateAccommodation(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const body = req.body;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({
      message: "A valid accommodation ID is required.",
    });
    return;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({
      message: "A JSON object is required.",
    });
    return;
  }

  const textLimits: Record<string, number> = {
    name: 150,
    description: 10000,
    room_type: 50,
    bed_description: 150,
  };

  const allowedFields = [
    ...Object.keys(textLimits),
    "capacity",
    "price_per_night",
    "is_active",
  ];

  const fields = Object.keys(body);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    res.status(400).json({
      message: "Provide at least one supported accommodation field.",
    });
    return;
  }

  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];

  for (const field of fields) {
    let value = body[field];

    if (Object.hasOwn(textLimits, field)) {
      if (
        typeof value !== "string" ||
        value.trim().length === 0 ||
        value.trim().length > textLimits[field]
      ) {
        res.status(400).json({
          message:
            `${field} must contain between 1 and ${textLimits[field]} characters.`,
        });
        return;
      }

      value = value.trim();
    }

    if (
      field === "capacity" &&
      (!Number.isInteger(value) || value < 1 || value > 32767)
    ) {
      res.status(400).json({
        message: "Capacity must be a whole number between 1 and 32767.",
      });
      return;
    }

    if (
      field === "price_per_night" &&
      (
        typeof value !== "string" ||
        !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value)
      )
    ) {
      res.status(400).json({
        message:
          "Price must be a non-negative decimal string with at most two decimal places.",
      });
      return;
    }

    if (field === "is_active" && typeof value !== "boolean") {
      res.status(400).json({
        message: "is_active must be true or false.",
      });
      return;
    }

    values.push(value);
    updates.push(`${field} = $${values.length}`);
  }

  values.push(id);

  try {
    const result = await pool.query(
      `
      UPDATE accommodations
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Accommodation not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Accommodation updated successfully.",
      data: result.rows[0],
    });
  } catch {
    console.error("Unable to update accommodation.");

    res.status(500).json({
      message: "Unable to update accommodation.",
    });
  }
}

export async function deleteAccommodation(
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

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accommodation = await client.query(
      `
      SELECT id
      FROM accommodations
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (accommodation.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      res.status(404).json({
        message: "Accommodation not found.",
      });
      return;
    }

    // Booking references prevent these rooms from being deleted.
    await client.query(
      "DELETE FROM rooms WHERE accommodation_id = $1",
      [id]
    );

    // Review references prevent the accommodation from being deleted.
    await client.query(
      "DELETE FROM accommodations WHERE id = $1",
      [id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    res.status(200).json({
      message: "Accommodation deleted successfully.",
    });
  } catch (error: unknown) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        client = undefined;
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      res.status(409).json({
        message:
          "This accommodation has related records, such as bookings or reviews. Hide it instead of deleting it.",
      });
      return;
    }

    console.error("Unable to delete accommodation.");

    res.status(500).json({
      message: "Unable to delete accommodation.",
    });
  } finally {
    client?.release();
  }
}

export async function getAdminBookings(
  req: Request,
  res: Response
): Promise<void> {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
    "expired",
  ];
  const status = req.query.status;

  if (
    status !== undefined &&
    (typeof status !== "string" || !allowedStatuses.includes(status))
  ) {
    res.status(400).json({
      message: "Status must be pending, confirmed, cancelled, completed, or expired.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        u.full_name AS guest_name,
        u.email AS guest_email,
        h.id AS hotel_id,
        h.name AS hotel_name,
        b.check_in,
        b.check_out,
        b.adults,
        b.children,
        b.status,
        b.currency,
        b.taxes_and_fees,
        b.special_requests,
        b.hold_expires_at,
        b.cancelled_at,
        b.cancellation_reason,
        b.created_at,
        b.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'room_id', r.id,
              'room_number', r.room_number,
              'accommodation_id', a.id,
              'accommodation_name', a.name,
              'price_per_night', br.price_per_night
            )
            ORDER BY r.room_number, r.id
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) AS rooms
      FROM bookings AS b
      JOIN users AS u ON u.id = b.user_id
      JOIN hotels AS h ON h.id = b.hotel_id
      LEFT JOIN booking_rooms AS br ON br.booking_id = b.id
      LEFT JOIN rooms AS r ON r.id = br.room_id
      LEFT JOIN accommodations AS a ON a.id = r.accommodation_id
      WHERE ($1::text IS NULL OR b.status = $1)
      GROUP BY b.id, u.full_name, u.email, h.name, h.id
      ORDER BY b.created_at DESC, b.id
      `,
      [status ?? null]
    );

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve admin bookings.");
    res.status(500).json({ message: "Unable to retrieve bookings." });
  }
}

export async function updateRoom(
  req: Request,
  res: Response
): Promise<void> {
  const { roomId } = req.params;
  const body = req.body;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof roomId !== "string" || !uuidPattern.test(roomId)) {
    res.status(400).json({ message: "A valid room ID is required." });
    return;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ message: "A JSON object is required." });
    return;
  }

  const fields = Object.keys(body);
  if (
    fields.length === 0 ||
    fields.some((field) => !["room_number", "is_active"].includes(field))
  ) {
    res.status(400).json({ message: "Provide room_number and/or is_active." });
    return;
  }

  const updates: string[] = [];
  const values: (string | boolean)[] = [];

  if (Object.hasOwn(body, "room_number")) {
    if (
      typeof body.room_number !== "string" ||
      !/^[A-Za-z0-9-]{1,20}$/.test(body.room_number.trim())
    ) {
      res.status(400).json({ message: "Room number must contain 1–20 letters, numbers or hyphens." });
      return;
    }
    values.push(body.room_number.trim().toUpperCase());
    updates.push(`room_number = $${values.length}`);
  }

  if (Object.hasOwn(body, "is_active")) {
    if (typeof body.is_active !== "boolean") {
      res.status(400).json({ message: "is_active must be true or false." });
      return;
    }
    values.push(body.is_active);
    updates.push(`is_active = $${values.length}`);
  }

  values.push(roomId);

  try {
    const result = await pool.query(
      `
      UPDATE rooms
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, accommodation_id, room_number, is_active
      `,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Room not found." });
      return;
    }

    res.status(200).json({ data: result.rows[0], message: "Room updated." });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ message: "That room number already exists for this accommodation." });
      return;
    }

    console.error("Unable to update room.");
    res.status(500).json({ message: "Unable to update room." });
  }
}

export async function getAccommodationImages(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT id, accommodation_id, image_url, alt_text, sort_order
      FROM accommodation_images
      WHERE accommodation_id = $1
      ORDER BY sort_order, id
      `,
      [id]
    );

    const accommodation = await pool.query(
      "SELECT 1 FROM accommodations WHERE id = $1",
      [id]
    );

    if (accommodation.rows.length === 0) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve accommodation images.");
    res.status(500).json({ message: "Unable to retrieve accommodation images." });
  }
}

export async function addAccommodationImage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const body = req.body;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !["image_url", "alt_text", "sort_order"].includes(field))
  ) {
    res.status(400).json({ message: "Provide image_url, alt_text, and optional sort_order." });
    return;
  }

  let imageUrl: URL;
  try {
    if (typeof body.image_url !== "string" || body.image_url.length > 2048) {
      throw new Error("invalid image URL");
    }
    imageUrl = new URL(body.image_url);
  } catch {
    res.status(400).json({ message: "image_url must be a valid HTTP or HTTPS URL." });
    return;
  }

  if (
    !["http:", "https:"].includes(imageUrl.protocol) ||
    typeof body.alt_text !== "string" ||
    body.alt_text.trim().length === 0 ||
    body.alt_text.trim().length > 250 ||
    (body.sort_order !== undefined &&
      (!Number.isInteger(body.sort_order) || body.sort_order < 0 || body.sort_order > 2147483647))
  ) {
    res.status(400).json({ message: "Provide an HTTP(S) image URL, alt text up to 250 characters, and a non-negative sort_order." });
    return;
  }

  try {
    const accommodation = await pool.query(
      "SELECT id FROM accommodations WHERE id = $1",
      [id]
    );
    if (accommodation.rows.length === 0) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO accommodation_images (accommodation_id, image_url, alt_text, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, accommodation_id, image_url, alt_text, sort_order
      `,
      [id, imageUrl.toString(), body.alt_text.trim(), body.sort_order ?? 0]
    );

    res.status(201).json({ data: result.rows[0], message: "Image added." });
  } catch {
    console.error("Unable to add accommodation image.");
    res.status(500).json({ message: "Unable to add accommodation image." });
  }
}

export async function deleteAccommodationImage(
  req: Request,
  res: Response
): Promise<void> {
  const { imageId } = req.params;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof imageId !== "string" || !uuidPattern.test(imageId)) {
    res.status(400).json({ message: "A valid image ID is required." });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM accommodation_images WHERE id = $1",
      [imageId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Image not found." });
      return;
    }

    res.status(200).json({ message: "Image deleted." });
  } catch {
    console.error("Unable to delete accommodation image.");
    res.status(500).json({ message: "Unable to delete accommodation image." });
  }
}

export async function getAmenities(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query("SELECT id, name FROM amenities ORDER BY name, id");
    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve amenities.");
    res.status(500).json({ message: "Unable to retrieve amenities." });
  }
}

export async function replaceAccommodationAmenities(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const body = req.body;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => field !== "amenity_ids") ||
    !Array.isArray(body.amenity_ids) ||
    body.amenity_ids.length > 30 ||
    body.amenity_ids.some((amenityId: unknown) => typeof amenityId !== "string" || !uuidPattern.test(amenityId)) ||
    new Set(body.amenity_ids).size !== body.amenity_ids.length
  ) {
    res.status(400).json({ message: "amenity_ids must be an array of up to 30 unique amenity IDs." });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accommodation = await client.query(
      "SELECT id FROM accommodations WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (accommodation.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }

    const amenityIds = body.amenity_ids as string[];
    if (amenityIds.length > 0) {
      const existing = await client.query(
        "SELECT id FROM amenities WHERE id = ANY($1::uuid[])",
        [amenityIds]
      );
      if (existing.rows.length !== amenityIds.length) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        res.status(400).json({ message: "One or more amenity IDs do not exist." });
        return;
      }
    }

    await client.query(
      "DELETE FROM accommodation_amenities WHERE accommodation_id = $1",
      [id]
    );

    if (amenityIds.length > 0) {
      await client.query(
        `
        INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
        SELECT $1, selected.amenity_id
        FROM UNNEST($2::uuid[]) AS selected(amenity_id)
        `,
        [id, amenityIds]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;
    res.status(200).json({ message: "Accommodation amenities replaced.", amenity_ids: amenityIds });
  } catch {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        client = undefined;
      }
    }
    console.error("Unable to update accommodation amenities.");
    res.status(500).json({ message: "Unable to update accommodation amenities." });
  } finally {
    client?.release();
  }
}

export async function updateAdminBookingStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { bookingId } = req.params;
  const body = req.body;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof bookingId !== "string" || !uuidPattern.test(bookingId)) {
    res.status(400).json({ message: "A valid booking ID is required." });
    return;
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !["status", "cancellation_reason"].includes(field)) ||
    !["confirmed", "cancelled"].includes(body.status)
  ) {
    res.status(400).json({ message: "Set status to confirmed or cancelled, with an optional cancellation_reason." });
    return;
  }

  const reason = body.cancellation_reason;
  if (
    reason !== undefined &&
    (typeof reason !== "string" || reason.trim().length > 500)
  ) {
    res.status(400).json({ message: "Cancellation reason must be 500 characters or fewer." });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult = await client.query(
      "SELECT id, user_id, status FROM bookings WHERE id = $1 FOR UPDATE",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    const booking = bookingResult.rows[0];
    if (booking.status !== "pending") {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "Only pending bookings can be confirmed or cancelled." });
      return;
    }

    if (body.status === "confirmed") {
      const payment = await client.query(
        "SELECT 1 FROM payments WHERE booking_id = $1 AND status = 'succeeded' LIMIT 1",
        [bookingId]
      );

      if (payment.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        res.status(409).json({ message: "A booking can only be confirmed after its payment succeeds." });
        return;
      }

      const result = await client.query(
        `
        UPDATE bookings
        SET status = 'confirmed', hold_expires_at = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING id, status, updated_at
        `,
        [bookingId]
      );

      await client.query(
        `
        INSERT INTO notifications (user_id, booking_id, type, title, message)
        VALUES ($1, $2, 'booking_confirmation', 'Booking confirmed', $3)
        `,
        [booking.user_id, bookingId, "Your payment succeeded and your booking is confirmed."]
      );

      await client.query("COMMIT");
      transactionStarted = false;
      res.status(200).json({ data: result.rows[0], message: "Booking confirmed." });
      return;
    }

    const payment = await client.query(
      `
      SELECT 1
      FROM payments
      WHERE booking_id = $1
        AND status IN ('processing', 'succeeded', 'partially_refunded', 'refunded')
      LIMIT 1
      `,
      [bookingId]
    );

    if (payment.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({
        message: "This booking has a payment in progress or completed. Resolve the payment or refund before cancelling.",
      });
      return;
    }

    const result = await client.query(
      `
      UPDATE bookings
      SET status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, cancelled_at, cancellation_reason, updated_at
      `,
      [bookingId, typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by admin"]
    );

    await client.query(
      "UPDATE payments SET status = 'cancelled', updated_at = NOW() WHERE booking_id = $1 AND status IN ('pending', 'failed')",
      [bookingId]
    );
    await client.query(
      `
      INSERT INTO notifications (user_id, booking_id, type, title, message)
      VALUES ($1, $2, 'booking_cancellation', 'Booking cancelled', $3)
      `,
      [booking.user_id, bookingId, "An administrator cancelled your pending booking."]
    );

    await client.query("COMMIT");
    transactionStarted = false;
    res.status(200).json({ data: result.rows[0], message: "Booking cancelled." });
  } catch {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        client = undefined;
      }
    }

    console.error("Unable to update booking status.");
    res.status(500).json({ message: "Unable to update booking status." });
  } finally {
    client?.release();
  }
}

export async function updateAdminBookingDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { bookingId } = req.params;
  const body = req.body;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof bookingId !== "string" || !uuidPattern.test(bookingId)) {
    res.status(400).json({ message: "A valid booking ID is required." });
    return;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ message: "A JSON object is required." });
    return;
  }

  const allowedFields = [
    "check_in",
    "check_out",
    "room_ids",
    "adults",
    "children",
    "special_requests",
  ];
  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
    res.status(400).json({ message: "Provide supported booking details to update." });
    return;
  }

  const hasCheckIn = Object.hasOwn(body, "check_in");
  const hasCheckOut = Object.hasOwn(body, "check_out");
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const isDate = (value: unknown): value is string => {
    if (typeof value !== "string" || !datePattern.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };

  if (
    hasCheckIn !== hasCheckOut ||
    (hasCheckIn &&
      (!isDate(body.check_in) || !isDate(body.check_out) || body.check_out <= body.check_in))
  ) {
    res.status(400).json({ message: "Provide a valid check_in and later check_out date together." });
    return;
  }

  if (
    Object.hasOwn(body, "room_ids") &&
    (!Array.isArray(body.room_ids) ||
      body.room_ids.length < 1 ||
      body.room_ids.length > 10 ||
      body.room_ids.some((id: unknown) => typeof id !== "string" || !uuidPattern.test(id)) ||
      new Set(body.room_ids).size !== body.room_ids.length)
  ) {
    res.status(400).json({ message: "room_ids must contain 1–10 unique valid room IDs." });
    return;
  }

  if (
    (Object.hasOwn(body, "adults") && (!Number.isInteger(body.adults) || body.adults < 1)) ||
    (Object.hasOwn(body, "children") && (!Number.isInteger(body.children) || body.children < 0))
  ) {
    res.status(400).json({ message: "Guest counts must be valid whole numbers." });
    return;
  }

  if (
    Object.hasOwn(body, "special_requests") &&
    body.special_requests !== null &&
    (typeof body.special_requests !== "string" || body.special_requests.length > 2000)
  ) {
    res.status(400).json({ message: "special_requests must be null or at most 2,000 characters." });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult = await client.query(
      `
      SELECT id, user_id, hotel_id, status, check_in, check_out,
             adults, children, special_requests, hold_expires_at
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    const booking = bookingResult.rows[0];
    if (booking.status !== "pending") {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "Only pending bookings can be modified." });
      return;
    }

    if (
      booking.hold_expires_at &&
      new Date(booking.hold_expires_at).getTime() <= Date.now()
    ) {
      await client.query(
        "UPDATE bookings SET status = 'expired', updated_at = NOW() WHERE id = $1",
        [bookingId]
      );
      await client.query("COMMIT");
      transactionStarted = false;
      res.status(409).json({ message: "This booking hold has expired." });
      return;
    }

    const payment = await client.query(
      `
      SELECT 1 FROM payments
      WHERE booking_id = $1
        AND status IN ('processing', 'succeeded', 'partially_refunded', 'refunded')
      LIMIT 1
      `,
      [bookingId]
    );

    if (payment.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "A booking with an active or completed payment cannot be modified." });
      return;
    }

    const checkIn = hasCheckIn ? body.check_in as string : booking.check_in;
    const checkOut = hasCheckOut ? body.check_out as string : booking.check_out;
    const adults = Object.hasOwn(body, "adults") ? body.adults as number : booking.adults as number;
    const children = Object.hasOwn(body, "children") ? body.children as number : booking.children as number;
    const specialRequests = Object.hasOwn(body, "special_requests")
      ? body.special_requests as string | null
      : booking.special_requests as string | null;

    const dateCheck = await client.query(
      "SELECT $1::date >= CURRENT_DATE AS check_in_is_valid",
      [checkIn]
    );
    if (!dateCheck.rows[0].check_in_is_valid) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(400).json({ message: "Check-in cannot be in the past." });
      return;
    }

    const requestedRoomIds = Object.hasOwn(body, "room_ids")
      ? body.room_ids as string[]
      : (await client.query(
          "SELECT room_id FROM booking_rooms WHERE booking_id = $1",
          [bookingId]
        )).rows.map((row) => row.room_id as string);

    const rooms = await client.query(
      `
      SELECT r.id, a.hotel_id, a.capacity, a.price_per_night, a.currency
      FROM rooms AS r
      JOIN accommodations AS a ON a.id = r.accommodation_id
      WHERE r.id = ANY($1::uuid[])
        AND r.is_active = TRUE
        AND a.is_active = TRUE
      ORDER BY r.id
      FOR UPDATE OF r
      `,
      [requestedRoomIds]
    );

    if (requestedRoomIds.length === 0 || rooms.rows.length !== requestedRoomIds.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "One or more booking rooms are no longer available." });
      return;
    }

    const hotelIds = new Set(rooms.rows.map((room) => room.hotel_id));
    const currencies = new Set(rooms.rows.map((room) => room.currency));
    const capacity = rooms.rows.reduce((sum, room) => sum + Number(room.capacity), 0);
    if (
      hotelIds.size !== 1 ||
      !hotelIds.has(booking.hotel_id) ||
      currencies.size !== 1 ||
      adults + children > capacity
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(400).json({ message: "Selected rooms must match the booking hotel, currency, and guest capacity." });
      return;
    }

    const overlap = await client.query(
      `
      SELECT 1
      FROM booking_rooms AS br
      JOIN bookings AS b ON b.id = br.booking_id
      WHERE br.room_id = ANY($1::uuid[])
        AND b.id <> $2
        AND b.check_in < $4::date
        AND b.check_out > $3::date
        AND (
          b.status = 'confirmed'
          OR (b.status = 'pending' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > NOW()))
        )
      LIMIT 1
      `,
      [requestedRoomIds, bookingId, checkIn, checkOut]
    );

    if (overlap.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "The selected rooms are already booked for those dates." });
      return;
    }

    if (Object.hasOwn(body, "room_ids")) {
      await client.query("DELETE FROM booking_rooms WHERE booking_id = $1", [bookingId]);
      for (const room of rooms.rows) {
        await client.query(
          "INSERT INTO booking_rooms (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)",
          [bookingId, room.id, room.price_per_night]
        );
      }
    }

    const result = await client.query(
      `
      UPDATE bookings
      SET check_in = $2,
          check_out = $3,
          adults = $4,
          children = $5,
          special_requests = $6,
          hold_expires_at = NOW() + INTERVAL '15 minutes',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, check_in, check_out, adults, children, special_requests,
                status, hold_expires_at, updated_at
      `,
      [bookingId, checkIn, checkOut, adults, children, specialRequests]
    );

    await client.query(
      `
      INSERT INTO notifications (user_id, booking_id, type, title, message)
      VALUES ($1, $2, 'booking_update', 'Booking updated', $3)
      `,
      [booking.user_id, bookingId, "An administrator updated your pending booking."]
    );

    await client.query("COMMIT");
    transactionStarted = false;
    res.status(200).json({ data: result.rows[0], message: "Booking updated." });
  } catch {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        client = undefined;
      }
    }
    console.error("Unable to update booking details.");
    res.status(500).json({ message: "Unable to update booking details." });
  } finally {
    client?.release();
  }
}
