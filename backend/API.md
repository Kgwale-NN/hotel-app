# Hotel Haven API

Base URL: `http://localhost:3000/api`

The API uses PostgreSQL-backed sessions. Sign in through `/auth/google` before calling protected routes. State-changing requests require the session's CSRF token in the `X-CSRF-Token` header; retrieve it from `GET /auth/csrf`. Keep the session cookie and CSRF token private.

## Health

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Confirm the API is running |
| GET | `/health/database` | Public | Check database connectivity |

## Authentication and profile

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/auth/google` | Public | Start Google sign-in |
| GET | `/auth/me` | Signed in | Get the current user |
| GET | `/auth/csrf` | Signed in | Get a CSRF token |
| POST | `/auth/logout` | Signed in + CSRF | End the session |
| GET | `/profile` | Signed in | Read the current profile |
| PATCH | `/profile` | Signed in + CSRF | Update `full_name` and/or `phone` |

## Accommodation search

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/accommodations` | Public | Search and paginate active accommodations |
| GET | `/accommodations/:id` | Public | Get active accommodation details |
| GET | `/bookings/availability` | Public | Check room availability for an accommodation and date range |

`GET /accommodations` accepts optional `city`, `country`, `room_type`, `view_type`, `min_price`, `max_price`, `min_capacity`, `check_in`, `check_out`, `sort`, `page`, and `page_size` query parameters. Dates must be supplied together as `YYYY-MM-DD`. Sort values are `price_asc`, `price_desc`, `name_asc`, and `rating_desc`. Page size is limited to 100.

Availability uses `accommodation_id`, `check_in`, and `check_out`. A room is unavailable when a confirmed booking or unexpired pending hold overlaps the requested dates.

## Bookings

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/bookings` | Signed in + CSRF | Create a pending hold for 1–10 rooms |
| GET | `/bookings` | Signed in | List the current user's bookings |
| GET | `/bookings/:id` | Owner | Get one of the current user's bookings |
| POST | `/bookings/:id/cancel` | Owner + CSRF | Cancel a pending unpaid booking |

Booking creation accepts `room_ids`, `check_in`, `check_out`, `adults`, optional `children`, and optional `special_requests`. Holds expire after 15 minutes. The backend locks rooms during booking creation to prevent overlapping bookings. Paid or confirmed bookings cannot be cancelled through the guest endpoint until payment/refund handling is integrated.

Pending holds are changed to `expired` by a periodic server task, and booking create/update/cancel/expiry events add inbox notifications.

## Favourites, reviews, and notifications

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/favourites` | Signed in | List saved accommodations |
| POST | `/favourites/:accommodationId` | Signed in + CSRF | Save an accommodation |
| DELETE | `/favourites/:accommodationId` | Signed in + CSRF | Remove a saved accommodation |
| GET | `/reviews/accommodation/:accommodationId` | Public | List reviews and rating summary |
| POST | `/reviews/:accommodationId` | Signed in + CSRF | Review after a completed stay |
| PATCH | `/reviews/:reviewId` | Owner + CSRF | Edit a review |
| DELETE | `/reviews/:reviewId` | Owner + CSRF | Delete a review |
| GET | `/notifications` | Signed in | List the latest 100 notifications; optional `unread=true` or `unread=false` |
| PATCH | `/notifications/:notificationId/read` | Owner + CSRF | Mark one notification read |
| PATCH | `/notifications/read-all` | Signed in + CSRF | Mark all notifications read |

## Admin

All `/admin` routes require a signed-in admin. Mutations also require CSRF.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/accommodations` | List active and inactive accommodations |
| POST | `/admin/accommodations` | Create an accommodation |
| PATCH | `/admin/accommodations/:id` | Update accommodation fields or visibility |
| DELETE | `/admin/accommodations/:id` | Delete only when bookings and reviews do not reference it |
| POST | `/admin/accommodations/:id/rooms` | Create a physical room |
| PATCH | `/admin/rooms/:roomId` | Change a room number or active status |
| GET | `/admin/accommodations/:id/images` | List accommodation images |
| POST | `/admin/accommodations/:id/images` | Add an HTTP(S) image URL and alt text |
| DELETE | `/admin/images/:imageId` | Delete an accommodation image |
| GET | `/admin/amenities` | List available amenities |
| PUT | `/admin/accommodations/:id/amenities` | Replace the accommodation's amenity links using `amenity_ids` |
| GET | `/admin/bookings` | List bookings; optional `status` filter |
| PATCH | `/admin/bookings/:bookingId` | Confirm after successful payment or cancel a pending unpaid booking |
| PATCH | `/admin/bookings/:bookingId/details` | Modify a pending booking after availability and capacity checks |

## Work still needed

- Select and integrate a payment provider, including verified webhooks, payment failure handling, and refunds.
- Add configurable notification preferences and the actual email/SMS delivery provider if required.
- Add automated API and database integration tests, rate limiting, production origin/security configuration, and deployment instructions.
- Manually verify the newer admin inventory, search, review, notification, and cancellation endpoints against the running app.
