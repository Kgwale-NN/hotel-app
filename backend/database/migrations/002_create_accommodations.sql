BEGIN;

CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    star_rating SMALLINT,
    check_in_time TIME NOT NULL DEFAULT '15:00',
    check_out_time TIME NOT NULL DEFAULT '12:00',
    policies TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (star_rating BETWEEN 1 AND 5),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    capacity SMALLINT NOT NULL CHECK (capacity > 0),
    bed_description VARCHAR(150) NOT NULL,
    size_sqm NUMERIC(8, 2) CHECK (size_sqm > 0),
    view_type VARCHAR(50),
    price_per_night NUMERIC(12, 2) NOT NULL
        CHECK (price_per_night >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR'
        CHECK (currency ~ '^[A-Z]{3}$'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX accommodations_hotel_id_index
    ON accommodations (hotel_id);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accommodation_id UUID NOT NULL REFERENCES accommodations(id),
    room_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (accommodation_id, room_number)
);

CREATE TABLE accommodation_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accommodation_id UUID NOT NULL
        REFERENCES accommodations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(250) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0)
);

CREATE INDEX accommodation_images_accommodation_id_index
    ON accommodation_images (accommodation_id);

CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE accommodation_amenities (
    accommodation_id UUID NOT NULL
        REFERENCES accommodations(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id),
    PRIMARY KEY (accommodation_id, amenity_id)
);

COMMIT;