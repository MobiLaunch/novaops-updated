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
  `G` then a letter to jump to a page (Dashboard/Point of Sale/Tickets/
  Customers/Inventory/Messages/Bookings/Reports/Settings)
- Notifications bell in the header: pending bookings, low-stock inventory,
  unread Gmail messages, unread customer chats — polls every 60s
- **Electron desktop shell** (`electron/`) — see "Desktop app" below

**Phase 5 — done (bug fixes + UI pass):**
- Fixed: `customers.tags`/`ticket.parts`/`ticket.notes`/`ticket.payments` are
  jsonb array columns — several places read them with `x || []`, which only
  falls back on falsy values, so a truthy non-array (e.g. a row from before
  a schema change) reached `.map()`/`.reduce()` and threw with no error
  boundary. This was the likely cause of the Customers tab going blank.
  `src/lib/utils.ts`'s `asArray()` normalizes these everywhere they're read.
- Fixed a double-asterisk bug on every required form field — the label had
  a manual `" *"` on top of the one `TextField`'s `isRequired` already
  renders.
- Customers page is richer: search, avatars, a Tickets column and Lifetime
  Value column, and a read-only detail modal (contact info, stat tiles,
  full ticket history).
- Dashboard is richer: stat cards now carry a secondary line of context,
  plus Recent Tickets and Upcoming Schedule (appointments + house calls +
  pending bookings merged) sections.
- **Dark mode actually works now** — the full dark palette already existed
  in `globals.css` but nothing ever switched to it. Added a light/dark/
  system toggle in the header (and on Login) that persists to
  `localStorage` and follows the OS live when set to "system".
- Settings page uses a responsive 2-column grid instead of three cards
  stacked in the left ~40% of the screen.
- The header now shows the current page and a "Search… ⌘K" button that
  opens the command palette — previously only reachable by knowing the
  keyboard shortcut.
- Customer chat is fully wired end-to-end — see "Customer chat: website
  side" below.

**Phase 6 — done (more back-and-forth communication + more data):**
- **Public repair tracking page** (`/track/:token`) — every ticket gets a
  `public_token` (an unguessable uuid, separate from its sequential id);
  "Track Repair Link" on a ticket's detail view copies a no-login-required
  URL for the customer showing live status, balance due, and estimated
  ready date, plus a two-way reply thread (`api/track-ticket.js`, service-
  role only, rate-limited) that lands in Messages → Inbox tagged "Track
  link" so replying is just like replying to any other message.
- **Status-change email notifications** — when a ticket's status changes,
  optionally emails the customer (reusing `api/send-email`) with the new
  status and their tracking link. Off by default; enable in Settings →
  Shop Settings.
- **Canned replies** — manage a list of quick-reply templates in Settings
  → Shop Settings; one click inserts one into the Messages Inbox compose
  box or the Customer Chat reply box.
- **Ticket customization** — due date, an assigned technician (color-coded,
  managed in Settings → Technicians), and free-form labels, all editable
  from a ticket's detail view and visible as new Tickets-list columns.
- **Customer customization** — secondary phone, preferred contact method,
  referral source, birthday, and a VIP flag (shown as a star badge in the
  list and detail view).
- **Reports** (`/reports`) — revenue over the last 30 days (line chart),
  tickets by status, top repair issues, a technician revenue leaderboard,
  and inventory value by category.
- New tables: `technicians`, `shop_settings` (business hours, tax rate,
  receipt footer, notification preference, canned replies) — see
  `supabase/schema.sql`, which includes these plus
  the `customers`/`tickets` column additions above; re-run it once (it's
  idempotent) to pick them up on an existing database.

**Phase 7 — done (the actual point-of-sale register):**
- **`/pos`** — a retail checkout register, separate from a repair ticket's
  own "Take Payment" flow. Search/filter the product grid (inventory in
  stock, plus service-type items), tap to add to a cart, adjust quantity,
  or ring up a one-off custom amount. A cart can also pull in an existing
  ticket's remaining balance (`ticketBalanceDue`, price minus payments
  already made) as a line item, so a retail item and a repair pickup settle
  in one transaction.
- **Barcode scanning** — a physical scanner (or manual "type it fast, hit
  Enter") adds an inventory item by SKU, or a ticket's balance via a
  `TKT-<id>` code, using the same window-level keydown-buffer pattern as
  the keyboard shortcuts overlay.
- **Checkout** reuses the same Cash / Card / Terminal / Afterpay
  `PaymentModal` as Tickets' "Take Payment" (now generalized to take an
  amount/reference/note instead of a ticket) — completing a sale writes a
  `pos_sales` row, deducts inventory stock, and (for a ticket line) records
  the payment on that ticket and marks it Completed.
- **Printable receipt** on the success screen, using Settings → Shop
  Settings' new business name/address/phone fields.
- New table: `pos_sales` (id, customer, items jsonb, subtotal/tax/total,
  payment method, status) — see `supabase/schema.sql`;
  re-run it once (it's idempotent) to pick it up on an existing database.
- Keyboard shortcut: `G` then `P` jumps to `/pos`.

**Phase 8 — done (a full accounting suite, replacing Reports):**
- **`/accounting`** (formerly `/reports`, which now redirects) — every
  revenue and expense source normalized into one transaction ledger:
  repair-ticket payments, POS sales, **website orders** (read live from
  mobicare-business's `orders`/`order_items` tables — same shared-project,
  same `staff_users` RLS gate as Bookings), and trade-in payouts (a cash
  outflow). A shared date-range picker (7D/30D/90D/MTD/QTD/YTD/All/Custom)
  drives every tab:
  - **Overview** — total revenue, gross profit, tax collected, net profit,
    trade-in payouts, and AR outstanding at a glance, plus a revenue trend
    chart and breakdowns by source and payment method.
  - **Revenue & P&L** — a real profit-and-loss statement (revenue by
    source → COGS estimate → gross profit → trade-in payouts → net profit
    → a suggested income-tax reserve), plus an accounts-receivable aging
    report (current / 1-30 / 31-60 / 61-90 / 90+ days) for unpaid ticket
    balances.
  - **Sales Tax** — tax collected from POS + website sales, the effective
    rate vs. your configured rate (flags a mismatch), a month-by-month
    breakdown, and a next-filing-due estimate based on Settings → Shop
    Settings' filing frequency.
  - **Ledger** — every transaction, filterable by source, exportable to
    CSV.
  - **Square** — on-demand reconciliation against Square's own payment and
    payout history (real settled deposits and processing fees), flagging
    any gap vs. what NovaOps recorded internally.
  - **Shop Insights** — the original Reports charts (tickets by status,
    top issues, technician leaderboard, inventory value), now scoped to
    the same date range.
  - COGS is estimated from *current* inventory cost (website products
    don't have a cost field at all, so website COGS isn't included) and
    the tax-filing-due date is a planning estimate — both clearly labeled
    as such in the UI, since NovaOps doesn't have a source of truth for
    either.
- New `shop_settings` columns: `tax_filing_frequency`, `income_tax_reserve_pct`
  (Settings → Shop Settings) — see `supabase/schema.sql`;
  re-run it once (it's idempotent) to pick them up on an existing database.
- Keyboard shortcut: `G` then `A` jumps to `/accounting`.

**Not ported** (out of scope for now — flag if you want these):
- Direct-to-USB thermal label/receipt printing (WebUSB) — labels still print
  fine through a normal printer via the browser print dialog
- Driver/vendor-repair setup dialogs, weather widget — smaller QoL pieces
  from the old app not yet carried over

See `.env.example` for every environment variable Phase 2 features read.

## Connecting to your website's Supabase project

NovaOps and mobicare-business share one Supabase project. Its `bookings`
and `orders` (+ `order_items`) tables are owned by mobicare-business
(written by its `/api/create-booking` function and its storefront checkout,
respectively) and are locked down by Row Level Security: only accounts
listed in `public.staff_users` can read every row.

To manage bookings, or see website sales on Accounting, from NovaOps:

1. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to the same values your
   mobicare-business deployment uses (see `.env.example`).
2. Sign in to NovaOps with a Supabase account that's also a row in
   `public.staff_users` (role `admin`, `enabled = true`) — the same allowlist
   the website's admin portal checks.
3. Run `supabase/schema.sql` once in the Supabase SQL
   editor — among everything else it sets up, it adds the
   `novaops_ticket_id` column bookings use to record which ticket they
   were converted into.

Without step 2, the Bookings page loads with zero rows and Accounting's
website revenue reads as empty (RLS denies silently, it doesn't error) —
the in-app messages on both pages explain this too.

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
`customer_messages` (see `supabase/schema.sql`).
A composer exists on the website too — mobicare-business, branch
`claude/customer-chat-widget` (Account → Messages: chat-bubble thread + reply
box, inserts as the signed-in customer). It's **pushed but not merged to
main** yet — merge it (or open a PR) to ship it.

No environment variable or manual setup is needed for messages to actually
reach the shop: the website inserts a `customer_messages` row without a
`profile_id`, and the `customer_messages_fill_profile_id` trigger in `supabase/schema.sql`
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

**Run `supabase/schema.sql` once** in the Supabase SQL editor. It is the
whole schema in one file — safe to run on a brand-new project and safe to
re-run on an existing one, as often as you like.

The fifteen migration files this replaces are gone. Several were from the
old Nuxt version and actively unsafe to run (one installed a trigger on
`auth.users` that breaks every new signup on the website), and the rest had
drifted out of step with each other — which is how a project could end up
missing `messages.gmail_message_id` and fail on setup.

### Who owns what

NovaOps and the website share one Supabase project, so the file is explicit
about which tables it may create:

| Owned by | Tables |
| --- | --- |
| **NovaOps** (this repo, created by `schema.sql`) | `customers`, `tickets`, `inventory`, `appointments`, `house_calls`, `messages`, `customer_messages`, `trade_ins`, `pos_sales`, `shipments`, `technicians`, `shop_settings`, `social_connections` |
| **mobicare-business** (that repo's `src/admin/schemaSql.ts`, applied from its admin Settings) | `staff_users`, `categories`, `products`, `orders`, `order_items`, `bookings`, `site_settings` |
| **Both** — shared, and created by `schema.sql` because neither app was creating it | `profiles` |

`schema.sql` never creates a website-owned table. It adds exactly one column
to them (`bookings.novaops_ticket_id`) and otherwise just reads. Creating
them here would fight the website's own definition and its RLS policies.

`profiles` is the exception in the other direction. Both apps read and write
it — the website for the customer's own name and phone, NovaOps for the
shop's trusted supplier addresses — and both only ever touch the row whose
id is their own auth user. Nothing was inserting that row, so NovaOps's
supplier-email save had no row to update and silently reported success.
`schema.sql` now creates the table, and installs the signup trigger that
gives every auth user a row (backfilling the ones already signed up).

Either apply order works. The website's schema drops and recreates every
policy on its own seven tables, which never touches NovaOps's; NovaOps's
`bookings` column and index are skipped with a notice if that table doesn't
exist yet, so re-run it afterwards.

### Permissions, both halves in one picture

| Tables | Who can see what |
| --- | --- |
| NovaOps's thirteen | RLS on, one policy: `profile_id = auth.uid()`. One shop account, one shop's rows. |
| `customer_messages` | The exception — additionally, a signed-in website customer may read their own thread and post to it, inbound only. Replying as the shop stays with the shop. |
| `profiles` | RLS on, self only: `id = auth.uid()`, reads and writes. |
| Website's seven | RLS owned by the website: public read for the catalogue, `public.is_admin()` for everything else. `is_admin()` checks the `staff_users` allowlist. |

That last row is the cross-app dependency: NovaOps's Bookings page and the
website half of Accounting read through the website's RLS, so they return
nothing at all until the shop's auth user is on that allowlist. Section 7 of
`schema.sql` ships `novaops_grant_staff()` to put it there.

### If it refuses to run

`schema.sql` opens with a preflight that reads the catalogs and stops before
changing anything if a table it manages already exists under the same name
with a different shape — no `profile_id uuid`, a primary key its foreign
keys can't point at, or a `shop_settings` key that would make every settings
save insert a new row. It names every conflict at once instead of failing
partway through on a type error.

`supabase/diagnose.sql` explains what it found. It changes nothing, reports
on both apps' tables and policies in one result, and flags the same
conflicts the preflight does plus the wiring that silently returns empty
lists when it's missing.

`supabase/repair.sql` is the only file here that drops anything, which is
why it is a separate file: running the schema can never cost you data.
It rebuilds a NovaOps table an old migration gave the wrong key type, and
retires the tables no code in either repo reads — but only the ones that are
provably empty. Any that holds rows is reported with its count and left
exactly as it is.

That distinction matters because the Supabase SQL editor runs a file as one
transaction: a section that raises undoes the sections before it. A tidy-up
must never cost you the fix that came first.

Row counts in `diagnose.sql` are counted, not read from
`pg_stat_user_tables` — that statistic can be stale or reset to zero, which
is how a table holding 1859 rows once read as empty.

### The shared device catalogue

The website's booking wizard walks manufacturer → device type → model →
generation off `deviceManufacturers`, which lives in
`site_settings.content` and is edited from that app's Admin → Site Content.
NovaOps reads the same list, so a ticket taken at the counter spells a
device the same way one converted from a website booking does — they write
the same `tickets.device` / `tickets.device_model` columns, and until now
only the website had a vocabulary for them.

`site_settings` is already `public read … using (true)`, so this needs no
permissions of its own — which is also why the catalogue lives there rather
than in a table of its own: the wizard serves anonymous visitors.

`supabase/load-device-catalogue.sql` writes the current catalogue: 40 brands
across 7 device types (Phone, Tablet, Laptop, Desktop, Watch, Audio, Smart
Home), 227 selectable devices, including Apple's full line back to 2019. The
same data ships as the default in the website repo, so a fresh install
already has it; this file is for a project whose `site_settings` row already
exists, because the stored row wins over the defaults. It replaces
`deviceManufacturers` and leaves the rest of site content alone.

`supabase/import-devices.sql` is the earlier path, kept for the legacy data:
it folds the old `devices` table (1859 rows, 22 brands, left behind by the
Nuxt build and read by nothing) into that list. Its `category` column already carries the split the wizard wants —
`"Laptop - XPS"` → type `Laptop`, family `XPS` — and the import splits
`name` on the longest space boundary that still prefixes the family, so
`model || ' ' || generation` always rejoins into the original name. It
**merges**: anything already in the list, including edits made in the Site
Content editor, survives. Re-running it changes nothing.

Two device types are renamed on the way in, both because the table uses a
different word for a bucket the wizard already has: `Smartphone` → `Phone`
and `Headphones` → `Audio`. Without them Apple would end up with both a
"Phone" and a "Smartphone". Anything you don't repair goes in the
`skip_types` array at the top of the file.

### Scanning the device in instead of picking it

When the device is in hand its IMEI is ground truth, so the ticket form leads
with a **Scan IMEI** field and treats the picker as the fallback. A hardware
barcode scanner is a keyboard — it types the digits and sends Enter — so the
field needs no special wiring beyond having focus. The number is on the SIM
tray, the box, in Settings, or from `*#06#` on the customer's own phone,
which shows it as a barcode.

Resolution reuses the trade-in resolver (`api/trade-in/lookup.js`), which
already did IMEI → brand/model for trade-ins. An `identify_only` flag makes
it return straight after resolution: pricing costs two upstream calls that
the ticket form has no use for. It rides on that route rather than a new one
to keep the serverless function count where it is.

Whatever resolves is reconciled against the shared catalogue, so a scanned
ticket spells the device exactly like a picked one — a lookup that bypassed
the catalogue would put a second spelling of the same phone back into the
table. A model the catalogue doesn't have is saved as reported and labelled
as such rather than snapped to the nearest match.

The scanned code always lands in `tickets.serial_number`, even when the
lookup fails, and a failed scan clears a device that an *earlier scan* put
there — leaving one device's name attached to another's IMEI is worse than an
empty field. A device picked by hand is left alone.

NovaOps's ticket form also keeps `DevicePicker`, which searches the flattened
catalogue rather than stepping through four rows of chips — the wizard's
chip layout suits a customer picking one phone, but with the full catalogue
imported a single step can run to eighty-odd options, and at the counter
four clicks per ticket is three too many. Anything typed is still accepted
as-is; the catalogue is a shortcut, never a gate on taking a repair in.

### Policies are additive, so the schema owns them

A permissive policy left by an old migration cannot be narrowed by adding a
correct one beside it: while `using (true)` is attached, the table stays
readable by whoever that policy covers. So `schema.sql` drops *every* policy
on the tables it owns and puts back exactly one. Projects that accumulated
five near-identical policies per table from five migrations end up with one,
and a stray `Anon lookup ticket by number` stops exposing the ticket list.
(Nothing needs it: `api/track-ticket.js` reads with the service role.)

`profiles` gets the same treatment. The website's schema creates no policy
there, so NovaOps owning them removes nothing the website needs.

### Why it can't drift again

Every table is created with only its identity columns, and every other
column is stated once as `add column if not exists`. A fresh install and an
existing one run the *same* statements, so a column can never end up
defined only inside a `create table` that an existing project skips — which
was the exact failure this replaces.

**Adding a column later?** Add one `add column if not exists` line in the
right section. Never put it in a create block.

This is verified rather than assumed: applying the file to a fresh project
and to one built from the old migrations produces byte-identical column
definitions across all 191 columns.

### Views the app reads through

Each exists because PostgREST can't express the query itself:

| Object | Used for |
| --- | --- |
| `inventory.is_low` | Generated column (`stock <= low`). The low-stock filter and every low-stock count — PostgREST can't compare two columns. |
| `customers_with_stats` | Customer rows with ticket count and lifetime value, aggregated in Postgres instead of joining every ticket and sale in the browser. |
| `tickets_with_customer` | The ticket list, searched across the customer's name as well as the ticket's own fields — a PostgREST `or()` only spans columns of the row it filters. |
| `ticket_receivables` | Outstanding balances. Accounts receivable is a live snapshot, not scoped to Accounting's date range, and PostgREST can't compare a price against a sum of a jsonb array. |
| `inventory_summary`, `inventory_categories` | The Inventory header totals and the category suggestions. |
| `customer_chat_threads` | One row per customer conversation for the Messages chat tab. |
| `ticket_paid_total()` | The defensive sum of a ticket's payments array, shared by the views above. |
| `pg_trgm` GIN indexes | Make the `ILIKE '%term%'` searches usable. |

Every view is `security_invoker`, so row-level security applies as the
signed-in user exactly as on the underlying tables.

### After running it

Add your NovaOps sign-in account to the website's `staff_users` allowlist:

```sql
select public.novaops_grant_staff('you@yourshop.com');
```

That allowlist is what the website's RLS checks before letting anyone read
`bookings` and `orders`, and what the customer-chat trigger reads to work
out which shop a website message belongs to. Without it, Bookings and the
website half of Accounting read as empty rather than erroring, and customer
chat inserts fail.

The end of `schema.sql` also carries an optional, commented-out block for
retiring tables left behind by old versions of this app (`vendor_repairs`,
`services`, `expenses`, `square_config`, `device_brands`,
`device_categories`, `device_models`). Nothing in either app reads them.
They are left alone by default because dropping a table destroys its rows —
check what's in them first, then run that block by hand if you want it
tidy.

