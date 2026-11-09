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

Booking creation accepts `room_ids`, `check_in`, `check_out`, `adults`, optional `children`, and optional `special_requests`. New reservations use a payment deadline seven days before check-in (or the current time for closer arrivals); legacy timed holds can also expire. The backend locks rooms during booking creation to prevent overlapping bookings. Paid or confirmed bookings cannot be cancelled through the guest endpoint until payment/refund handling is integrated.

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

## Remaining operational work

- Add email password reset and optional email/SMS delivery. Notifications currently use the in-app inbox.
- Implement refund handling and operational payment reconciliation.
- Use persistent upload storage and maintain database/photo backups.
- Extend isolated tests with real database integration and end-to-end coverage.

## Email and password accounts

Apply `database/migrations/010_add_password_credentials.sql` before using email registration.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/auth/form-token` | Create a session-bound CSRF token before registration or login |
| POST | `/api/auth/register` | Register using `full_name`, `email`, `password`, and optional `remember_me` |
| POST | `/api/auth/login` | Sign in using `email`, `password`, and optional `remember_me` |

Both POST routes require the session cookie and `X-CSRF-Token`. New accounts always receive the normal `guest` role; client-supplied roles are rejected. Registration requires a password of 15–128 characters. Passwords use salted scrypt hashes. Account attempts are limited to 20 requests per IP per 15 minutes in each backend process, including form-token requests. Remember me creates a 30-day cookie; otherwise a browser-session cookie is used. Google accounts continue to use Google; password registration cannot overwrite an existing account.

Google authentication returns to `/auth/return` on `FRONTEND_URL` (default `http://localhost:5173` for development). Set the deployed HTTPS frontend origin in production.

Authentication tests: `npm run build`, then `node --test tests/password-auth.test.cjs`. Database calls in these tests are mocked.

## Uploaded room photos

Admins can manage photos in **Accommodations → Edit listing & rooms → Room photos**. Saving a newly created accommodation leaves the editor open so photos and physical rooms can be added immediately.

| Method | Route (under `/api`) | Purpose |
| --- | --- | --- |
| POST | `/admin/accommodations/:id/images/upload` | Upload or replace a room photo |
| PATCH | `/admin/images/:imageId` | Update `alt_text` and/or set `make_cover: true` |
| GET | `/media/:filename` | Serve an uploaded room photo publicly |

Upload requires an administrator session, `X-CSRF-Token`, and multipart form data: `photo` (one file), `alt_text` (1–250 characters), optional `make_cover` (`"true"` or `"false"`), and optional `replace_image_id` belonging to this accommodation. Do not set a JSON Content-Type on multipart requests. JPG, PNG and WebP files must be at most 5 MB and 25 megapixels. The server checks decoded image content, rejects animated/unsupported images, applies orientation and converts to WebP within 1920×1440 pixels. Replacement retains the image ID and display order unless selected as the main photo. The first image by sort order becomes the listing cover. Deleting the last uploaded photo restores any frontend default image.

Files are stored in `backend/uploads/rooms` by default and excluded from Git. Set `ROOM_PHOTO_DIRECTORY` to an absolute directory on a **persistent volume** when deploying. Back up this folder together with PostgreSQL; database records contain the public `/api/media/...` paths, not file contents. No schema migration is required.

Isolated checks: `npm run build` then `node --test tests/room-photos.test.cjs` from `backend`. These tests mock database calls and use a temporary directory; they do not change real rooms or accounts.

## Booking confirmation receipt

`POST /api/payments/verify` returns `booking_id` for the authenticated owner's matched payment. Successful verification also returns the recorded `amount` (major currency units as a string), `currency`, `payment_status`, and `booking_status`. A successful payment received after the reservation deadline remains `booking_status: expired`; the frontend must not label it confirmed.

`GET /api/bookings/:id` includes `hotel_check_in_time` and `hotel_check_out_time`. The payment return page fetches this exact booking after verification, displays saved room rates, stay dates, taxes/fees and total paid, and links to the matching booking in history. It does not claim email delivery. No migration is required.

Receipt checks: `node --test tests/booking-receipt.test.cjs` from `backend` after building; `node --test tests/bookingReceipt.test.cjs` from `frontend`. Provider and database calls in backend tests are mocked.

## Payment confirmation and remembered sessions

Successful Paystack verification/webhooks record payment and automatically confirm an eligible pending reservation when payment arrives before its deadline. Guest booking responses include `payment_received`; paid reservations cannot start another checkout. The guest receives a booking confirmation and administrators receive an informational notification in the same transaction. Repeated successful events do not duplicate confirmations or notifications.

No admin approval is required for a valid on-time payment. Administrators can still manage reservations. Late payments and cancelled/expired reservations require hotel review; payment does not reopen them.

Email sign-in and Google sign-in both honour Remember me: selected sessions persist for 30 days; unselected sessions use a browser-session cookie. Google sign-in accepts `remember_me=true`. Signup checks password confirmation before sending registration.
