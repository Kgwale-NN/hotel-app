# Deploy the Hotel Heaven backend

Frontend: https://hotel-app-alpha-nine.vercel.app

## Hosting requirements

Use a Node.js web service, a hosted PostgreSQL database, and persistent storage for
backend-uploaded room photos. Local files on an ephemeral host can disappear on a
restart or deployment. Do not point a hosted backend to localhost PostgreSQL.

For a Render web service linked to this repository:

- Root directory: backend
- Build command: npm ci --include=dev && npm run build
- Start command: npm start
- Health check: /api/health
- Set NODE_ENV=production, TRUST_PROXY_HOPS=1. The host supplies PORT.
- Set DATABASE_URL to the hosted database connection URL. Preserve its TLS options.
- Generate a fresh SESSION_SECRET (at least 32 random characters).
- Set FRONTEND_URL=https://hotel-app-alpha-nine.vercel.app
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in hosting environment settings.
- Set GOOGLE_CALLBACK_URL=https://hotel-app-alpha-nine.vercel.app/api/auth/google/callback
- Set PAYSTACK_SECRET_KEY to the test secret while testing.
- Set PAYSTACK_CALLBACK_URL=https://hotel-app-alpha-nine.vercel.app/payments/return
- Mount a persistent disk and set ROOM_PHOTO_DIRECTORY to its room-photo directory.
  Disk-backed Render services require a paid plan. Select the storage plan before
  relying on uploaded photos; do not assume a free service retains uploads.

Never put actual passwords, database URLs or API secrets into Git or frontend variables.

## Database and uploaded photos

Back up the existing hotel_haven database using pg_dump before making any changes.
Restore the backup into the hosted PostgreSQL database to preserve current records,
accounts, room changes and migration history. Do not apply CREATE TABLE migrations
again to that restored database. For a genuinely empty database, apply migrations
in numeric order before starting the app, then deliberately select sample seeds.
Copy existing backend/uploads/rooms files to persistent storage if current records
reference those uploads. Database backup alone does not contain image files.
Keep all backup files outside the Git repository.

## Connect Vercel after obtaining the backend HTTPS URL

The frontend uses relative /api URLs. Its Vite proxy is local-development only.
Configure external rewrites on Vercel, preserving /api and placing that rule before
the SPA fallback. In frontend/vercel.json (Vercel root directory: frontend), use:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-BACKEND-HOST/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Replace YOUR-BACKEND-HOST with the actual deployed host before committing the file.
This keeps requests and session cookies on the frontend origin. Keep cookie
sameSite=lax and secure enabled in production. The backend must trust the actual
hosting HTTPS proxy so express-session can issue secure cookies.

Register the exact GOOGLE_CALLBACK_URL above in the Google OAuth client's authorized
redirect URIs. In Paystack test settings set the webhook to the backend HTTPS URL
plus /api/payments/webhook. It must stay reachable independently of a local tunnel.

## Verify before considering deployment finished

1. Frontend /api/health returns API JSON, not index.html.
2. Frontend room, profile and booking URLs load directly and after refresh.
3. Email/password and Google login retain the session after a refresh; logout works.
4. Accommodations, favourites, reviews and admin access use the hosted database.
5. Test payment records success but leaves the owned booking pending with payment_received=true. Check the admin Notifications inbox, approve the paid reservation, and verify the guest sees confirmed. Replaying verification must not send duplicate notifications or charge again.
6. Admin photo uploads survive a redeploy and display through /api/media.

The hosting service and database are not provisioned by these configuration changes.

The frontend uses optimized WebP assets, a preloaded hero image, lazy images below the fold, and separate route bundles. No new migration is required for the manual-payment-approval changes.
