BEGIN;

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    hotel_id UUID NOT NULL REFERENCES hotels(id),

    check_in DATE NOT NULL,
    check_out DATE NOT NULL,

    adults SMALLINT NOT NULL CHECK (adults > 0),
    children SMALLINT NOT NULL DEFAULT 0 CHECK (children >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    taxes_and_fees NUMERIC(12, 2) NOT NULL DEFAULT 0,

    special_requests TEXT,
    hold_expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bookings_dates_check
        CHECK (check_out > check_in),

    CONSTRAINT bookings_status_check
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'cancelled',
                'completed',
                'expired'
            )
        ),

    CONSTRAINT bookings_currency_check
        CHECK (currency ~ '^[A-Z]{3}$'),

    CONSTRAINT bookings_taxes_check
        CHECK (taxes_and_fees >= 0)
);

CREATE INDEX bookings_user_id_index
    ON bookings (user_id);

CREATE INDEX bookings_hotel_dates_index
    ON bookings (hotel_id, check_in, check_out);

CREATE TABLE booking_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL
        REFERENCES bookings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id),

    price_per_night NUMERIC(12, 2) NOT NULL
        CHECK (price_per_night >= 0),

    CONSTRAINT booking_rooms_unique
        UNIQUE (booking_id, room_id)
);

CREATE INDEX booking_rooms_room_id_index
    ON booking_rooms (room_id);

COMMIT;