import { Request, Response } from "express";
import pool from "../config/db";

export async function updateProfile(
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

  const allowedFields = ["full_name", "phone"];
  const fields = Object.keys(body);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    res.status(400).json({
      message: "Provide full_name and/or phone only.",
    });
    return;
  }

  const hasName = Object.hasOwn(body, "full_name");
  const hasPhone = Object.hasOwn(body, "phone");

  let fullName: string | null = null;
  let phone: string | null = null;

  if (hasName) {
    if (
      typeof body.full_name !== "string" ||
      body.full_name.trim().length === 0 ||
      body.full_name.trim().length > 150
    ) {
      res.status(400).json({
        message: "Full name must contain between 1 and 150 characters.",
      });
      return;
    }

    fullName = body.full_name.trim();
  }

  if (hasPhone) {
    if (body.phone !== null && typeof body.phone !== "string") {
      res.status(400).json({
        message: "Phone must be a string or null.",
      });
      return;
    }

    phone = body.phone === null ? null : body.phone.trim() || null;

    if (
      phone !== null &&
      (phone.length > 30 || !/^\+?[0-9 ()-]{7,30}$/.test(phone))
    ) {
      res.status(400).json({
        message: "Enter a valid phone number, or leave it empty.",
      });
      return;
    }
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = CASE
          WHEN $1::boolean THEN $2::varchar
          ELSE full_name
        END,
        phone = CASE
          WHEN $3::boolean THEN $4::varchar
          ELSE phone
        END,
        updated_at = NOW()
      WHERE id = $5
      RETURNING
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        created_at,
        updated_at
      `,
      [
        hasName,
        fullName,
        hasPhone,
        phone,
        res.locals.user.id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Account not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      data: result.rows[0],
    });
  } catch {
    console.error("Unable to update the profile.");

    res.status(500).json({
      message: "Unable to update your profile.",
    });
  }
}