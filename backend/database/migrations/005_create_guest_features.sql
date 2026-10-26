BEGIN;

CREATE TABLE favourites (
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    accommodation_id UUID NOT NULL
        REFERENCES accommodations(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, accommodation_id)
);

CREATE INDEX favourites_accommodation_id_index
    ON favourites (accommodation_id);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),
    accommodation_id UUID NOT NULL REFERENCES accommodations(id),

    rating SMALLINT NOT NULL,
    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT reviews_rating_check
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT reviews_comment_check
        CHECK (LENGTH(TRIM(comment)) BETWEEN 1 AND 2000),

    CONSTRAINT reviews_user_accommodation_unique
        UNIQUE (user_id, accommodation_id)
);

CREATE INDEX reviews_accommodation_id_index
    ON reviews (accommodation_id);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,

    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notifications_type_check
        CHECK (
            type IN (
                'booking_confirmation',
                'booking_update',
                'booking_cancellation',
                'promotion'
            )
        ),

    CONSTRAINT notifications_title_check
        CHECK (LENGTH(TRIM(title)) > 0),

    CONSTRAINT notifications_message_check
        CHECK (LENGTH(TRIM(message)) > 0)
);

CREATE INDEX notifications_user_created_index
    ON notifications (user_id, created_at DESC);

COMMIT;