-- ============================================================================
--  NovaOps — Supabase schema
--  Single source of truth. Run the whole file; re-run it any time.
-- ============================================================================
--
--  OWNERSHIP — this is the part that matters when two apps share one project.
--
--  NovaOps (this repo) OWNS and creates:
--      customers · tickets · inventory · appointments · house_calls
--      messages · customer_messages · trade_ins · pos_sales · shipments
--      technicians · shop_settings · social_connections
--
--  mobicare-business (the website) OWNS and creates:
--      staff_users · categories · products · orders · order_items
--      bookings · site_settings
--    Its schema lives in that repo at src/admin/schemaSql.ts and is applied
--    from its own admin Settings page. This file NEVER creates those tables —
--    it only adds the one column NovaOps needs on `bookings`, and reads the
--    rest. Creating them here would fight the website's definition and its
--    RLS policies.
--
--  SHARED, and created here because neither app was creating it:
--      profiles
--    Both apps read and write it — the website for the customer's own name
--    and phone, NovaOps for the shop's trusted supplier addresses — and both
--    only ever touch the row whose id is their own auth user. Nothing was
--    inserting that row, so NovaOps's supplier-email save had nothing to
--    update and silently did nothing. Section 7 installs the signup trigger
--    that creates it.
--
--  APPLY ORDER — website schema first, then this file. The website's schema
--  drops every policy on its own seven tables before recreating them, so
--  running it second is fine for NovaOps (it never touches these tables) but
--  section 6 below needs `bookings` to already exist.
--
--  PERMISSIONS, both halves in one picture:
--
--    NovaOps tables      RLS on, one policy: profile_id = auth.uid().
--                        One shop account sees one shop's rows.
--    customer_messages   the exception — additionally, a signed-in website
--                        customer may read their own thread and post to it,
--                        inbound only.
--    profiles            RLS on, self only: id = auth.uid(), both directions.
--    Website tables      RLS owned by the website: public read for the
--                        catalogue, `public.is_admin()` for everything else.
--                        is_admin() checks the `staff_users` allowlist, so
--                        NovaOps's Bookings page and the website half of
--                        Accounting only work once the shop's auth user is in
--                        staff_users. Section 7 ships a helper that puts it
--                        there by email.
--
--  HOW THIS FILE AVOIDS THE FAILURE IT REPLACES
--
--  Every table is created with just its identity columns, and every other
--  column is then stated once as `add column if not exists`. A fresh install
--  and an existing one therefore run the *same* statements, so a column can
--  never end up defined only inside a `create table` that an existing project
--  skips. That is exactly how `messages.gmail_message_id` went missing and
--  broke the previous setup script.
--
--  Adding a column later? Add one `add column if not exists` line in the
--  right section. Never put it in a create block.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 0. Preflight — refuse to run against a database this file would damage
--
--    Everything below is safe to re-run, but "safe" assumes the tables it
--    manages are actually NovaOps's. If a table with one of these names
--    already exists and belongs to something else, the `add column`
--    statements would bolt NovaOps columns onto a stranger's table and the
--    foreign keys would fail partway through with a type error that says
--    nothing about the real problem.
--
--    So: check every assumption first, collect every violation, and stop
--    before touching anything. This block only reads catalogs. If it raises,
--    your database is exactly as it was.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare
  t        text;
  pkcols   text;
  pktypes  text;
  n        bigint;
  problems text[] := '{}';
  owned    text[] := array[
              'customers','tickets','inventory','appointments','house_calls',
              'messages','customer_messages','trade_ins','pos_sales','shipments',
              'technicians','shop_settings','social_connections'];
  -- Tables that other rows point at with a bigint foreign key. Their id has
  -- to be a bigint for those constraints to be creatable at all.
  fk_targets text[] := array['customers','tickets','messages','appointments','technicians'];
begin
  -- (a) Every NovaOps table carries `profile_id uuid`. That column is what
  --     each row-level-security policy in section 8 keys on, so a table of
  --     the same name without one is somebody else's.
  foreach t in array owned loop
    if to_regclass('public.' || t) is null then continue; end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t
        and column_name = 'profile_id' and data_type = 'uuid'
    ) then
      problems := problems || format(
        'public.%s exists but has no "profile_id uuid" column, so it is not NovaOps''s table.', t);
    end if;
  end loop;

  -- (b) Foreign-key targets need a single bigint id.
  foreach t in array fk_targets loop
    if to_regclass('public.' || t) is null then continue; end if;
    select string_agg(a.attname, ', ' order by k.ord),
           string_agg(format_type(a.atttypid, a.atttypmod), ', ' order by k.ord)
      into pkcols, pktypes
      from pg_index i
      cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
     where i.indrelid = ('public.' || t)::regclass and i.indisprimary;

    if pkcols is null then
      problems := problems || format('public.%s exists but has no primary key.', t);
    elsif pkcols <> 'id' or pktypes not in ('bigint', 'integer') then
      -- An old migration built this with the wrong key type. If it is empty,
      -- supabase/repair.sql rebuilds it; if it has rows, that is a data
      -- migration and nobody should guess at it.
      execute format('select count(*) from public.%I', t) into n;
      problems := problems || format(
        'public.%s has primary key (%s %s); NovaOps points bigint foreign keys at its id. It holds %s row(s) — %s',
        t, pkcols, pktypes, n,
        case when n = 0
             then 'run supabase/repair.sql to rebuild it, then re-run this file.'
             else 'its rows must be migrated by hand first.' end);
    end if;
  end loop;

  -- (c) Shop settings are upserted on the profile id with no explicit
  --     conflict target, which resolves to the primary key. If that is not
  --     profile_id, every save inserts another row instead of updating one.
  if to_regclass('public.shop_settings') is not null then
    select string_agg(a.attname, ', ' order by k.ord) into pkcols
      from pg_index i
      cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
     where i.indrelid = 'public.shop_settings'::regclass and i.indisprimary;
    if pkcols is distinct from 'profile_id' then
      problems := problems || format(
        'public.shop_settings has primary key (%s); NovaOps upserts settings on profile_id.',
        coalesce(pkcols, 'none'));
    end if;
  end if;

  -- (d) profiles is shared. Its id must be the auth user id.
  if to_regclass('public.profiles') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
        and column_name = 'id' and data_type = 'uuid'
    ) then
      problems := problems ||
        'public.profiles exists but has no "id uuid" column; both apps look their row up by auth user id.';
    end if;
  end if;

  if array_length(problems, 1) > 0 then
    raise exception E'NovaOps schema not applied — this database has % conflict(s):\n\n  * %\n\nNothing was changed. Each line is a table that already exists under a name NovaOps needs, but with a shape NovaOps cannot use. Run supabase/diagnose.sql to see the whole picture, and supabase/repair.sql where a line above says to.',
      array_length(problems, 1), array_to_string(problems, E'\n  * ');
  end if;
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 1. Prerequisites
-- ────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- makes ILIKE '%term%' searches usable

-- Shared by every table below that tracks updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attaches the trigger above without erroring if it is already there.
create or replace function public.novaops_touch_trigger(target regclass)
returns void language plpgsql as $$
declare
  name text := replace(target::text, 'public.', '') || '_updated_at';
begin
  execute format('drop trigger if exists %I on %s', name, target);
  execute format(
    'create trigger %I before update on %s for each row execute function public.set_updated_at()',
    name, target);
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. NovaOps tables
--    Identity only in the create; everything else added below it.
-- ────────────────────────────────────────────────────────────────────────────

-- ─── profiles (shared with the website; one row per auth user) ─────────────
-- Not a NovaOps table and not a website table: both read and write the row
-- belonging to the signed-in user and nothing else. It is created here only
-- because it was being created nowhere, which left NovaOps's supplier-email
-- setting updating zero rows and reporting success.
create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  -- Read and written by the website's account page.
  add column if not exists full_name       text not null default '',
  add column if not exists phone           text not null default '',
  -- Read by NovaOps and by api/fetch-emails.js: the addresses whose mail the
  -- parts-shipment parser is allowed to trust.
  add column if not exists supplier_emails text[] not null
    default array['konok@mobilesentrix.com', 'support@injuredgadgets.com'];

-- ─── customers ──────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists name              text   not null default '',
  add column if not exists phone             text   not null default '',
  add column if not exists email             text   not null default '',
  add column if not exists address           text   not null default '',
  add column if not exists drivers_license   text   not null default '',
  add column if not exists tags              text[] not null default '{}',
  add column if not exists notes             text   not null default '',
  add column if not exists secondary_phone   text   not null default '',
  add column if not exists preferred_contact text   not null default 'phone',
  add column if not exists referral_source   text   not null default '',
  add column if not exists birthday          date,
  add column if not exists vip               boolean not null default false;

-- ─── tickets ────────────────────────────────────────────────────────────────
create table if not exists public.tickets (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets
  add column if not exists customer_id        bigint references public.customers(id) on delete set null,
  add column if not exists device             text    not null default '',
  add column if not exists device_model       text    not null default '',
  add column if not exists device_description text    not null default '',
  add column if not exists issue              text    not null default '',
  add column if not exists status             text    not null default 'Open',
  add column if not exists priority           text    not null default 'normal',
  add column if not exists price              numeric(10,2) not null default 0,
  add column if not exists serial_number      text    not null default '',
  add column if not exists warranty_days      integer not null default 0,
  add column if not exists warranty_start     date,
  add column if not exists photos             jsonb   not null default '[]',
  add column if not exists signature          text,
  add column if not exists notes              jsonb   not null default '[]',
  add column if not exists parts              jsonb   not null default '[]',
  add column if not exists payments           jsonb   not null default '[]',
  add column if not exists time_log           jsonb   not null default '[]',
  add column if not exists tracking           jsonb,
  add column if not exists diagnostics        jsonb,
  add column if not exists due_date           date,
  add column if not exists labels             text[]  not null default '{}',
  -- The customer-facing /track/:token link. Random and separate from `id` so
  -- one link never reveals or lets anyone guess another ticket.
  add column if not exists public_token       uuid    not null default gen_random_uuid();

-- ─── technicians (before tickets.assigned_to can reference it) ──────────────
create table if not exists public.technicians (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.technicians
  add column if not exists name   text    not null default '',
  add column if not exists color  text    not null default '#7C3AED',
  add column if not exists active boolean not null default true;

alter table public.tickets
  add column if not exists assigned_to bigint references public.technicians(id) on delete set null;

-- ─── inventory ──────────────────────────────────────────────────────────────
create table if not exists public.inventory (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory
  add column if not exists name     text    not null default '',
  add column if not exists sku      text    not null default '',
  add column if not exists category text    not null default 'Parts',
  add column if not exists model    text    not null default '',
  add column if not exists stock    integer not null default 0,
  add column if not exists low      integer not null default 5,   -- low-stock threshold
  add column if not exists cost     numeric(10,2) not null default 0,
  add column if not exists price    numeric(10,2) not null default 0;

-- Generated, because PostgREST cannot compare two columns in a filter — the
-- low-stock list and every low-stock count read this instead of stock <= low.
alter table public.inventory
  add column if not exists is_low boolean generated always as (stock <= low) stored;

-- ─── appointments ───────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists customer_id bigint references public.customers(id) on delete set null,
  add column if not exists title       text not null default '',
  add column if not exists description text not null default '',
  add column if not exists date        date,
  add column if not exists time        text not null default '',
  add column if not exists status      text not null default 'scheduled',
  add column if not exists notes       text not null default '';

-- ─── house_calls ────────────────────────────────────────────────────────────
create table if not exists public.house_calls (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.house_calls
  add column if not exists customer_id bigint references public.customers(id) on delete set null,
  add column if not exists description text not null default '',
  add column if not exists address     text not null default '',
  add column if not exists date        date,
  add column if not exists time        text not null default '',
  add column if not exists status      text not null default 'scheduled',
  add column if not exists notes       text not null default '';

-- ─── messages (staff email log + the /track reply channel) ──────────────────
create table if not exists public.messages (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists customer_id      bigint references public.customers(id) on delete set null,
  add column if not exists customer_name    text    not null default '',
  add column if not exists customer_email   text    not null default '',
  add column if not exists channel          text    not null default 'email',    -- email | portal
  add column if not exists direction        text    not null default 'outbound', -- inbound | outbound
  add column if not exists subject          text    not null default '',
  add column if not exists body             text    not null default '',
  add column if not exists ticket_id        bigint references public.tickets(id) on delete set null,
  add column if not exists read             boolean not null default false,
  add column if not exists delivered        boolean not null default false,
  -- Lets a repeat Gmail sync upsert instead of duplicating.
  add column if not exists gmail_message_id text;

-- ─── customer_messages (the website's account chat) ─────────────────────────
-- Written by the website's signed-in customers and read/answered in NovaOps →
-- Messages → Chat. Shared surface: change with care.
create table if not exists public.customer_messages (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.customer_messages
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists ticket_id        bigint references public.tickets(id) on delete set null,
  add column if not exists customer_name    text    not null default '',
  add column if not exists customer_email   text    not null default '',
  add column if not exists direction        text    not null default 'inbound',
  add column if not exists body             text    not null default '',
  add column if not exists read             boolean not null default false;

-- ─── pos_sales (retail register) ────────────────────────────────────────────
create table if not exists public.pos_sales (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.pos_sales
  add column if not exists customer_id    bigint references public.customers(id) on delete set null,
  add column if not exists items          jsonb not null default '[]',
  add column if not exists subtotal       numeric(10,2) not null default 0,
  add column if not exists tax            numeric(10,2) not null default 0,
  add column if not exists total          numeric(10,2) not null default 0,
  add column if not exists payment_method text  not null default 'cash',
  add column if not exists note           text  not null default '',
  -- Accounting reads this: completed counts as revenue, refunded moves into
  -- the period's refund total, voided drops out entirely.
  add column if not exists status         text  not null default 'completed';

-- `add column if not exists` leaves an existing column's default alone, so a
-- default that changed since an earlier release needs saying outright — this
-- one was 'Cash' in an older migration. Without it a fresh install and an
-- upgraded one drift apart.
alter table public.pos_sales alter column payment_method set default 'cash';

-- ─── trade_ins ──────────────────────────────────────────────────────────────
create table if not exists public.trade_ins (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trade_ins
  add column if not exists customer_id       bigint references public.customers(id) on delete set null,
  add column if not exists brand             text not null default '',
  add column if not exists model             text not null default '',
  add column if not exists model_number      text not null default '',
  add column if not exists imei              text not null default '',
  add column if not exists storage           text not null default '',
  add column if not exists color             text not null default '',
  add column if not exists condition_grade   text not null default 'Good',
  add column if not exists age_years         numeric(4,1) not null default 0,
  add column if not exists screen_condition  text not null default 'Perfect',
  add column if not exists battery_health    integer not null default 80,
  add column if not exists functional_issues text[] not null default '{}',
  add column if not exists cosmetic_issues   text[] not null default '{}',
  add column if not exists accessories       text[] not null default '{}',
  add column if not exists icloud_locked     boolean not null default false,
  add column if not exists frp_locked        boolean not null default false,
  add column if not exists market_price      numeric(10,2),
  add column if not exists repair_cost_est   numeric(10,2),
  add column if not exists offer_price       numeric(10,2),
  add column if not exists estimated_resale  numeric(10,2),
  add column if not exists estimated_profit  numeric(10,2),
  add column if not exists status            text not null default 'Pending',
  add column if not exists notes             text not null default '';

-- Keeps a typo'd age or battery reading from quoting an offer above the
-- device's own market price. The app clamps these too; this is the backstop.
alter table public.trade_ins drop constraint if exists trade_ins_age_years_sane;
alter table public.trade_ins add constraint trade_ins_age_years_sane check (age_years >= 0) not valid;
alter table public.trade_ins drop constraint if exists trade_ins_battery_health_sane;
alter table public.trade_ins add constraint trade_ins_battery_health_sane
  check (battery_health between 0 and 100) not valid;

-- ─── shipments (parts orders parsed out of supplier emails) ─────────────────
create table if not exists public.shipments (
  id         bigserial   primary key,
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipments
  add column if not exists ticket_id               bigint references public.tickets(id) on delete set null,
  add column if not exists message_id              bigint references public.messages(id) on delete set null,
  add column if not exists appointment_id          bigint references public.appointments(id) on delete set null,
  add column if not exists supplier_email          text not null default '',
  add column if not exists supplier_name           text not null default '',
  add column if not exists tracking_number         text not null default '',
  add column if not exists carrier                 text not null default '',
  add column if not exists order_reference         text not null default '',
  add column if not exists subject                 text not null default '',
  add column if not exists estimated_delivery_date date,
  add column if not exists estimated_delivery_time text not null default '',
  add column if not exists status                  text not null default 'in_transit',
  add column if not exists notes                   text not null default '';

-- ─── shop_settings (one row per shop; keyed by profile_id, not an id) ───────
create table if not exists public.shop_settings (
  profile_id uuid        primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_settings
  add column if not exists business_name           text not null default '',
  add column if not exists business_address        text not null default '',
  add column if not exists business_phone          text not null default '',
  add column if not exists business_hours          jsonb not null default '{}',
  add column if not exists tax_rate                numeric(5,2) not null default 0,
  add column if not exists tax_filing_frequency    text not null default 'quarterly',
  add column if not exists income_tax_reserve_pct  numeric(5,2) not null default 25,
  add column if not exists receipt_footer          text not null default '',
  add column if not exists notify_on_status_change boolean not null default false,
  add column if not exists canned_responses        jsonb not null default '[]';

-- ─── social_connections (Gmail OAuth tokens for the inbox sync) ─────────────
create table if not exists public.social_connections (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_connections
  add column if not exists platform         text   not null default 'gmail',
  add column if not exists platform_id      text,
  add column if not exists handle           text,
  add column if not exists access_token     text,
  add column if not exists refresh_token    text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists scopes           text[] not null default '{}',
  add column if not exists connected        boolean not null default true,
  add column if not exists meta             jsonb  not null default '{}',
  add column if not exists last_synced_at   timestamptz;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. updated_at triggers
-- ────────────────────────────────────────────────────────────────────────────

select public.novaops_touch_trigger(t) from (values
  ('public.customers'::regclass), ('public.tickets'), ('public.inventory'),
  ('public.appointments'), ('public.house_calls'), ('public.messages'),
  ('public.trade_ins'), ('public.shipments'), ('public.shop_settings'),
  ('public.social_connections'), ('public.profiles')
) as v(t);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
--    Each one backs a query the app actually issues. The trigram indexes are
--    what make the search boxes usable; the rest match the list orderings.
-- ────────────────────────────────────────────────────────────────────────────

create index if not exists customers_profile_id_idx  on public.customers (profile_id);
create index if not exists customers_created_at_idx  on public.customers (profile_id, created_at desc);
create index if not exists customers_name_trgm_idx   on public.customers using gin (name  gin_trgm_ops);
create index if not exists customers_phone_trgm_idx  on public.customers using gin (phone gin_trgm_ops);
create index if not exists customers_email_trgm_idx  on public.customers using gin (email gin_trgm_ops);

create index if not exists tickets_profile_id_idx       on public.tickets (profile_id);
create index if not exists tickets_customer_id_idx      on public.tickets (customer_id);
create index if not exists tickets_created_at_idx       on public.tickets (profile_id, created_at desc);
create index if not exists tickets_updated_at_idx       on public.tickets (profile_id, updated_at desc);
create index if not exists tickets_status_updated_idx   on public.tickets (profile_id, status, updated_at desc);
create index if not exists tickets_customer_updated_idx on public.tickets (customer_id, updated_at desc);
create index if not exists tickets_device_trgm_idx      on public.tickets using gin (device       gin_trgm_ops);
create index if not exists tickets_model_trgm_idx       on public.tickets using gin (device_model gin_trgm_ops);
create index if not exists tickets_issue_trgm_idx       on public.tickets using gin (issue        gin_trgm_ops);
create unique index if not exists tickets_public_token_key on public.tickets (public_token);

create index if not exists inventory_profile_id_idx on public.inventory (profile_id);
create index if not exists inventory_is_low_idx     on public.inventory (profile_id) where is_low;
create index if not exists inventory_name_trgm_idx  on public.inventory using gin (name gin_trgm_ops);
create index if not exists inventory_sku_trgm_idx   on public.inventory using gin (sku  gin_trgm_ops);
create index if not exists inventory_sku_idx        on public.inventory (profile_id, sku) where sku <> '';

create index if not exists appointments_profile_date_idx on public.appointments (profile_id, date);
create index if not exists house_calls_profile_date_idx  on public.house_calls  (profile_id, date);

create index if not exists messages_profile_id_idx     on public.messages (profile_id);
create index if not exists messages_created_at_idx     on public.messages (profile_id, created_at desc);
create index if not exists messages_ticket_id_idx      on public.messages (ticket_id) where ticket_id is not null;
create index if not exists messages_unread_idx         on public.messages (profile_id) where direction = 'inbound' and not read;
create index if not exists messages_subject_trgm_idx   on public.messages using gin (subject       gin_trgm_ops);
create index if not exists messages_name_trgm_idx      on public.messages using gin (customer_name gin_trgm_ops);
create unique index if not exists messages_gmail_message_id_key
  on public.messages (gmail_message_id) where gmail_message_id is not null;

create index if not exists customer_messages_profile_idx on public.customer_messages (profile_id, created_at);
create index if not exists customer_messages_email_idx   on public.customer_messages (profile_id, customer_email, created_at);
create index if not exists customer_messages_user_idx    on public.customer_messages (customer_user_id, created_at);

create index if not exists pos_sales_profile_created_idx on public.pos_sales (profile_id, created_at desc);
create index if not exists trade_ins_profile_created_idx on public.trade_ins (profile_id, created_at desc);
create index if not exists shipments_profile_idx         on public.shipments (profile_id, created_at desc);
create index if not exists shipments_ticket_id_idx       on public.shipments (ticket_id) where ticket_id is not null;
-- Unique, not just an index: api/fetch-emails.js upserts parsed shipments with
-- onConflict "message_id", and PostgREST rejects that outright unless a unique
-- constraint matches it. One shipment per source email.
create unique index if not exists shipments_message_id_key
  on public.shipments (message_id) where message_id is not null;
create index if not exists technicians_profile_idx       on public.technicians (profile_id);
create unique index if not exists social_connections_platform_key
  on public.social_connections (profile_id, platform);


-- ────────────────────────────────────────────────────────────────────────────
-- 5. Views the app reads through
--    Each exists because PostgREST cannot express the query on its own.
--    security_invoker means row-level security still applies as the caller.
-- ────────────────────────────────────────────────────────────────────────────

-- What a ticket has actually been paid. Read defensively: the amounts live in
-- a jsonb array, and one malformed entry would otherwise fail every query
-- that touches it.
create or replace function public.ticket_paid_total(payments jsonb)
returns numeric language sql immutable parallel safe as $$
  select coalesce(sum(
    case when p ->> 'amount' ~ '^-?[0-9]+(\.[0-9]+)?$'
         then (p ->> 'amount')::numeric else 0 end
  ), 0)
  from jsonb_array_elements(
    case when jsonb_typeof(payments) = 'array' then payments else '[]'::jsonb end
  ) as p;
$$;

-- Customer directory rows with the two figures the list shows, so the page
-- doesn't join every ticket and sale in the browser to work them out.
create or replace view public.customers_with_stats
with (security_invoker = true) as
select
  c.*,
  coalesce(t.ticket_count, 0)                                   as ticket_count,
  (coalesce(t.paid, 0) + coalesce(s.retail, 0))::numeric(12,2)  as lifetime_value
from public.customers c
left join lateral (
  select count(*) as ticket_count,
         coalesce(sum(public.ticket_paid_total(tk.payments)), 0) as paid
  from public.tickets tk where tk.customer_id = c.id
) t on true
left join lateral (
  select coalesce(sum(ps.total), 0) as retail
  from public.pos_sales ps
  where ps.customer_id = c.id and ps.status = 'completed'
) s on true;

-- The ticket list searches the customer's name as well as the ticket's own
-- fields. A PostgREST or() only spans columns of the row it filters, so the
-- name has to be a real column rather than an embedded relation.
create or replace view public.tickets_with_customer
with (security_invoker = true) as
select t.*,
       coalesce(c.name, '')           as customer_name,
       array_to_string(t.labels, ' ') as labels_text
from public.tickets t
left join public.customers c on c.id = t.customer_id;

-- Outstanding balances. Accounts receivable is a live snapshot, not scoped to
-- the report's date range — a ticket unpaid for a year still ages here — and
-- PostgREST cannot compare a price against a sum of a jsonb array.
create or replace view public.ticket_receivables
with (security_invoker = true) as
select t.id, t.profile_id, t.customer_id, t.device, t.device_model,
       t.due_date, t.created_at, t.price,
       public.ticket_paid_total(t.payments)             as paid,
       (t.price - public.ticket_paid_total(t.payments)) as balance_due
from public.tickets t
where t.price - public.ticket_paid_total(t.payments) > 0.01;

-- The Inventory header figures, totalled in Postgres.
create or replace view public.inventory_summary
with (security_invoker = true) as
select profile_id,
       count(*)                                        as item_count,
       coalesce(sum(price * stock), 0)::numeric(12,2)  as stock_value,
       count(*) filter (where is_low)                  as low_count,
       coalesce(sum(cost * stock), 0)::numeric(12,2)   as cost_value
from public.inventory
group by profile_id;

-- Category suggestions for the item form, without reading the catalogue.
create or replace view public.inventory_categories
with (security_invoker = true) as
select distinct profile_id, category
from public.inventory
where category <> '';

-- One row per customer chat conversation, so opening a thread is the only
-- thing that fetches its messages.
create or replace view public.customer_chat_threads
with (security_invoker = true) as
select profile_id,
       customer_email,
       max(customer_name)                                         as customer_name,
       count(*)                                                   as message_count,
       count(*) filter (where direction = 'inbound' and not read) as unread_count,
       max(created_at)                                            as last_message_at,
       (array_agg(body order by created_at desc))[1]              as last_body
from public.customer_messages
where customer_email <> ''
group by profile_id, customer_email;


-- ────────────────────────────────────────────────────────────────────────────
-- 6. Shared tables — ALTER ONLY, never create
--    These belong to mobicare-business. Adding a column is safe; recreating
--    the table is not, and would clobber its RLS.
-- ────────────────────────────────────────────────────────────────────────────

-- Which ticket a website booking was turned into, so Bookings can show it as
-- converted and stop offering to convert it twice.
alter table if exists public.bookings
  add column if not exists novaops_ticket_id bigint references public.tickets(id) on delete set null;

-- `create index` has no `if exists` for the table it indexes, so this has to
-- be guarded — otherwise applying NovaOps before the website's schema fails
-- here, after everything above it has already been created.
do $$
begin
  if to_regclass('public.bookings') is not null then
    create index if not exists bookings_novaops_ticket_id_idx
      on public.bookings (novaops_ticket_id);
  end if;
end;
$$;

-- If the website's schema has not been applied yet, the ALTER above was
-- skipped silently and NovaOps's Bookings page will read as empty. Say so
-- rather than letting it look like there are no bookings.
do $$
begin
  if to_regclass('public.bookings') is null then
    raise notice 'public.bookings does not exist yet. Apply the mobicare-business schema (its Admin -> Settings page), then re-run this file so Bookings can link to tickets.';
  end if;
  if to_regclass('public.staff_users') is null then
    raise notice 'public.staff_users does not exist yet. Until it does, the customer chat cannot resolve which shop a website message belongs to, and NovaOps cannot read bookings or orders.';
  end if;
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. Cross-app glue
-- ────────────────────────────────────────────────────────────────────────────

-- The website inserts a chat message without knowing the shop's internal
-- Supabase Auth user id. This fills it in from the staff allowlist that the
-- website's own schema owns, so neither side has to configure the other's ids.
create or replace function public.customer_messages_fill_profile_id()
returns trigger language plpgsql security definer set search_path = public as $$
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

drop trigger if exists customer_messages_fill_profile_id on public.customer_messages;
create trigger customer_messages_fill_profile_id
  before insert on public.customer_messages
  for each row execute function public.customer_messages_fill_profile_id();


-- Give every new auth user a profiles row. Both apps update that row and
-- neither creates it, so without this an update matches nothing and returns
-- success — which is how NovaOps's supplier-email setting appeared to save
-- and never did.
--
-- Deliberately cannot fail a signup: if anything here raises, the warning is
-- logged and the user is still created. A missing profile is recoverable; a
-- broken sign-up page is not. (An earlier setup script installed a trigger of
-- its own that did not take that care — see the end of this file.)
create or replace function public.novaops_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, full_name, phone)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      coalesce(new.raw_user_meta_data->>'phone', '')
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'novaops_handle_new_user: could not create profile for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists novaops_on_auth_user_created on auth.users;
create trigger novaops_on_auth_user_created
  after insert on auth.users
  for each row execute function public.novaops_handle_new_user();

-- Backfill the users who signed up before that trigger existed.
insert into public.profiles (id)
select u.id from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;


-- The website gates `bookings`, `orders`, `order_items` and every write to
-- its catalogue on public.is_admin(), which checks its `staff_users`
-- allowlist. NovaOps reads those tables as an admin, and the chat trigger
-- above resolves the shop from the same allowlist, so the shop's auth user
-- has to be in it. Nothing can add itself — the table is revoked from
-- `authenticated` on purpose — so run this once from the SQL editor:
--
--     select public.novaops_grant_staff('you@yourshop.com');
--
create or replace function public.novaops_grant_staff(user_email text, staff_role text default 'admin')
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if to_regclass('public.staff_users') is null then
    raise exception 'public.staff_users does not exist. Apply the mobicare-business schema first.';
  end if;

  select id into uid from auth.users where lower(email) = lower(trim(user_email));
  if uid is null then
    raise exception 'No Supabase Auth user with the email %. Sign up first, then run this.', user_email;
  end if;

  insert into public.staff_users (user_id, role)
  values (uid, staff_role)
  on conflict (user_id) do update set enabled = true, role = excluded.role;

  return uid;
end;
$$;

-- Callable from the SQL editor only. Leaving it executable by signed-in
-- browser sessions would make the allowlist self-service.
revoke all on function public.novaops_grant_staff(text, text) from public, anon, authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 8. Row-level security
--    Every NovaOps table is scoped to the signed-in shop account, with one
--    deliberate exception for the customer chat.
-- ────────────────────────────────────────────────────────────────────────────

-- Policies combine ADDITIVELY. A permissive policy left behind by an earlier
-- migration cannot be narrowed by adding a correct one beside it — while
-- `using (true)` is still attached, the table is still readable by anyone the
-- policy applies to. So every policy on a NovaOps table is dropped and the
-- one correct policy is put back. NovaOps owns these tables; it owns their
-- policies too.
--
-- The website's schema does the same for its own seven tables and creates no
-- policy on any of these, so nothing it needs is being removed here.
do $$
declare
  t   text;
  pol record;
begin
  foreach t in array array[
    'customers','tickets','inventory','appointments','house_calls','messages',
    'customer_messages','trade_ins','pos_sales','shipments','technicians',
    'shop_settings','social_connections'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format(
      'create policy %I on public.%I using (profile_id = auth.uid()) with check (profile_id = auth.uid())',
      t || '_owner', t);
  end loop;
end;
$$;

-- profiles is shared with the website, and neither app has any business
-- reading another user's row: both look theirs up by auth user id. The
-- website's schema creates no policy here either, so the same drop-and-
-- replace applies — otherwise a project accumulates five equivalent
-- self-access policies from five old migrations.
alter table public.profiles enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end;
$$;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (id = auth.uid());

-- The chat is the one shared table: a signed-in website customer may read
-- their own thread and post to it, but only ever as an inbound message —
-- replying as the shop stays with the shop.
drop policy if exists customer_messages_customer_read on public.customer_messages;
create policy customer_messages_customer_read on public.customer_messages
  for select using (customer_user_id = auth.uid());

drop policy if exists customer_messages_customer_insert on public.customer_messages;
create policy customer_messages_customer_insert on public.customer_messages
  for insert with check (customer_user_id = auth.uid() and direction = 'inbound');

-- Views are security_invoker, so granting select here is not a way around the
-- policies above — each caller still sees only their own rows.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on
      public.customers_with_stats, public.tickets_with_customer,
      public.ticket_receivables, public.inventory_summary,
      public.inventory_categories, public.customer_chat_threads
      to authenticated;
    grant execute on function public.ticket_paid_total(jsonb) to authenticated;
  end if;
end;
$$;


-- ============================================================================
--  AFTER RUNNING THIS
--
--  1. Sign in to NovaOps with any Supabase Auth user on this project. Every
--     row you create is scoped to that account.
--
--  2. Put that same user on the website's staff allowlist. Its RLS checks
--     `staff_users` before letting anyone read `bookings` or `orders`, and
--     the chat trigger resolves the shop from the same table. One line in
--     the SQL editor:
--        select public.novaops_grant_staff('you@yourshop.com');
--     Without it, Bookings and the website half of Accounting read as empty
--     rather than erroring, and customer chat inserts fail.
--
--  3. If the website's tables do not exist yet, apply its schema FIRST, from
--     the mobicare-business repo (Admin → Settings → copy the schema SQL),
--     then run this file. Section 6 needs `bookings` to exist; while it does
--     not, that ALTER is skipped and Bookings stays empty. Running the
--     website's schema afterwards is also fine — it only drops and recreates
--     policies on its own seven tables and never touches NovaOps's.
--
--  4. Shop details, tax rate, business hours, receipt footer and canned
--     replies all live in `shop_settings` and are edited in Settings.
-- ============================================================================


-- ============================================================================
--  OPTIONAL — retire tables from earlier versions of this app
--
--  These were created by migrations that no longer have any code behind them:
--  nothing in NovaOps or the website reads or writes them. They are left in
--  place by default because dropping a table destroys its rows. Check them
--  first, then run this block by hand if you want the project tidy.
--
--    select 'vendor_repairs', count(*) from public.vendor_repairs
--    union all select 'services',        count(*) from public.services
--    union all select 'expenses',        count(*) from public.expenses
--    union all select 'square_config',   count(*) from public.square_config
--    union all select 'device_brands',   count(*) from public.device_brands
--    union all select 'device_categories', count(*) from public.device_categories
--    union all select 'device_models',   count(*) from public.device_models;
--
--    drop table if exists public.vendor_repairs    cascade;
--    drop table if exists public.services          cascade;
--    drop table if exists public.expenses          cascade;
--    drop table if exists public.square_config     cascade;
--    drop table if exists public.device_models     cascade;
--    drop table if exists public.device_brands     cascade;
--    drop table if exists public.device_categories cascade;
--
--  Also worth checking: earlier setup scripts installed a trigger on
--  auth.users named `on_auth_user_created` that writes to `profiles`. If it
--  references columns your `profiles` table does not have, every new signup
--  fails — on the website as well as here, because a raising AFTER INSERT
--  trigger aborts the whole signup. To see what is on that table:
--
--    select tgname from pg_trigger t
--    join pg_class c on c.oid = t.tgrelid
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'auth' and not t.tgisinternal;
--
--  This file installs exactly one, `novaops_on_auth_user_created`, and it
--  swallows its own errors so it can never do that. If the old one is still
--  listed, it is redundant now and is the likelier cause of any signup
--  failure:
--
--    drop trigger if exists on_auth_user_created on auth.users;
-- ============================================================================
