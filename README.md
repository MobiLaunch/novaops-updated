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
  (ported from `legacy-nuxt-server/`, which is now just historical reference).
  Every action lives behind one dynamic route, `api/square/[action].js` —
  see "Serverless function count" below for why
- AfterPay checkout (demo flow) and AfterPay-via-Square payment processing,
  behind `api/afterpay/[action].js`
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

**Phase 3 — done (bug fixes + deeper website/POS connections):**
- Fixed: creating a ticket, converting a booking, or logging a trade-in used
  to always insert a *new* customer row, even for a repeat customer — now
  matched by phone/email first (`sbFindOrCreateCustomer`)
- Fixed: Bookings had no way to jump to the ticket a conversion created —
  "View Ticket" now deep-links into Tickets
- Fixed: if a payment succeeded but saving it to the ticket failed, the
  modal used to close silently, losing the record of a real charge — it now
  stays open with an explicit warning instead
- **Parts on tickets** — Ticket detail has a Parts Used section: attach an
  inventory item + quantity to a ticket, stock decrements automatically,
  removing a part restores it
- **Parts Orders auto-tracking** — `api/fetch-emails` now recognizes
  shipping-notification emails from your configured parts suppliers
  (Settings → Parts Supplier Emails, matches by address or whole domain),
  extracts a tracking number/carrier and estimated delivery date/time with
  regex heuristics, and: (1) lists them under Messages → Parts Orders, where
  you can assign a shipment to the ticket it's for, and (2) drops a "📦 Parts
  delivery" entry on the Calendar for the estimated date. This is best-effort
  text parsing, not a real carrier integration — always double-check what it
  finds
- **Customer Chat** — Messages → Customer Chat reads/replies to the new
  `customer_messages` table (thread-per-customer, reply box included). A
  matching composer (Account → Messages) was added to mobicare-business on
  branch `claude/customer-chat-widget` — not merged yet, and needs
  `VITE_NOVAOPS_PROFILE_ID` set there before it actually delivers messages
  (see "Customer chat: website side" below)
- Reply capability in the Messages Inbox tab (opens a message, pre-fills
  "Re: " + the sender's address)

**Phase 4 — done:**
- CSV import (`/import`) for Customers and Inventory — customer rows are
  matched by phone/email (safe to re-run), inventory rows are always added
  as new
- Keyboard shortcuts: `Ctrl/⌘+K` search, `?` for a cheat-sheet overlay,
  `G` then a letter to jump to a page (Dashboard/Tickets/Customers/
  Inventory/Messages/Bookings/Settings)
- Notifications bell in the header: pending bookings, low-stock inventory,
  unread Gmail messages, unread customer chats — polls every 60s
- **Electron desktop shell** (`electron/`) — see "Desktop app" below

**Not ported** (out of scope for now — flag if you want these):
- Direct-to-USB thermal label/receipt printing (WebUSB) — labels still print
  fine through a normal printer via the browser print dialog
- Driver/vendor-repair setup dialogs, weather widget — smaller QoL pieces
  from the old app not yet carried over

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

## Serverless function count (Vercel Hobby plan)

Vercel's Hobby plan caps a deployment at **12 serverless functions**. Every
file directly under `api/` (excluding ones starting with `_`, which are
shared helper modules, not routes) counts as one. To stay well under that
with room for new endpoints, every action for a given integration is
handled by a single dynamic route file instead of one file per endpoint:

- `api/square/[action].js` handles all `/api/square/*` requests
  (`connection-test`, `payment`, `terminal`, etc.) — Vercel's `[param]`
  filename syntax captures the path segment into `req.query.action`, which
  the file dispatches on internally. Same for `api/afterpay/[action].js`.
- This means the frontend's URLs (`src/lib/square.ts`) never changed —
  `/api/square/payment` still works exactly as before.

If a `Deployment ERROR` mentions `exceeded_serverless_functions_per_deployment`
after adding a new endpoint, add it as another `case` inside the relevant
`[action].js` file rather than a new top-level file.

## Messages (Gmail sync)

`api/fetch-emails` and `api/send-email` read Gmail OAuth tokens from the
`social_connections` table (`platform = 'gmail'`) — connect that per-profile
however your OAuth flow provisions it, then set `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` for token refresh. Without a Gmail connection,
`send-email` falls back to `SMTP_HOST` / SendGrid / Resend / Mailgun, or
stores the message without delivering it.

## Parts supplier tracking

Add each supplier's email address (or just the domain, e.g. `mobilesentrix.com`
to match any sender there) in Settings → Parts Supplier Emails — defaults to
`konok@mobilesentrix.com` and `support@injuredgadgets.com`. Every Gmail sync
(Messages → Sync Gmail) scans new inbound mail from those senders for a
tracking number and delivery date, and surfaces it in Messages → Parts
Orders plus the Calendar. It's regex-based against common phrasing
("estimated delivery: ...", tracking-number formats for UPS/USPS/FedEx/DHL)
— it will miss unusual formats, and anything it does find should be treated
as a best guess, not confirmed carrier data.

## Customer chat: website side

Messages → Customer Chat on the POS reads and replies to
`customer_messages` (`supabase/migrations/20260905_customer_messages.sql`).
A composer exists on the website too — mobicare-business, branch
`claude/customer-chat-widget` (Account → Messages: chat-bubble thread + reply
box, inserts as the signed-in customer). It's **pushed but not merged to
main** yet — merge it (or open a PR) to ship it.

No environment variable or manual setup is needed for messages to actually
reach the shop: the website inserts a `customer_messages` row without a
`profile_id`, and `supabase/migrations/20260906_customer_messages_auto_profile.sql`
adds a trigger (`customer_messages_fill_profile_id`) that fills it in from
`public.staff_users` (the same admin allowlist the website's own admin
portal trusts) before the row is written. Run that migration once in the
Supabase SQL editor and both sides are connected — this assumes a
single-shop deployment (one enabled `staff_users` row); revisit the trigger
first if that ever changes.

## Desktop app

`electron/` wraps the app in a native window (custom titlebar, app icon,
tray, menu) — it's a **thin wrapper around the deployed web app, not an
offline bundle**. It loads `NOVAOPS_APP_URL` (your deployed URL in
production, `http://localhost:5173` in dev) over HTTPS, the same way a
browser tab would; it does not run the `/api/*` serverless functions
locally. That's deliberate: those functions use `SUPABASE_SERVICE_ROLE_KEY`
and your Square access token, and a distributed desktop binary can always be
unpacked, so those secrets must never be bundled inside one — they stay
server-side on Vercel, exactly as they are for the web app.

```bash
npm run electron:dev     # runs the Vite dev server + Electron together
npm run electron:build   # packages an installer via electron-builder
```

Before running `electron:build`, either set `NOVAOPS_APP_URL` in your build
environment or edit `DEFAULT_PROD_URL` in `electron/main.cjs` to your actual
deployed URL. Packaging was validated by launching the app headlessly
(Xvfb) in this session — the window/tray/menu wiring runs without errors —
but installer output (`.dmg`/`.exe`/`.AppImage`) should be smoke-tested on
each real target OS before distributing it, code-signing included; this
container can't produce or verify signed platform installers.

## Local development

```bash
npm install
npm run dev
```

## Database schema

`supabase/migrations/MASTER_SETUP.sql` is the idempotent one-shot setup for
NovaOps's own tables (`profiles`, `customers`, `tickets`, `inventory`,
`house_calls`, `appointments`, plus the Brand Manager social tables). Run it
once in the Supabase SQL editor for a fresh project, then run every other
`supabase/migrations/*.sql` file in date order (each is idempotent — safe to
re-run). Notably: `20260905_parts_shipments.sql` (the `shipments` table +
`profiles.supplier_emails`), `20260905_customer_messages.sql` (the
`customer_messages` table), and `20260906_customer_messages_auto_profile.sql`
(the trigger that lets the website send chat messages without knowing the
shop's NovaOps user id). mobicare-business's own migrations (`categories`,
`products`, `orders`, `bookings`, `staff_users`, etc.) are separate and live
in that repo.
