import { Request, Response } from "express";
import type { PoolClient } from "pg";
import pool from "../config/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type RoomRow = {
  id: string;
  hotel_id: string;
  capacity: number;
  price_per_night: string;
  currency: string;
};

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validStay(checkIn: unknown, checkOut: unknown): boolean {
  return (
    isCalendarDate(checkIn) &&
    isCalendarDate(checkOut) &&
    checkOut > checkIn
  );
}

export async function getAccommodationAvailability(
  req: Request,
  res: Response
): Promise<void> {
  const { accommodation_id: accommodationId, check_in: checkIn, check_out: checkOut } =
    req.query;

  if (typeof accommodationId !== "string" || !uuidPattern.test(accommodationId)) {
    res.status(400).json({ message: "A valid accommodation ID is required." });
    return;
  }

  if (!validStay(checkIn, checkOut)) {
    res.status(400).json({ message: "Valid check-in and check-out dates are required." });
    return;
  }

  try {
    const dateCheck = await pool.query(
      "SELECT $1::date >= CURRENT_DATE AS check_in_is_valid",
      [checkIn]
    );

    if (!dateCheck.rows[0].check_in_is_valid) {
      res.status(400).json({ message: "Check-in cannot be in the past." });
      return;
    }

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
      SELECT
        r.id,
        r.room_number,
        a.capacity,
        a.price_per_night,
        a.currency,
        NOT EXISTS (
          SELECT 1
          FROM booking_rooms AS br
          JOIN bookings AS b ON b.id = br.booking_id
          WHERE br.room_id = r.id
            AND b.check_in < $3::date
            AND b.check_out > $2::date
            AND (
              b.status = 'confirmed'
              OR (b.status = 'pending' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > NOW()))
            )
        ) AS is_available
      FROM rooms AS r
      JOIN accommodations AS a ON a.id = r.accommodation_id
      WHERE r.accommodation_id = $1
        AND r.is_active = TRUE
        AND a.is_active = TRUE
      ORDER BY r.room_number, r.id
      `,
      [accommodationId, checkIn, checkOut]
    );

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to check room availability.");
    res.status(500).json({ message: "Unable to check room availability." });
  }
}

export async function createBooking(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const roomIds = body.room_ids;
  const checkIn = body.check_in;
  const checkOut = body.check_out;
  const adults = body.adults;
  const children = body.children ?? 0;
  const specialRequests = body.special_requests ?? null;
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  if (
    !Array.isArray(roomIds) ||
    roomIds.length < 1 ||
    roomIds.length > 10 ||
    roomIds.some((id) => typeof id !== "string" || !uuidPattern.test(id)) ||
    new Set(roomIds).size !== roomIds.length
  ) {
    res.status(400).json({
      message: "Choose between 1 and 10 unique rooms using valid room IDs.",
    });
    return;
  }

  if (!validStay(checkIn, checkOut)) {
    res.status(400).json({ message: "Valid check-in and check-out dates are required." });
    return;
  }

  if (
    !Number.isInteger(adults) ||
    (adults as number) < 1 ||
    !Number.isInteger(children) ||
    (children as number) < 0
  ) {
    res.status(400).json({ message: "Guest counts must be valid whole numbers." });
    return;
  }

  if (
    specialRequests !== null &&
    (typeof specialRequests !== "string" || specialRequests.length > 2000)
  ) {
    res.status(400).json({ message: "Special requests must be 2,000 characters or fewer." });
    return;
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

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

    const roomResult = await client.query<RoomRow>(
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
      [roomIds]
    );

    if (roomResult.rows.length !== roomIds.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(404).json({ message: "One or more selected rooms are unavailable." });
      return;
    }

    const rooms = roomResult.rows;
    const hotelIds = new Set(rooms.map((room) => room.hotel_id));
    const currencies = new Set(rooms.map((room) => room.currency));
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);

    if (hotelIds.size !== 1 || currencies.size !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(400).json({ message: "All selected rooms must belong to one hotel and use one currency." });
      return;
    }

    if ((adults as number) + (children as number) > totalCapacity) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(400).json({ message: "The selected rooms do not have enough guest capacity." });
      return;
    }

    const conflict = await client.query(
      `
      SELECT 1
      FROM booking_rooms AS br
      JOIN bookings AS b ON b.id = br.booking_id
      WHERE br.room_id = ANY($1::uuid[])
        AND b.check_in < $3::date
        AND b.check_out > $2::date
        AND (
          b.status = 'confirmed'
          OR (b.status = 'pending' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > NOW()))
        )
      LIMIT 1
      `,
      [roomIds, checkIn, checkOut]
    );

    if (conflict.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "One or more selected rooms are already booked for those dates." });
      return;
    }

    const bookingResult = await client.query(
      `
    INSERT INTO bookings (
  user_id, hotel_id, check_in, check_out, adults, children,
  status, currency, special_requests, hold_expires_at, payment_due_at
)
VALUES (
  $1, $2, $3, $4, $5, $6, 'pending', $7, $8, NULL,
  GREATEST(NOW(), $3::date::timestamptz - INTERVAL '7 days')
)
RETURNING id, user_id, hotel_id, check_in, check_out, adults, children,
          status, currency, special_requests, hold_expires_at,
          payment_due_at, created_at
      `,
      [
        userId,
        rooms[0].hotel_id,
        checkIn,
        checkOut,
        adults,
        children,
        rooms[0].currency,
        specialRequests,
      ]
    );
    const booking = bookingResult.rows[0];

    for (const room of rooms) {
      await client.query(
        `
        INSERT INTO booking_rooms (booking_id, room_id, price_per_night)
        VALUES ($1, $2, $3)
        `,
        [booking.id, room.id, room.price_per_night]
      );
    }

    await client.query(
      `
      INSERT INTO notifications (user_id, booking_id, type, title, message)
      VALUES ($1, $2, 'booking_update', 'Reservation created', $3)
      `,
      [
        userId,
        booking.id,
        "Your room is reserved. Pay online by the deadline shown in your booking details.",
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({
      data: {
        ...booking,
        rooms: rooms.map((room) => ({
          id: room.id,
          price_per_night: room.price_per_night,
        })),
      },
      message: "Reservation created. Complete online payment by the deadline shown in your booking details.",
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
      res.status(409).json({ message: "A selected room is no longer available." });
      return;
    }

    console.error("Unable to create booking.");
    res.status(500).json({ message: "Unable to create booking." });
  } finally {
    client?.release();
  }
}

export async function getMyBookings(
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
        b.id,
        b.hotel_id,
        h.name AS hotel_name,
        b.check_in,
        b.check_out,
        b.adults,
        b.children,
        b.status,
        b.payment_due_at,
        b.currency,
        b.taxes_and_fees,
        b.created_at,
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
      JOIN hotels AS h ON h.id = b.hotel_id
      LEFT JOIN booking_rooms AS br ON br.booking_id = b.id
      LEFT JOIN rooms AS r ON r.id = br.room_id
      LEFT JOIN accommodations AS a ON a.id = r.accommodation_id
      WHERE b.user_id = $1
      GROUP BY b.id, h.name
      ORDER BY b.created_at DESC, b.id
      `,
      [userId]
    );

    res.status(200).json({ data: result.rows });
  } catch {
    console.error("Unable to retrieve your bookings.");
    res.status(500).json({ message: "Unable to retrieve your bookings." });
  }
}

export async function getMyBookingById(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const userId = req.session.userId;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({ message: "A valid booking ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT
        b.id,
        b.hotel_id,
        h.name AS hotel_name,
        b.check_in,
        b.check_out,
        b.adults,
        b.children,
        b.payment_due_at,
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
      JOIN hotels AS h ON h.id = b.hotel_id
      LEFT JOIN booking_rooms AS br ON br.booking_id = b.id
      LEFT JOIN rooms AS r ON r.id = br.room_id
      LEFT JOIN accommodations AS a ON a.id = r.accommodation_id
      WHERE b.id = $1 AND b.user_id = $2
      GROUP BY b.id, h.name
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    res.status(200).json({ data: result.rows[0] });
  } catch {
    console.error("Unable to retrieve booking details.");
    res.status(500).json({ message: "Unable to retrieve booking details." });
  }
}

export async function cancelMyBooking(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const userId = req.session.userId;
  const body = req.body as Record<string, unknown>;
  const reason = body?.reason;

  if (typeof id !== "string" || !uuidPattern.test(id)) {
    res.status(400).json({ message: "A valid booking ID is required." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "You must sign in first." });
    return;
  }

  if (reason !== undefined && (typeof reason !== "string" || reason.trim().length > 500)) {
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
      `
      SELECT id, status, hold_expires_at
      FROM bookings
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
      `,
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    const booking = bookingResult.rows[0];

    if (
      booking.status === "pending" &&
      booking.hold_expires_at !== null &&
      new Date(booking.hold_expires_at).getTime() <= Date.now()
    ) {
      await client.query(
        "UPDATE bookings SET status = 'expired', updated_at = NOW() WHERE id = $1",
        [id]
      );
      await client.query("COMMIT");
      transactionStarted = false;
      res.status(409).json({ message: "This booking hold has expired." });
      return;
    }

    if (booking.status !== "pending") {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({ message: "Only a pending booking can be cancelled online." });
      return;
    }

    const paymentResult = await client.query(
      `
      SELECT 1
      FROM payments
      WHERE booking_id = $1
        AND status IN ('processing', 'succeeded', 'partially_refunded', 'refunded')
      LIMIT 1
      `,
      [id]
    );

    if (paymentResult.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(409).json({
        message: "This booking has a payment in progress or completed. Contact support to cancel it safely.",
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
      [id, typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by guest"]
    );

    await client.query(
      "UPDATE payments SET status = 'cancelled', updated_at = NOW() WHERE booking_id = $1 AND status IN ('pending', 'failed')",
      [id]
    );

    await client.query(
      `
      INSERT INTO notifications (user_id, booking_id, type, title, message)
      VALUES ($1, $2, 'booking_cancellation', 'Booking cancelled', $3)
      `,
      [userId, id, "Your pending booking was cancelled."]
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

    console.error("Unable to cancel booking.");
    res.status(500).json({ message: "Unable to cancel booking." });
  } finally {
    client?.release();
  }
}
