# NovaOps — Repair Shop Management

Vite + React 19 + HeroUI v3 + Tailwind 4 + Supabase, matching the exact stack
of the [mobicare-business](https://github.com/MobiLaunch/mobicare-business)
website so both apps share one design system and one Supabase project.

## Migration status

This is a from-scratch rebuild of the previous Nuxt 3 + Vuetify 3 app onto
HeroUI v3 (which is React-only, so this was a full framework migration, not a
reskin). It's being delivered in phases:

**Phase 1 — done:**
- Vite/React/HeroUI 3 app shell, shared design tokens, layout, data table
- Supabase-backed Tickets, Customers, Inventory pages
- **Bookings page** — reads the `bookings` table your website's booking
  widget already writes to (same Supabase project), with a **Convert to
  Ticket** action that creates a linked NovaOps ticket from a booking
- Supabase-account sign-in (same auth as the website's admin portal)

**Phase 2 — done:**
- Square: card payments (Web Payments SDK), Terminal checkout + device
  pairing, connection test, payment-readiness check, customers/orders/
  payments/payouts history — all as Vercel serverless functions under `api/`
  (ported from `legacy-nuxt-server/`, which is now just historical reference)
- AfterPay checkout (demo flow — see `api/afterpay/checkout.js`) and
  AfterPay-via-Square payment processing
- **Take Payment** flow on Tickets (Cash / Card / Terminal / Afterpay tabs),
  configured from Settings → Square Payments
- Trade-in device valuation (`/trade-in`) — PriceCharting + Gemini-fallback
  market pricing, the original condition/deduction pricing model, saved to
  the existing `trade_ins` table
- Barcode/QR label printing (Inventory items, ticket tags) and canvas
  signature capture on ticket pickup
- Calendar (`/calendar`) for `appointments` and `house_calls`
- Messages (`/messages`) — Gmail sync (`api/fetch-emails`) and sending
  (`api/send-email`, Gmail API → SMTP → store-only fallback chain)
- Command palette (Cmd/Ctrl+K) searching tickets, customers, inventory, and
  pages
- PWA/offline app shell (installable, `vite-plugin-pwa`) — API/Supabase
  calls are always network-only, never served stale

**Not ported** (out of scope for now — flag if you want these):
- Electron desktop shell
- Direct-to-USB thermal label/receipt printing (WebUSB) — labels still print
  fine through a normal printer via the browser print dialog
- Driver/vendor-repair setup dialogs, import tooling, keyboard-shortcuts
  overlay, notifications panel, weather widget — smaller QoL pieces from the
  old app not yet carried over

See `.env.example` for every environment variable Phase 2 features read.

## Connecting to your website's Supabase project

NovaOps and mobicare-business share one Supabase project. Its `bookings`
table is owned by mobicare-business (written by its `/api/create-booking`
function) and is locked down by Row Level Security: only accounts listed in
`public.staff_users` can read every row.

To manage bookings from NovaOps:

1. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to the same values your
   mobicare-business deployment uses (see `.env.example`).
2. Sign in to NovaOps with a Supabase account that's also a row in
   `public.staff_users` (role `admin`, `enabled = true`) — the same allowlist
   the website's admin portal checks.
3. Run `supabase/migrations/20260904_bookings_ticket_link.sql` once in the
   Supabase SQL editor. It adds the `novaops_ticket_id` column bookings use
   to record which ticket they were converted into.

Without step 2, the Bookings page loads with zero rows (RLS denies silently,
it doesn't error) — the in-app error message explains this too.

## Payments (Square)

Set `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID` / `SQUARE_APPLICATION_ID` as
Vercel env vars, or configure them per-shop from Settings → Square Payments
(stored in the browser, sent as request headers — no redeploy needed). Use
Settings to pair a Terminal device and run "Check Payment Readiness" before
taking a live payment.

## Messages (Gmail sync)

`api/fetch-emails` and `api/send-email` read Gmail OAuth tokens from the
`social_connections` table (`platform = 'gmail'`) — connect that per-profile
however your OAuth flow provisions it, then set `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` for token refresh. Without a Gmail connection,
`send-email` falls back to `SMTP_HOST` / SendGrid / Resend / Mailgun, or
stores the message without delivering it.

## Local development

```bash
npm install
npm run dev
```

## Database schema

`supabase/migrations/MASTER_SETUP.sql` is the idempotent one-shot setup for
NovaOps's own tables (`profiles`, `customers`, `tickets`, `inventory`,
`house_calls`, `appointments`, plus the Brand Manager social tables). Run it
once in the Supabase SQL editor for a fresh project. mobicare-business's own
migrations (`categories`, `products`, `orders`, `bookings`, `staff_users`,
etc.) are separate and live in that repo.
