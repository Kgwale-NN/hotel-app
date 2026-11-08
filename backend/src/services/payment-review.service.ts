import type { PoolClient } from 'pg';
type PaidBooking = { booking_id: string; user_id: string; booking_status: string };
// Called only on first successful payment while payment and booking rows are locked.
export async function queuePaidBookingReview(client: PoolClient, payment: PaidBooking, beforeDeadline: boolean): Promise<void> {
  const awaitingApproval = payment.booking_status === 'pending' && beforeDeadline;
  if (awaitingApproval) {
    // Paid rooms remain reserved while an administrator reviews the stay.
    await client.query("UPDATE bookings SET hold_expires_at = NULL, updated_at = NOW() WHERE id = $1", [payment.booking_id]);
  }
  if (!awaitingApproval && payment.booking_status === 'pending') {
    await client.query("UPDATE bookings SET status = 'expired', updated_at = NOW() WHERE id = $1", [payment.booking_id]);
  }
  if (['confirmed', 'completed'].includes(payment.booking_status)) return;
  const title = awaitingApproval ? 'Payment received - awaiting approval' : 'Payment needs review';
  const message = awaitingApproval
    ? 'Your payment was received. The hotel will review and confirm your reservation. Please do not pay again.'
    : 'Payment was received for a reservation that cannot be confirmed automatically. Please contact the hotel for review.';
  await client.query(
    "INSERT INTO notifications (user_id, booking_id, type, title, message) VALUES ($1, $2, 'booking_update', $3, $4)",
    [payment.user_id, payment.booking_id, title, message]
  );
  await client.query(
    "INSERT INTO notifications (user_id, booking_id, type, title, message) SELECT id, $1, 'booking_update', $2, $3 FROM users WHERE role = 'admin'",
    [payment.booking_id, awaitingApproval ? 'Paid reservation awaiting approval' : 'Paid reservation needs review',
      awaitingApproval ? 'Payment received. Open Reservations to review and approve booking ' + payment.booking_id + '.' : 'Payment received for an expired or cancelled booking ' + payment.booking_id + '. Contact the guest before taking further action.']
  );
}
