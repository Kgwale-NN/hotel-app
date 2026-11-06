import { Request, Response } from 'express';
import pool from '../config/db';

export async function completeAdminBooking(req: Request, res: Response): Promise<void> {
  const id = req.params.bookingId;
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(400).json({ message: 'A valid booking ID is required.' });
    return;
  }
  try {
    // One statement makes completion and its notification atomic. The status
    // predicate also prevents duplicate notifications when requests are repeated.
    const result = await pool.query(`
      WITH completed AS (
        UPDATE bookings
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1 AND status = 'confirmed' AND check_out <= CURRENT_DATE
        RETURNING id, user_id, status
      ), notified AS (
        INSERT INTO notifications (user_id, booking_id, type, title, message)
        SELECT user_id, id, 'booking_update', 'Stay completed',
               'Thank you for staying with us. You can now leave a review of your accommodation.'
        FROM completed
        RETURNING id
      )
      SELECT id, status FROM completed
    `, [id]);
    if (result.rows.length) {
      res.json({ data: result.rows[0], message: 'Stay marked as completed.' });
      return;
    }
    const booking = await pool.query('SELECT id, status FROM bookings WHERE id = $1', [id]);
    if (!booking.rows.length) {
      res.status(404).json({ message: 'Booking not found.' });
    } else if (booking.rows[0].status === 'completed') {
      res.json({ data: booking.rows[0], message: 'This stay is already completed.' });
    } else {
      res.status(409).json({ message: 'Only confirmed stays whose checkout date has arrived can be completed.' });
    }
  } catch {
    console.error('Unable to complete booking.');
    res.status(500).json({ message: 'Unable to complete this stay.' });
  }
}
