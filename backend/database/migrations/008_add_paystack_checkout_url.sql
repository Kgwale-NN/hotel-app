BEGIN;

ALTER TABLE payments
    ADD COLUMN checkout_url TEXT;

CREATE UNIQUE INDEX payments_one_active_attempt_per_booking
    ON payments (booking_id)
    WHERE provider = 'paystack'
      AND status IN ('pending', 'processing');

COMMIT;