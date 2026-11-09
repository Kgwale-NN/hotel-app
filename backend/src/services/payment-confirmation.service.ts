import type { PoolClient } from 'pg';

type PaidBooking = { booking_id: string; user_id: string; booking_status: string };
// Called on the first verified successful payment while payment and booking rows are locked.
export async function confirmPaidBooking(client: PoolClient, payment: PaidBooking, beforeDeadline: boolean): Promise<string> {
  if (['confirmed', 'completed'].includes(payment.booking_status)) return payment.booking_status;

  const canConfirm = payment.booking_status === 'pending' && beforeDeadline;
  const status = canConfirm ? 'confirmed' : payment.booking_status === 'pending' ? 'expired' : payment.booking_status;
  if (payment.booking_status === 'pending') {
    await client.query(
      "UPDATE bookings SET status = $2, hold_expires_at = NULL, updated_at = NOW() WHERE id = $1",
      [payment.booking_id, status]
    );
  }
  await client.query(
    "INSERT INTO notifications (user_id, booking_id, type, title, message) VALUES ($1, $2, $3, $4, $5)",
    [payment.user_id, payment.booking_id, canConfirm ? 'booking_confirmation' : 'booking_update',
      canConfirm ? 'Booking confirmed' : 'Payment needs review',
      canConfirm ? 'Your online payment was received and your booking is confirmed.'
        : 'Payment was received for a reservation that cannot be confirmed automatically. Please contact the hotel for review.']
  );
  await client.query(
    "INSERT INTO notifications (user_id, booking_id, type, title, message) SELECT id, $1, 'booking_update', $2, $3 FROM users WHERE role = 'admin'",
    [payment.booking_id, canConfirm ? 'Paid booking confirmed' : 'Paid reservation needs review',
      canConfirm ? 'Payment was verified and booking ' + payment.booking_id + ' was automatically confirmed.'
        : 'Payment received for an expired or cancelled booking ' + payment.booking_id + '. Contact the guest before taking further action.']
  );
  return status;
}
