import { isValidPaystackSignature } from "../services/paystack.service";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import pool from "../config/db";
import { initializePaystackCheckout } from "../services/paystack.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BookingPaymentRow = {
  id: string;
  status: string;
  payment_due_at: Date | null;
  currency: string;
  amount: string;
  amount_minor_units: string;
  email: string;
};

export async function initializeBookingPayment(
  req: Request,
  res: Response
): Promise<void> {
  const bookingId = req.params.id;
  const userId = req.session.userId;

  if (typeof bookingId !== "string" || !uuidPattern.test(bookingId)) {
    res.status(400).json({ message: "A valid booking ID is required." });
    return;
  }

  try {
    const bookingResult = await pool.query<BookingPaymentRow>(
      `
      SELECT
        b.id,
        b.status,
        b.payment_due_at,
        b.currency,
        u.email,
        (
          COALESCE(SUM(br.price_per_night * (b.check_out - b.check_in)), 0)
          + b.taxes_and_fees
        )::text AS amount,
        ROUND((
          COALESCE(SUM(br.price_per_night * (b.check_out - b.check_in)), 0)
          + b.taxes_and_fees
        ) * 100)::text AS amount_minor_units
      FROM bookings AS b
      JOIN users AS u ON u.id = b.user_id
      LEFT JOIN booking_rooms AS br ON br.booking_id = b.id
      WHERE b.id = $1 AND b.user_id = $2
      GROUP BY b.id, u.email
      `,
      [bookingId, userId]
    );

    const booking = bookingResult.rows[0];

    if (!booking) {
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    if (booking.status !== "pending") {
      res.status(409).json({ message: "This booking cannot be paid." });
      return;
    }

    if (
      !booking.payment_due_at ||
      new Date(booking.payment_due_at).getTime() <= Date.now()
    ) {
      res.status(409).json({ message: "The payment deadline has passed." });
      return;
    }

    const amountMinorUnits = Number(booking.amount_minor_units);

    if (!Number.isSafeInteger(amountMinorUnits) || amountMinorUnits <= 0) {
      res.status(400).json({ message: "The booking has an invalid payment amount." });
      return;
    }

    const reference = randomUUID();

    const paymentResult = await pool.query<{ id: string }>(
      `
      INSERT INTO payments (
        booking_id, provider, provider_payment_id, amount, currency, status
      )
      VALUES ($1, 'paystack', $2, $3, $4, 'pending')
      RETURNING id
      `,
      [booking.id, reference, booking.amount, booking.currency]
    );

    try {
      const checkout = await initializePaystackCheckout({
        email: booking.email,
        amountMinorUnits,
        currency: booking.currency,
        reference,
        bookingId: booking.id,
      });

      res.status(201).json({
        data: {
          payment_id: paymentResult.rows[0].id,
          checkout_url: checkout.authorization_url,
          reference: checkout.reference,
        },
      });
    } catch {
      await pool.query(
        `
        UPDATE payments
        SET status = 'failed', updated_at = NOW()
        WHERE id = $1
        `,
        [paymentResult.rows[0].id]
      );

      res.status(502).json({ message: "Unable to start Paystack checkout." });
    }
  } catch {
    res.status(500).json({ message: "Unable to initialize booking payment." });
  }
}

type PaystackWebhookEvent = {
  event?: unknown;
  data?: {
    reference?: unknown;
    status?: unknown;
    amount?: unknown;
    currency?: unknown;
  };
};

type WebhookPaymentRow = {
  id: string;
  booking_id: string;
  user_id: string;
  amount: string;
  currency: string;
  status: string;
  booking_status: string;
  payment_due_at: Date | null;
};

export async function handlePaystackWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (
    !rawBody ||
    !isValidPaystackSignature(rawBody, req.get("x-paystack-signature"))
  ) {
    res.status(401).json({ message: "Invalid Paystack signature." });
    return;
  }

  const event = req.body as PaystackWebhookEvent;

  if (event.event !== "charge.success") {
    res.sendStatus(200);
    return;
  }

  const data = event.data;

  if (
    !data ||
    typeof data.reference !== "string" ||
    data.status !== "success" ||
    typeof data.amount !== "number" ||
    !Number.isSafeInteger(data.amount) ||
    typeof data.currency !== "string"
  ) {
    res.status(400).json({ message: "Invalid payment event." });
    return;
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query<WebhookPaymentRow>(
      `
      SELECT
        p.id,
        p.booking_id,
        b.user_id,
        p.amount,
        p.currency,
        p.status,
        b.status AS booking_status,
        b.payment_due_at
      FROM payments AS p
      JOIN bookings AS b ON b.id = p.booking_id
      WHERE p.provider = 'paystack'
        AND p.provider_payment_id = $1
      FOR UPDATE OF p, b
      `,
      [data.reference]
    );

    const payment = result.rows[0];

    if (!payment) {
      await client.query("COMMIT");
      transactionStarted = false;
      res.sendStatus(200);
      return;
    }

    const expectedAmount = Math.round(Number(payment.amount) * 100);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      data.amount !== expectedAmount ||
      data.currency.toUpperCase() !== payment.currency.toUpperCase()
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      res.status(400).json({ message: "Payment details do not match." });
      return;
    }

    if (payment.status === "succeeded") {
      await client.query("COMMIT");
      transactionStarted = false;
      res.sendStatus(200);
      return;
    }

    await client.query(
      `
      UPDATE payments
      SET status = 'succeeded', paid_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [payment.id]
    );

    const deadlineIsFuture =
      payment.payment_due_at !== null &&
      new Date(payment.payment_due_at).getTime() > Date.now();

    if (payment.booking_status === "pending" && deadlineIsFuture) {
      await client.query(
        `
        UPDATE bookings
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = $1
        `,
        [payment.booking_id]
      );

      await client.query(
        `
        INSERT INTO notifications (user_id, booking_id, type, title, message)
        VALUES ($1, $2, 'booking_update', 'Booking confirmed',
                'Your online payment was received and your booking is confirmed.')
        `,
        [payment.user_id, payment.booking_id]
      );
    } else {
      if (payment.booking_status === "pending") {
        await client.query(
          `
          UPDATE bookings
          SET status = 'expired', updated_at = NOW()
          WHERE id = $1
          `,
          [payment.booking_id]
        );
      }

      await client.query(
        `
        INSERT INTO notifications (user_id, booking_id, type, title, message)
        VALUES ($1, $2, 'booking_update', 'Payment needs review',
                'Payment was received after the booking could be confirmed. Please contact the hotel.')
        `,
        [payment.user_id, payment.booking_id]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;
    res.sendStatus(200);
  } catch {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    res.status(500).json({ message: "Unable to process payment event." });
  } finally {
    client.release();
  }
}