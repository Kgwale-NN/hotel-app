BEGIN;

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL REFERENCES bookings(id),

    provider VARCHAR(50) NOT NULL,
    provider_payment_id TEXT,
    idempotency_key UUID NOT NULL DEFAULT gen_random_uuid(),

    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_amount_check
        CHECK (amount > 0),

    CONSTRAINT payments_currency_check
        CHECK (currency ~ '^[A-Z]{3}$'),

    CONSTRAINT payments_status_check
        CHECK (
            status IN (
                'pending',
                'processing',
                'succeeded',
                'failed',
                'cancelled',
                'partially_refunded',
                'refunded'
            )
        ),

    CONSTRAINT payments_provider_reference_unique
        UNIQUE (provider, provider_payment_id),

    CONSTRAINT payments_idempotency_key_unique
        UNIQUE (idempotency_key)
);

CREATE INDEX payments_booking_id_index
    ON payments (booking_id);

COMMIT;