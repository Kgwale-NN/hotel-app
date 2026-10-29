import pool from "../config/db";

export async function expirePendingBookingHolds(): Promise<number> {
  const result = await pool.query(
    `
    WITH expired AS (
      UPDATE bookings AS b
      SET status = 'expired',
          updated_at = NOW()
      WHERE b.status = 'pending'
        AND (
          (b.hold_expires_at IS NOT NULL AND b.hold_expires_at <= NOW())
          OR (
            b.hold_expires_at IS NULL
            AND b.payment_due_at IS NOT NULL
            AND b.payment_due_at <= NOW()
          )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM payments AS p
          WHERE p.booking_id = b.id
            AND p.status = 'succeeded'
        )
      RETURNING b.id, b.user_id,
        CASE
          WHEN b.hold_expires_at IS NOT NULL AND b.hold_expires_at <= NOW()
            THEN 'hold'
          ELSE 'payment_due'
        END AS expiry_reason
    )
    INSERT INTO notifications (user_id, booking_id, type, title, message)
    SELECT user_id, id, 'booking_update',
           CASE
             WHEN expiry_reason = 'hold' THEN 'Booking hold expired'
             ELSE 'Reservation expired'
           END,
           CASE
             WHEN expiry_reason = 'hold'
               THEN 'Your booking hold expired before payment was completed.'
             ELSE 'Your reservation expired because payment was not received by the due date.'
           END
    FROM expired
    `
  );

  return result.rowCount ?? 0;
}
