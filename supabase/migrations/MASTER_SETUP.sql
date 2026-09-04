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
-- one new column to each of the first two (never recreates, never drops
-- them) and never touches `staff_users` at all. Every other table below —
-- customers, tickets, inventory, house_calls, appointments, messages,
-- trade_ins, shipments, customer_messages, social_connections — is new
-- and belongs entirely to NovaOps.
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


-- ── 0. Helper: updated_at auto-stamp function ─────────────────────────────
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
-- 5. house_calls
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
-- 6. appointments
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
-- 7. messages  (Gmail-synced customer email log — Messages → Inbox)
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
-- 8. trade_ins
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
-- 9. shipments  (parts-order tracking, auto-collected from supplier emails)
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
-- 10. customer_messages  (direct customer <-> shop chat — website Account
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
-- 11. social_connections  (Gmail OAuth tokens for Messages → Sync Gmail)
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
-- 12. bookings — ALTER ONLY. Owned by mobicare-business; NovaOps just needs
--     a column to record which ticket a booking was converted into.
-- ============================================================================

alter table if exists public.bookings
  add column if not exists novaops_ticket_id bigint references public.tickets(id) on delete set null;

create index if not exists bookings_novaops_ticket_id_idx on public.bookings(novaops_ticket_id);


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
-- ============================================================================
