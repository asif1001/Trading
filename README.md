# Trade Signal Notifier

Production-style MVP web app for receiving trading signals, storing them in Firestore, and sending instant WhatsApp notifications.

## Features (MVP)

- **Admin login** (Firebase Auth email/password)
- **Dashboard** (counts + last signal)
- **Manual Test Signal** page (save-only or save+send)
- **Signal History** page (filter + search + pagination + retry)
- **Webhook endpoint** (`/api/webhook/signal`) with secret header
- **WhatsApp service layer** with **mock mode** (stores mock success)
- **Settings** page (provider selection, number, webhook secret, optional provider secrets)

## Required environment variables

Create `.env.local` (do not commit). Use `env.example.txt` as a template.

- `NEXT_PUBLIC_FIREBASE_*` are used by the browser.
- `FIREBASE_ADMIN_*` are used by server API routes (Firebase Admin SDK).
- `WEBHOOK_SECRET` is used to secure webhook ingestion.

## Run locally

```bash
npm run dev
```

Then open:

- `http://localhost:3000/login`

## Webhook usage

POST:

- `POST http://localhost:3000/api/webhook/signal`

Headers:

- `content-type: application/json`
- `x-webhook-secret: <WEBHOOK_SECRET>`

Body example:

```json
{
  "symbol": "GOLD",
  "signal": "BUY",
  "timeframe": "1h",
  "price": "4746.89",
  "timestamp": "2026-04-12T10:30:00Z"
}
```

## Firebase notes

This repo includes `firebase.json` + `firestore.rules`. The current Firestore rules are **MVP-simple** (any authenticated user can read/write). For production, restrict access to your admin user via custom claims.

The `functions/` folder is included as a starting point for Firebase Hosting rewrite to a function, but it is **not wired** to run the Next.js server in this MVP.
