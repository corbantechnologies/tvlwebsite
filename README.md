# Tamarind Village Website

Next.js 16 site and staff portal for Tamarind Village, Mombasa. Hosted on Vercel; PostgreSQL on Railway (via Drizzle ORM).

## Local development

```bash
npm install
# create .env.local with the variables below
npm run dev
```

Schema changes are versioned migrations in `lib/db/migrations.ts`. They run automatically on the
first request after a deploy, or by hand with `npm run db:migrate`. To change the schema, update
`lib/db/schema.ts` and append a new migration; never edit one that has shipped.

### Checks

```bash
npm run typecheck
npm run lint            # errors fail CI; warnings are the known backlog
npm test                # unit tests
TEST_DATABASE_URL=postgres://localhost/tvl_test npm run test:integration   # needs an empty Postgres database
```

GitHub Actions runs all of these, plus `npm run build`, on every pull request.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Railway Postgres connection string |
| `SESSION_SECRET` | **Required in production.** Signs staff login sessions. Use a long random string. |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (live key in production) |
| `PAYSTACK_SUBACCOUNT_*` | Optional subaccounts per brand (`RESTAURANT`, `DHOW`, `DAWA`, `CASINO`, `VILLAGE`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email (Resend; `EMAIL_FROM` must be on a verified domain) |
| `EMAIL_VILLAGE` | Village reservations inbox: apartment bookings, payment alerts, Village events |
| `EMAIL_RESTAURANT`, `EMAIL_DHOW`, `EMAIL_DAWA`, `EMAIL_GOLDEN_KEY` | Each brand's inbox: its event ticket sales and inquiries (`lib/staffInboxes.ts`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used in emails |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | First admin account (only used on an empty database) |
| `CRON_SECRET` | **Required.** Lets Vercel Cron call `/api/cron/daily` (nightly reconciliation, expiry, daily briefing) |
| `OPS_ALERT_EMAIL` | Who receives urgent website alerts (defaults to `EMAIL_VILLAGE`) |
| `NEXT_PUBLIC_USD_TO_KES_RATE` | KES per USD for guests paying in KES / M-Pesa (default 130) |
| `NEXT_PUBLIC_FREE_CANCELLATION_HOURS` | Free-cancellation window before 2 pm on check-in day (default 48) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number for guest buttons, international format without `+` |
| `REVIEW_EMAILS_ENABLED`, `GOOGLE_REVIEW_URL` | Set to `true` and a review link to send a thank-you email 1 day after check-out |

## How bookings and payments work

1. The booking form calls `POST /api/bookings/checkout`. The server checks blocks and inventory
   (`lib/availability.ts`), recalculates the price (`lib/bookingQuote.ts`) and saves a
   `pending_payment` booking that holds the unit for 30 minutes, then starts the Paystack payment.
2. Paystack calls `POST /api/paystack/webhook`, and the guest's browser calls
   `GET /api/paystack/verify/[reference]` on the confirmation page. Both use the same idempotent
   fulfillment (`lib/bookingPaymentService.ts`), which marks the booking paid exactly once.
3. If a payment arrives for dates that have since been blocked or sold out, it is still recorded
   and flagged "ACTION NEEDED" in the booking's staff notes and in the staff email.

Event tickets follow the same pattern via `POST /api/events/checkout` and `lib/eventTicketService.ts`.

Availability blocks use a **check-out style end date**: a block from the 5th to the 8th blocks the
nights of the 5th, 6th and 7th; guests can check in on the 8th.

### Paystack dashboard

Settings → API Keys & Webhooks → Webhook URL: `https://<your-domain>/api/paystack/webhook`
(the live secret key there must match `PAYSTACK_SECRET_KEY` on Vercel).

Also subscribe the webhook to refund events so refunds started from the admin update automatically.

### Nightly jobs

`vercel.json` schedules `GET /api/cron/daily` at 03:00 UTC (06:00 in Mombasa). It records any paid
Paystack transaction from the last 3 days that the website missed (guests are not emailed), expires
stale unpaid checkouts, sends post-stay review emails when enabled, and emails the reservations inbox
a daily briefing: arrivals, open guest requests, refunds due, recovered payments and abandoned checkouts.

### Recovering payments that never reached the portal

```bash
# DATABASE_URL and PAYSTACK_SECRET_KEY must point at production (e.g. in .env.local)
npm run sync:paystack                 # dry run: lists paid transactions missing from the portal
npm run sync:paystack -- --apply      # records them (guests are never emailed)
```

## Security

All `/api` routes require a staff session except the public endpoints listed in
`lib/auth/apiAccess.ts` (enforced in `proxy.ts`). Add new public endpoints there deliberately.
What each staff role may call or open is defined in `lib/auth/roles.ts`, also enforced in `proxy.ts`.
Login, password reset, checkout and guest lookups are rate limited per IP (`lib/rateLimit.ts`).

`GET /api/health` reports database reachability for an uptime monitor.

## Guides

- Guests: `/guide` (linked from the footer)
- Staff: `/admin/guide`
