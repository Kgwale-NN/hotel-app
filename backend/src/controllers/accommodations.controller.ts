import { Request, Response } from "express";
import pool from "../config/db";

const searchDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !searchDatePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getAccommodations(
  req: Request,
  res: Response
): Promise<void> {
  const { city, country, room_type: roomType, view_type: viewType } = req.query;
  const minPrice = parseNumber(req.query.min_price);
  const maxPrice = parseNumber(req.query.max_price);
  const minCapacity = parseNumber(req.query.min_capacity);
  const pageValue = parseNumber(req.query.page);
  const pageSizeValue = parseNumber(req.query.page_size);
  const checkIn = req.query.check_in;
  const checkOut = req.query.check_out;

  for (const [name, value, maxLength] of [
    ["city", city, 100],
    ["country", country, 100],
    ["room_type", roomType, 50],
    ["view_type", viewType, 50],
  ] as const) {
    if (
      value !== undefined &&
      (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength)
    ) {
      res.status(400).json({ message: `${name} must be a non-empty string of at most ${maxLength} characters.` });
      return;
    }
  }

  if (
    minPrice === null ||
    maxPrice === null ||
    minCapacity === null ||
    (minPrice !== undefined && minPrice < 0) ||
    (maxPrice !== undefined && maxPrice < 0) ||
    (minCapacity !== undefined && (!Number.isInteger(minCapacity) || minCapacity < 1)) ||
    (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
  ) {
    res.status(400).json({ message: "Price and capacity filters must be valid non-negative values." });
    return;
  }

  const page = pageValue ?? 1;
  const pageSize = pageSizeValue ?? 20;

  if (
    pageValue === null ||
    pageSizeValue === null ||
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    res.status(400).json({ message: "Page must be positive and page_size must be between 1 and 100." });
    return;
  }

  if (
    (checkIn === undefined) !== (checkOut === undefined) ||
    (checkIn !== undefined &&
      (!isCalendarDate(checkIn) ||
        !isCalendarDate(checkOut) ||
        checkOut <= checkIn))
  ) {
    res.status(400).json({ message: "Provide a valid check_in and later check_out date together." });
    return;
  }

  const sort = req.query.sort ?? "price_asc";
  const sortExpressions: Record<string, string> = {
    price_asc: "a.price_per_night ASC, a.id",
    price_desc: "a.price_per_night DESC, a.id",
    name_asc: "a.name ASC, a.id",
    rating_desc: "COALESCE(rating_stats.average_rating, 0) DESC, a.price_per_night ASC, a.id",
  };

  if (typeof sort !== "string" || !Object.hasOwn(sortExpressions, sort)) {
    res.status(400).json({ message: "sort must be price_asc, price_desc, name_asc, or rating_desc." });
    return;
  }

  try {
    const values: unknown[] = [];
    const addValue = (value: unknown): string => {
      values.push(value);
      return `$${values.length}`;
    };
    const filters = ["a.is_active = TRUE"];

    if (typeof city === "string") filters.push(`h.city ILIKE ${addValue(`%${city.trim()}%`)}`);
    if (typeof country === "string") filters.push(`h.country ILIKE ${addValue(`%${country.trim()}%`)}`);
    if (typeof roomType === "string") filters.push(`a.room_type = ${addValue(roomType.trim())}`);
    if (typeof viewType === "string") filters.push(`a.view_type = ${addValue(viewType.trim())}`);
    if (minPrice !== undefined) filters.push(`a.price_per_night >= ${addValue(minPrice)}`);
    if (maxPrice !== undefined) filters.push(`a.price_per_night <= ${addValue(maxPrice)}`);
    if (minCapacity !== undefined) filters.push(`a.capacity >= ${addValue(minCapacity)}`);

    if (checkIn !== undefined && typeof checkIn === "string" && typeof checkOut === "string") {
      const checkInParameter = addValue(checkIn);
      const checkOutParameter = addValue(checkOut);
      const dateCheck = await pool.query(
        "SELECT $1::date >= CURRENT_DATE AS check_in_is_valid",
        [checkIn]
      );

      if (!dateCheck.rows[0].check_in_is_valid) {
        res.status(400).json({ message: "Check-in cannot be in the past." });
        return;
      }

      filters.push(`NOT EXISTS (
        SELECT 1
        FROM rooms AS available_room
        JOIN booking_rooms AS br ON br.room_id = available_room.id
        JOIN bookings AS b ON b.id = br.booking_id
        WHERE available_room.accommodation_id = a.id
          AND available_room.is_active = TRUE
          AND b.check_in < ${checkOutParameter}::date
          AND b.check_out > ${checkInParameter}::date
          AND (
            b.status = 'confirmed'
            OR (b.status = 'pending' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > NOW()))
          )
      )`);
      filters.push(`EXISTS (SELECT 1 FROM rooms AS inventory_room WHERE inventory_room.accommodation_id = a.id AND inventory_room.is_active = TRUE)`);
    }

    const fromClause = `
      FROM accommodations AS a
      JOIN hotels AS h ON h.id = a.hotel_id
      LEFT JOIN LATERAL (
        SELECT AVG(rating)::numeric(3, 2) AS average_rating,
               COUNT(*)::integer AS review_count
        FROM reviews
        WHERE accommodation_id = a.id
      ) AS rating_stats ON TRUE
    `;
    const whereClause = `WHERE ${filters.join(" AND ")}`;
    const totalResult = await pool.query(
      `SELECT COUNT(*)::integer AS total ${fromClause} ${whereClause}`,
      values
    );
    const total = totalResult.rows[0].total as number;
    const limitParameter = addValue(pageSize);
    const offsetParameter = addValue((page - 1) * pageSize);

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
        COALESCE(rating_stats.average_rating, 0) AS average_rating,
        COALESCE(rating_stats.review_count, 0) AS review_count,
        (
          SELECT image_url
          FROM accommodation_images
          WHERE accommodation_id = a.id
          ORDER BY sort_order, id
          LIMIT 1
        ) AS cover_image
      ${fromClause}
      ${whereClause}
      ORDER BY ${sortExpressions[sort]}
      LIMIT ${limitParameter} OFFSET ${offsetParameter}
    `, values);

    res.status(200).json({
      data: result.rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
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
