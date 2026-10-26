BEGIN;

INSERT INTO hotels (
    id,
    name,
    description,
    address,
    city,
    country,
    policies
)
VALUES (
    '10000000-0000-4000-8000-000000000001',
    'Hotel Haven',
    'A peaceful hotel with elegant rooms and welcoming spaces.',
    'Sample address — replace before publishing',
    'Cape Town',
    'South Africa',
    'Development placeholder: final booking and cancellation policies pending.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO accommodations (
    id,
    hotel_id,
    name,
    description,
    room_type,
    capacity,
    bed_description,
    size_sqm,
    view_type,
    price_per_night,
    currency
)
VALUES
(
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Garden Room',
    'A comfortable room overlooking the hotel gardens.',
    'double',
    2,
    '1 king bed',
    35,
    'garden',
    1500.00,
    'ZAR'
),
(
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Deluxe Room',
    'An elegant room with additional space and a seating area.',
    'deluxe',
    2,
    '1 king bed',
    50,
    'garden',
    2200.00,
    'ZAR'
),
(
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Haven Suite',
    'A spacious suite with a separate lounge for a relaxing stay.',
    'suite',
    4,
    '1 king bed and 1 sofa bed',
    85,
    'garden',
    3500.00,
    'ZAR'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (
    accommodation_id,
    room_number
)
VALUES
    ('20000000-0000-4000-8000-000000000001', '101'),
    ('20000000-0000-4000-8000-000000000001', '102'),
    ('20000000-0000-4000-8000-000000000002', '201'),
    ('20000000-0000-4000-8000-000000000002', '202'),
    ('20000000-0000-4000-8000-000000000003', '301')
ON CONFLICT (accommodation_id, room_number) DO NOTHING;

INSERT INTO amenities (name)
VALUES
    ('Wi-Fi'),
    ('Air conditioning'),
    ('Minibar'),
    ('Private bathroom')
ON CONFLICT (name) DO NOTHING;

INSERT INTO accommodation_amenities (
    accommodation_id,
    amenity_id
)
SELECT accommodations.id, amenities.id
FROM accommodations
CROSS JOIN amenities
WHERE accommodations.id IN (
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
)
AND amenities.name IN (
    'Wi-Fi',
    'Air conditioning',
    'Minibar',
    'Private bathroom'
)
ON CONFLICT (accommodation_id, amenity_id) DO NOTHING;

COMMIT;