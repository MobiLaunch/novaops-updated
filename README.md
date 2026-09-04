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
A composer now exists on the website too — mobicare-business, branch
`claude/customer-chat-widget` (Account → Messages: chat-bubble thread + reply
box, inserts as the signed-in customer). It's **pushed but not merged**, and
needs one thing before it actually delivers messages to the shop:

Set `VITE_NOVAOPS_PROFILE_ID` in that repo's environment to the shop's
NovaOps Supabase Auth user id (Supabase Dashboard → Authentication → Users →
the account you sign into NovaOps with). Every message the website sends
gets stamped with this as `profile_id`, which is how NovaOps's Messages →
Customer Chat finds it (RLS there scopes everything to
`profile_id = auth.uid()`). Without it, sending shows a clear
"chat isn't configured yet" error instead of failing silently.

Once that's set, merge the branch (or open a PR) to ship it.

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
`profiles.supplier_emails`) and `20260905_customer_messages.sql` (the
`customer_messages` table). mobicare-business's own migrations (`categories`,
`products`, `orders`, `bookings`, `staff_users`, etc.) are separate and live
in that repo.
