-- Executive Suite sample inventory. Safe to run again without duplicate rooms.
BEGIN;

DO $$
DECLARE
    suite_id UUID;
    suite_hotel_id UUID := '10000000-0000-4000-8000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM hotels WHERE id = suite_hotel_id) THEN
        RAISE EXCEPTION 'Load the sample Hotel Haven hotel before adding Executive Suite.';
    END IF;

    SELECT id INTO suite_id FROM accommodations
    WHERE hotel_id = suite_hotel_id AND name = 'Executive Suite'
    ORDER BY created_at LIMIT 1;

    IF suite_id IS NULL THEN
        INSERT INTO accommodations (
            hotel_id, name, description, room_type, capacity,
            bed_description, price_per_night, currency
        ) VALUES (
            suite_hotel_id, 'Executive Suite',
            'An elegant suite with a king bed and a comfortable seating area for a relaxing stay.',
            'suite', 2, '1 king bed', 5500.00, 'ZAR'
        ) RETURNING id INTO suite_id;
    END IF;

    INSERT INTO rooms (accommodation_id, room_number)
    VALUES (suite_id, '501')
    ON CONFLICT (accommodation_id, room_number) DO NOTHING;
END $$;

COMMIT;
