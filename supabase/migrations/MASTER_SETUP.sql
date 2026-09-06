-- ============================================================================
-- NovaOps — MASTER SETUP SQL  (matches the LIVE shared database)
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- This is the single, complete, idempotent script for everything the
-- current React version of NovaOps needs. Safe to re-run any time.
--
-- IMPORTANT — this Supabase project's database is SHARED with the
-- mobicare-business website. `profiles`, `bookings`, and `staff_users`
-- already exist there and are owned by that repo. This script only adds
-- new columns to each of the first two (never recreates, never drops
-- them) and never touches `staff_users` at all. Every other table below —
-- customers, tickets, inventory, pos_sales, house_calls, appointments,
-- messages, trade_ins, shipments, customer_messages, social_connections,
-- technicians, shop_settings — is new and belongs entirely to NovaOps.
--
-- Do NOT run 00000000_core_schema.sql, 20240401_inventory_services.sql,
-- 20240402_vendor_repairs.sql, 20260304_realign_schema.sql,
-- 20260305_separate_settings.sql, or 20260513_square_application_id.sql —
-- they were written for a previous Nuxt version of this app. Some are
-- merely redundant with this file; 00000000_core_schema.sql is actively
-- unsafe (it creates its own `profiles` table and a `handle_new_user`
-- trigger that assumes columns the real `profiles` table doesn't have,
-- which would break every new signup on the website). Each of those files
-- now has a "DO NOT RUN" warning at the top explaining why; they're kept
-- only for history.
--
-- The later dated migrations (20260904_bookings_ticket_link.sql,
-- 20260904_messages_gmail_sync.sql, 20260905_customer_messages.sql,
-- 20260905_parts_shipments.sql, 20260906_customer_messages_auto_profile.sql)
-- ARE already correct and are fully folded into this file — you don't need
-- to run them separately after this one (re-running them is harmless too,
-- everything here is idempotent).
-- ============================================================================


-- ── 0. Extensions + helper: updated_at auto-stamp function ────────────────
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================================
-- 1. profiles — ALTER ONLY. Owned by mobicare-business (id, full_name,
--    phone, ...). NovaOps only needs one extra column, for the parts-
--    supplier-email feature (Settings → Parts Supplier Emails).
-- ============================================================================

alter table if exists public.profiles
  add column if not exists supplier_emails text[] not null default array['konok@mobilesentrix.com', 'support@injuredgadgets.com'];


-- ============================================================================
-- 2. customers
-- ============================================================================

create table if not exists customers (
  id              bigserial    primary key,
  profile_id      uuid         not null references auth.users(id) on delete cascade,
  name            text         not null default '',
  phone           text         not null default '',
  email           text         not null default '',
  address         text         not null default '',
  drivers_license text         not null default '',
  tags            text[]       not null default '{}',
  notes           text         not null default '',
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

create index if not exists customers_profile_id_idx on customers (profile_id);
create index if not exists customers_email_idx      on customers (profile_id, email);
create index if not exists customers_name_idx       on customers (profile_id, name);

alter table customers enable row level security;
drop policy if exists "customers_owner" on customers;
create policy "customers_owner" on customers
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger customers_updated_at
    before update on customers
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Added columns (kept as ALTER so this stays safe to run against a
-- customers table that already exists from an earlier run of this file).
alter table customers add column if not exists secondary_phone   text not null default '';
alter table customers add column if not exists preferred_contact text not null default 'phone'; -- phone | email | sms
alter table customers add column if not exists referral_source   text not null default '';
alter table customers add column if not exists birthday          date;
alter table customers add column if not exists vip                boolean not null default false;


-- ============================================================================
-- 3. tickets
-- ============================================================================

create table if not exists tickets (
  id                  bigserial     primary key,
  profile_id          uuid          not null references auth.users(id) on delete cascade,
  customer_id         bigint        references customers(id) on delete set null,
  device              text          not null default '',
  device_model        text          not null default '',
  device_description  text          not null default '',
  issue               text          not null default '',
  status              text          not null default 'Open',
  priority            text          not null default 'normal',  -- low | normal | high | urgent
  price               numeric(10,2) not null default 0,
  serial_number       text          not null default '',
  warranty_days       integer       not null default 0,
  warranty_start      date,
  photos              jsonb         not null default '[]',
  signature           text,
  notes               jsonb         not null default '[]',
  parts               jsonb         not null default '[]',
  payments            jsonb         not null default '[]',
  time_log            jsonb         not null default '[]',
  tracking            jsonb,
  diagnostics         jsonb,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

create index if not exists tickets_profile_id_idx  on tickets (profile_id);
create index if not exists tickets_status_idx      on tickets (profile_id, status);
create index if not exists tickets_customer_id_idx on tickets (customer_id);
create index if not exists tickets_created_at_idx  on tickets (profile_id, created_at desc);

alter table tickets enable row level security;
drop policy if exists "tickets_owner" on tickets;
create policy "tickets_owner" on tickets
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger tickets_updated_at
    before update on tickets
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Added columns. public_token powers the public "track your repair" page
-- (api/track-ticket.js) — an unguessable id, never the ticket's own
-- sequential bigint id, so a repair can be shared with a customer without
-- exposing or letting them guess at other tickets. assigned_to is added
-- further down, after the technicians table it references exists.
alter table tickets add column if not exists due_date     date;
alter table tickets add column if not exists labels       text[] not null default '{}';
alter table tickets add column if not exists public_token uuid   not null default gen_random_uuid();

create unique index if not exists tickets_public_token_key on tickets(public_token);


-- ============================================================================
-- 4. inventory
-- ============================================================================

create table if not exists inventory (
  id          bigserial     primary key,
  profile_id  uuid          not null references auth.users(id) on delete cascade,
  name        text          not null default '',
  sku         text          not null default '',
  category    text          not null default 'Parts',
  model       text          not null default '',
  stock       integer       not null default 0,
  low         integer       not null default 5,   -- low-stock alert threshold
  cost        numeric(10,2) not null default 0,
  price       numeric(10,2) not null default 0,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

create index if not exists inventory_profile_id_idx on inventory (profile_id);
create index if not exists inventory_sku_idx        on inventory (profile_id, sku) where sku <> '';

alter table inventory enable row level security;
drop policy if exists "inventory_owner" on inventory;
create policy "inventory_owner" on inventory
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger inventory_updated_at
    before update on inventory
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 5. pos_sales  (retail checkout — /pos — separate from tickets, which are
--    repair jobs; a ticket's own balance can still be added to a POS sale
--    as a line item, so mixed carts settle in one transaction)
-- ============================================================================

create table if not exists pos_sales (
  id              bigserial     primary key,
  profile_id      uuid          not null references auth.users(id) on delete cascade,
  customer_id     bigint        references customers(id) on delete set null,
  items           jsonb         not null default '[]',  -- [{name, price, quantity, sku?, ticketId?}]
  subtotal        numeric(10,2) not null default 0,
  tax             numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  payment_method  text          not null default 'cash',
  note            text          not null default '',
  status          text          not null default 'completed', -- completed | refunded | voided
  created_at      timestamptz   not null default now()
);

create index if not exists pos_sales_profile_id_idx on pos_sales (profile_id);
create index if not exists pos_sales_customer_id_idx on pos_sales (customer_id);
create index if not exists pos_sales_created_at_idx on pos_sales (profile_id, created_at desc);

alter table pos_sales enable row level security;
drop policy if exists "pos_sales_owner" on pos_sales;
create policy "pos_sales_owner" on pos_sales
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());


-- ============================================================================
-- 6. house_calls
-- ============================================================================

create table if not exists house_calls (
  id          bigserial    primary key,
  profile_id  uuid         not null references auth.users(id) on delete cascade,
  customer_id bigint       references customers(id) on delete set null,
  description text         not null default '',
  address     text         not null default '',
  date        date,
  time        text         not null default '',
  status      text         not null default 'scheduled',  -- scheduled | completed | cancelled
  notes       text         not null default '',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create index if not exists house_calls_profile_id_idx on house_calls (profile_id);
create index if not exists house_calls_date_idx       on house_calls (profile_id, date);

alter table house_calls enable row level security;
drop policy if exists "house_calls_owner" on house_calls;
create policy "house_calls_owner" on house_calls
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger house_calls_updated_at
    before update on house_calls
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 7. appointments
-- ============================================================================

create table if not exists appointments (
  id          bigserial    primary key,
  profile_id  uuid         not null references auth.users(id) on delete cascade,
  customer_id bigint       references customers(id) on delete set null,
  title       text         not null default '',
  description text         not null default '',
  date        date,
  time        text         not null default '',
  status      text         not null default 'scheduled',  -- scheduled | confirmed | completed | cancelled | no-show
  notes       text         not null default '',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create index if not exists appointments_profile_id_idx on appointments (profile_id);
create index if not exists appointments_date_idx       on appointments (profile_id, date);

alter table appointments enable row level security;
drop policy if exists "appointments_owner" on appointments;
create policy "appointments_owner" on appointments
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger appointments_updated_at
    before update on appointments
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 8. messages  (Gmail-synced customer email log — Messages → Inbox)
-- ============================================================================

create table if not exists messages (
  id                bigserial    primary key,
  profile_id        uuid         not null references auth.users(id) on delete cascade,
  customer_id       bigint       references customers(id) on delete set null,
  customer_name     text         not null default '',
  customer_email    text         not null default '',
  channel           text         not null default 'email',    -- email | sms | chat
  direction         text         not null default 'outbound', -- inbound | outbound
  subject           text         not null default '',
  body              text         not null default '',
  ticket_id         bigint       references tickets(id) on delete set null,
  read              boolean      not null default false,
  delivered         boolean      not null default false,
  gmail_message_id  text,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);

create index if not exists messages_profile_id_idx     on messages (profile_id);
create index if not exists messages_customer_id_idx    on messages (profile_id, customer_id);
create index if not exists messages_customer_email_idx on messages (profile_id, customer_email);
create index if not exists messages_created_at_idx     on messages (profile_id, created_at desc);
create index if not exists messages_ticket_id_idx      on messages (ticket_id) where ticket_id is not null;
create unique index if not exists messages_gmail_message_id_key on messages(gmail_message_id) where gmail_message_id is not null;

alter table messages enable row level security;
drop policy if exists "messages_owner" on messages;
create policy "messages_owner" on messages
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger messages_updated_at
    before update on messages
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 9. trade_ins
-- ============================================================================

create table if not exists trade_ins (
  id                  bigserial    primary key,
  profile_id          uuid         not null references auth.users(id) on delete cascade,
  customer_id         bigint       references customers(id) on delete set null,

  brand               text         not null default '',
  model               text         not null default '',
  model_number        text         not null default '',
  imei                text         not null default '',
  storage             text         not null default '',
  color               text         not null default '',

  condition_grade     text         not null default 'Good',     -- Excellent/Good/Fair/Poor
  age_years           numeric(4,1) not null default 0,
  screen_condition    text         not null default 'Perfect',  -- Perfect/Minor Scratches/Cracked/Shattered
  battery_health      int          not null default 80,
  functional_issues   text[]       not null default '{}',
  cosmetic_issues     text[]       not null default '{}',
  accessories         text[]       not null default '{}',
  icloud_locked       boolean      not null default false,
  frp_locked          boolean      not null default false,

  market_price        numeric(10,2),
  repair_cost_est     numeric(10,2),
  offer_price         numeric(10,2),
  estimated_resale    numeric(10,2),
  estimated_profit    numeric(10,2),

  status              text         not null default 'Pending',  -- Pending/Accepted/Declined/Completed
  notes               text         not null default '',

  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

create index if not exists trade_ins_profile_id_idx  on trade_ins (profile_id);
create index if not exists trade_ins_customer_id_idx on trade_ins (customer_id);
create index if not exists trade_ins_status_idx      on trade_ins (status);

alter table trade_ins enable row level security;
drop policy if exists "trade_ins_owner" on trade_ins;
create policy "trade_ins_owner" on trade_ins
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger trade_ins_updated_at
    before update on trade_ins
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 10. shipments  (parts-order tracking, auto-collected from supplier emails)
-- ============================================================================

create table if not exists shipments (
  id                       bigserial    primary key,
  profile_id               uuid         not null references auth.users(id) on delete cascade,
  ticket_id                bigint       references tickets(id) on delete set null,
  message_id               bigint       references messages(id) on delete set null,
  appointment_id           bigint       references appointments(id) on delete set null,
  supplier_email           text         not null default '',
  supplier_name            text         not null default '',
  tracking_number          text         not null default '',
  carrier                  text         not null default '',
  order_reference          text         not null default '',
  subject                  text         not null default '',
  estimated_delivery_date  date,
  estimated_delivery_time  text         not null default '',
  status                   text         not null default 'in_transit', -- in_transit | delivered | assigned | archived
  notes                    text         not null default '',
  created_at               timestamptz  not null default now(),
  updated_at               timestamptz  not null default now()
);

-- One shipment per synced email (re-syncing Gmail must never duplicate rows).
create unique index if not exists shipments_message_id_key on shipments(message_id) where message_id is not null;

create index if not exists shipments_profile_id_idx    on shipments(profile_id);
create index if not exists shipments_ticket_id_idx     on shipments(ticket_id);
create index if not exists shipments_delivery_date_idx on shipments(profile_id, estimated_delivery_date);

alter table shipments enable row level security;
drop policy if exists "shipments_owner" on shipments;
create policy "shipments_owner" on shipments
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger shipments_updated_at
    before update on shipments
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 11. customer_messages  (direct customer <-> shop chat — website Account
--     → Messages sends here; NovaOps Messages → Customer Chat replies)
-- ============================================================================

create table if not exists customer_messages (
  id                bigserial    primary key,
  profile_id        uuid         not null references auth.users(id) on delete cascade,
  customer_user_id  uuid         references auth.users(id) on delete set null,
  ticket_id         bigint       references tickets(id) on delete set null,
  customer_name     text         not null default '',
  customer_email    text         not null default '',
  direction         text         not null default 'inbound', -- inbound (from customer) | outbound (from shop)
  body              text         not null default '',
  read              boolean      not null default false,
  created_at        timestamptz  not null default now()
);

create index if not exists customer_messages_profile_id_idx on customer_messages(profile_id, created_at desc);
create index if not exists customer_messages_customer_idx   on customer_messages(customer_user_id);
create index if not exists customer_messages_ticket_id_idx  on customer_messages(ticket_id);

alter table customer_messages enable row level security;

-- Shop (the NovaOps account whose profile_id this is) has full access.
drop policy if exists "customer_messages_shop" on customer_messages;
create policy "customer_messages_shop" on customer_messages
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- A signed-in customer may read their own thread and send inbound messages
-- (never post as the shop, never read anyone else's thread).
drop policy if exists "customer_messages_customer_read" on customer_messages;
create policy "customer_messages_customer_read" on customer_messages
  for select using (customer_user_id = auth.uid());

drop policy if exists "customer_messages_customer_insert" on customer_messages;
create policy "customer_messages_customer_insert" on customer_messages
  for insert with check (customer_user_id = auth.uid() and direction = 'inbound');

-- Lets the website insert a row without knowing NovaOps's internal
-- Supabase Auth user id: this trigger fills profile_id in from
-- public.staff_users (the same admin allowlist the website's own admin
-- portal trusts) whenever the inserting client omits it. Assumes a
-- single-shop deployment (one enabled staff_users row).
create or replace function public.customer_messages_fill_profile_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id is null then
    select user_id into new.profile_id
    from public.staff_users
    where enabled = true
    order by created_at asc
    limit 1;
  end if;

  if new.profile_id is null then
    raise exception 'customer_messages: no enabled staff_users row to assign as the shop profile';
  end if;

  return new;
end;
$$;

drop trigger if exists customer_messages_fill_profile_id on customer_messages;
create trigger customer_messages_fill_profile_id
  before insert on customer_messages
  for each row
  execute function public.customer_messages_fill_profile_id();


-- ============================================================================
-- 12. social_connections  (Gmail OAuth tokens for Messages → Sync Gmail)
-- ============================================================================

create table if not exists social_connections (
  id               uuid         primary key default gen_random_uuid(),
  profile_id       uuid         not null references auth.users(id) on delete cascade,
  platform         text         not null,   -- 'gmail' (only platform the current app uses)
  platform_id      text,
  handle           text,
  access_token     text,       -- OAuth access token  ← hidden from browser below
  refresh_token    text,       -- OAuth refresh token ← hidden from browser below
  token_expires_at timestamptz,
  scopes           text[]      not null default '{}',
  connected        boolean     not null default true,
  meta             jsonb       not null default '{}',
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (profile_id, platform)
);

alter table social_connections enable row level security;
drop policy if exists "social_connections_owner_read"  on social_connections;
drop policy if exists "social_connections_owner_write" on social_connections;

create policy "social_connections_owner_read" on social_connections
  for select using (profile_id = auth.uid());

create policy "social_connections_owner_write" on social_connections
  for all
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Hide raw tokens from the browser (service_role, used by api/fetch-emails
-- and api/send-email, bypasses this).
revoke select (access_token, refresh_token) on social_connections from authenticated;

do $$ begin
  create trigger social_connections_updated_at
    before update on social_connections
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 13. technicians  (assignment + color-coding on tickets)
-- ============================================================================

create table if not exists technicians (
  id          bigserial    primary key,
  profile_id  uuid         not null references auth.users(id) on delete cascade,
  name        text         not null,
  color       text         not null default '#7C3AED',
  active      boolean      not null default true,
  created_at  timestamptz  not null default now()
);

create index if not exists technicians_profile_id_idx on technicians (profile_id);

alter table technicians enable row level security;
drop policy if exists "technicians_owner" on technicians;
create policy "technicians_owner" on technicians
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- tickets.assigned_to references technicians, so it's added here, after
-- the table it points to exists.
alter table tickets add column if not exists assigned_to bigint references technicians(id) on delete set null;
create index if not exists tickets_assigned_to_idx on tickets (assigned_to);


-- ============================================================================
-- 14. shop_settings  (one row per shop — business hours, tax rate, receipt
--     footer, customer-notification preferences, canned message replies)
-- ============================================================================

create table if not exists shop_settings (
  profile_id                uuid         primary key references auth.users(id) on delete cascade,
  business_hours            jsonb        not null default '{}',   -- { "mon": {"open":"09:00","close":"18:00","closed":false}, ... }
  tax_rate                  numeric(5,2) not null default 0,
  receipt_footer            text         not null default '',
  notify_on_status_change   boolean      not null default false,
  canned_responses          jsonb        not null default '[]',   -- [{ "title": "...", "body": "..." }]
  created_at                timestamptz  not null default now(),
  updated_at                timestamptz  not null default now()
);

-- Added columns (kept as ALTER so this stays safe against a shop_settings
-- table that already exists from an earlier run of this file) — used on
-- printed receipts (POS → checkout → success → Print Receipt).
alter table shop_settings add column if not exists business_name    text not null default '';
alter table shop_settings add column if not exists business_address text not null default '';
alter table shop_settings add column if not exists business_phone   text not null default '';

-- Added for the Accounting page's tax-estimate section: how often sales tax
-- is filed (drives the "next filing due" estimate) and what share of net
-- profit to set aside for income tax (a configurable reserve, not a filing).
alter table shop_settings add column if not exists tax_filing_frequency   text         not null default 'quarterly';
alter table shop_settings add column if not exists income_tax_reserve_pct numeric(5,2) not null default 25;

alter table shop_settings enable row level security;
drop policy if exists "shop_settings_owner" on shop_settings;
create policy "shop_settings_owner" on shop_settings
  using     (profile_id = auth.uid())
  with check (profile_id = auth.uid());

do $$ begin
  create trigger shop_settings_updated_at
    before update on shop_settings
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 15. bookings — ALTER ONLY. Owned by mobicare-business; NovaOps just needs
--     a column to record which ticket a booking was converted into.
-- ============================================================================

alter table if exists public.bookings
  add column if not exists novaops_ticket_id bigint references public.tickets(id) on delete set null;

create index if not exists bookings_novaops_ticket_id_idx on public.bookings(novaops_ticket_id);



-- ============================================================================
-- 16. List views, search indexes, and a low-stock flag
--
--     The Customers, Inventory, and Messages pages serve one page of rows at
--     a time rather than downloading their whole table, which needs three
--     things from Postgres: a filter for "stock is at or below its
--     threshold" (PostgREST can't compare two columns), per-customer ticket
--     counts and lifetime value, and indexes that make ILIKE '%term%' usable.
--
--     Every view is security_invoker, so the caller's row-level security
--     applies exactly as on the underlying tables — without it a view runs as
--     its owner and would hand one shop another shop's rows.
-- ============================================================================

create extension if not exists pg_trgm;

-- ─── Inventory ──────────────────────────────────────────────────────────────

-- Generated (not a trigger) so it can never drift from the two columns it's
-- derived from, and stored so it can carry an index.
alter table inventory add column if not exists is_low boolean
  generated always as (stock <= low) stored;

create index if not exists inventory_is_low_idx on inventory (profile_id) where is_low;
create index if not exists inventory_name_trgm_idx on inventory using gin (name gin_trgm_ops);
create index if not exists inventory_sku_trgm_idx  on inventory using gin (sku  gin_trgm_ops);

-- The four figures the Inventory header shows, so the page doesn't read the
-- catalogue to add them up.
create or replace view inventory_summary
with (security_invoker = true) as
select
  profile_id,
  count(*)                                          as item_count,
  coalesce(sum(price * stock), 0)::numeric(12, 2)   as stock_value,
  count(*) filter (where is_low)                    as low_count,
  coalesce(sum(cost * stock), 0)::numeric(12, 2)    as cost_value
from inventory
group by profile_id;

-- Category suggestions for the item form, without reading every row.
create or replace view inventory_categories
with (security_invoker = true) as
select distinct profile_id, category
from inventory
where category <> '';

-- ─── Accounting ─────────────────────────────────────────────────────────────

-- The total recorded against a ticket's payments array. Read defensively:
-- jsonb_array_elements errors on a non-array, and a malformed amount would
-- otherwise fail every query using it, so anything that doesn't look like a
-- number contributes zero rather than raising.
create or replace function ticket_paid_total(payments jsonb)
returns numeric
language sql
immutable
parallel safe
as $fn$
  select coalesce(sum(
    case when p ->> 'amount' ~ '^-?[0-9]+(\.[0-9]+)?$'
         then (p ->> 'amount')::numeric
         else 0 end
  ), 0)
  from jsonb_array_elements(
    case when jsonb_typeof(payments) = 'array' then payments else '[]'::jsonb end
  ) as p
$fn$;

-- Accounts receivable is a live snapshot, not scoped to the report's date
-- range: a ticket left unpaid for a year still belongs in the aging buckets.
-- The Accounting page can't get that by date-filtering tickets, and PostgREST
-- can't compare price against a sum of a jsonb array, so the outstanding
-- balances come from here.
create or replace view ticket_receivables
with (security_invoker = true) as
select
  t.id,
  t.profile_id,
  t.customer_id,
  t.device,
  t.device_model,
  t.due_date,
  t.created_at,
  t.price,
  ticket_paid_total(t.payments)              as paid,
  (t.price - ticket_paid_total(t.payments))  as balance_due
from tickets t
where t.price - ticket_paid_total(t.payments) > 0.01;

-- ─── Customers ──────────────────────────────────────────────────────────────

create index if not exists customers_name_trgm_idx  on customers using gin (name  gin_trgm_ops);
create index if not exists customers_phone_trgm_idx on customers using gin (phone gin_trgm_ops);
create index if not exists customers_email_trgm_idx on customers using gin (email gin_trgm_ops);

-- Lifetime value is what the customer has actually paid: the amounts recorded
-- in each ticket's payments array (via ticket_paid_total, which reads it
-- defensively), plus completed retail sales. Mirrors what the Customers page
-- used to compute in the browser.
create or replace view customers_with_stats
with (security_invoker = true) as
select
  c.*,
  coalesce(t.ticket_count, 0)                              as ticket_count,
  (coalesce(t.paid, 0) + coalesce(s.retail, 0))::numeric(12, 2) as lifetime_value
from customers c
left join lateral (
  select
    count(*)                                     as ticket_count,
    coalesce(sum(ticket_paid_total(tk.payments)), 0) as paid
  from tickets tk
  where tk.customer_id = c.id
) t on true
left join lateral (
  select coalesce(sum(ps.total), 0) as retail
  from pos_sales ps
  where ps.customer_id = c.id
    and ps.status = 'completed'
) s on true;

-- ─── Messages ───────────────────────────────────────────────────────────────

create index if not exists messages_subject_trgm_idx on messages using gin (subject       gin_trgm_ops);
create index if not exists messages_name_trgm_idx    on messages using gin (customer_name gin_trgm_ops);
create index if not exists messages_created_at_idx   on messages (profile_id, created_at desc);
create index if not exists messages_unread_idx       on messages (profile_id) where direction = 'inbound' and not read;

-- One row per customer chat conversation. The Messages page grouped every
-- chat message into threads client-side; it now lists threads from here and
-- fetches the messages of the one that's open.
create or replace view customer_chat_threads
with (security_invoker = true) as
select
  profile_id,
  customer_email,
  max(customer_name)                                              as customer_name,
  count(*)                                                        as message_count,
  count(*) filter (where direction = 'inbound' and not read)      as unread_count,
  max(created_at)                                                 as last_message_at,
  -- The preview line in the conversation list, so opening a thread is the
  -- only thing that fetches its messages.
  (array_agg(body order by created_at desc))[1]                   as last_body
from customer_messages
where customer_email <> ''
group by profile_id, customer_email;

create index if not exists customer_messages_email_idx on customer_messages (profile_id, customer_email, created_at);

-- ─── Tickets ────────────────────────────────────────────────────────────────
-- The ticket list orders by updated_at; only created_at was indexed.

create index if not exists tickets_updated_at_idx on tickets (profile_id, updated_at desc);
create index if not exists tickets_customer_updated_idx on tickets (customer_id, updated_at desc);
create index if not exists tickets_status_updated_idx on tickets (profile_id, status, updated_at desc);

create index if not exists tickets_device_trgm_idx on tickets using gin (device       gin_trgm_ops);
create index if not exists tickets_model_trgm_idx  on tickets using gin (device_model gin_trgm_ops);
create index if not exists tickets_issue_trgm_idx  on tickets using gin (issue        gin_trgm_ops);

-- The ticket list searches across the customer's name as well as the ticket's
-- own fields, which an embedded relation can't do — a PostgREST or() only
-- spans columns of the row it's filtering. Joining the name on as a real
-- column makes one or() cover both, and means the list no longer downloads
-- the customer table to label its rows.
create or replace view tickets_with_customer
with (security_invoker = true) as
select
  t.*,
  coalesce(c.name, '')             as customer_name,
  array_to_string(t.labels, ' ')   as labels_text
from tickets t
left join customers c on c.id = t.customer_id;


-- ─── Grants ─────────────────────────────────────────────────────────────────
-- Supabase's default privileges normally cover objects created here, but
-- these are stated explicitly so the pages don't fail with "permission denied
-- for view" on a project whose defaults were changed. security_invoker means
-- a grant is not a way around row-level security — each caller still only
-- sees their own rows.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on customers_with_stats, inventory_summary, inventory_categories,
                    customer_chat_threads, tickets_with_customer, ticket_receivables to authenticated;
    grant execute on function ticket_paid_total(jsonb) to authenticated;
  end if;
end $$;



-- ============================================================================
-- DONE
-- ============================================================================
--
-- After running this SQL:
--
-- 1. Sign in to NovaOps with any Supabase Auth account on this project —
--    Tickets/Customers/Inventory/Trade-In/Calendar/Messages all scope data
--    to that account's own profile_id automatically, no allowlist needed.
-- 2. To also manage WEBSITE BOOKINGS from NovaOps, that account additionally
--    needs a row in public.staff_users (role 'admin' or 'staff',
--    enabled = true) — the same allowlist the website's own admin portal
--    checks. Without it, the Bookings page loads with zero rows (RLS
--    denies silently, it doesn't error) — the in-app message explains this.
-- 3. Gmail sync (Messages → Sync Gmail) needs a row in social_connections
--    with platform = 'gmail' and valid tokens — see README "Messages
--    (Gmail sync)" for how that connection gets created.
-- 4. Parts supplier tracking already has two default addresses set on
--    profiles.supplier_emails — edit them from Settings → Parts Supplier
--    Emails.
-- 5. Customer chat (website Account → Messages) works immediately, no
--    extra config — see README "Customer chat: website side".
-- 6. Every ticket now has a public_token — the "Track Repair" link on a
--    ticket (Tickets → open a ticket) points customers to
--    /track/<public_token>, a page with no login required.
-- 7. Add technicians from Settings → Technicians before assigning tickets
--    to one.
-- 8. Business hours, tax rate, receipt footer, auto-notify-on-status-change,
--    and canned quick replies all live in shop_settings, edited from
--    Settings → Shop Settings.
-- 9. The retail register (/pos) rings up inventory items and (optionally) a
--    ticket's balance in one sale, saved to pos_sales — separate from a
--    ticket's own payments history, though a ticket line item in a POS sale
--    still records its payment on the ticket and marks it Completed.
-- 10. The Accounting page (/accounting) also reads the website's `orders` +
--     `order_items` tables directly (owned by mobicare-business, same as
--     `bookings` — see note 2 above) to fold website sales into revenue,
--     tax-collected, and the transaction ledger. Same staff_users
--     requirement; without it, that one revenue source just reads as
--     empty instead of erroring. Tax filing frequency and the income-tax
--     reserve percentage used there live in shop_settings too (Settings →
--     Shop Settings).
-- 11. Customers, Inventory, and Messages read through the views in section
--     16 (customers_with_stats, inventory_summary, inventory_categories,
--     customer_chat_threads) and through inventory.is_low. Re-run this file
--     on an existing project to create them — the pages need them to load.
-- ============================================================================
