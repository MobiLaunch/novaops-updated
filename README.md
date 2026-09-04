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

**Phase 2 — not yet ported** (business logic preserved for reference under
`legacy-nuxt-server/`, since none of it runs as-is on Vite):
- Square Terminal payments, connection/device status, payouts
- AfterPay checkout
- Email fetching / sending
- Trade-in device price lookup (Gemini)
- PWA/offline support, Electron desktop shell
- Barcode/QR generation, signature capture, house-call scheduling, driver
  setup, calendar/forms tabs, command palette

Porting these means re-implementing each `legacy-nuxt-server/server/api/*`
route as a Vercel serverless function (the same convention mobicare-business
uses under `api/`), since Vite has no server runtime of its own.

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
