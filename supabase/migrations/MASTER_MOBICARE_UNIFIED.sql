-- ==========================================================================
-- MOBICARE UNIFIED MASTER SQL
-- Canonical cross-application alignment for Mobicare Device Recovery.
--
-- Systems:
--   Mobicare website / shop / public booking
--   NovaOps repair-shop management
--   Supabase Auth / Data API / Realtime
--   Stripe-backed order state
--
-- Design:
--   Website writes bookings/orders through trusted server endpoints.
--   A database trigger turns every website booking into a NovaOps ticket
--   immediately, preserving one source of truth for the repair workflow.
--   NovaOps manages website_settings, catalog, bookings and orders through
--   the same authenticated control plane.
--
-- This file is intended to be applied to the existing production project.
-- It is idempotent for the objects it creates/changes.
-- ============================================================================

begin;
create extension if not exists pgcrypto;

-- 1. WEBSITE BOOKINGS -------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  customer_id bigint references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  service text not null default '',
  device_type text not null default '',
  device_model text not null default '',
  issue text not null default '',
  appt_date date not null,
  appt_time text not null,
  notes text not null default '',
  visit_type text not null default 'in-store',
  visit_location_type text,
  home_address text not null default '',
  status text not null default 'pending',
  novaops_ticket_id bigint references public.tickets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_profile_date_idx on public.bookings(profile_id, appt_date, appt_time);
create index if not exists bookings_ticket_idx on public.bookings(novaops_ticket_id);
alter table public.bookings enable row level security;
drop policy if exists bookings_owner on public.bookings;
create policy bookings_owner on public.bookings for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at before update on public.bookings
for each row execute function public.set_updated_at();
revoke all on public.bookings from anon;
grant select, insert, update, delete on public.bookings to authenticated, service_role;

-- 2. WEBSITE CATALOG --------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  description text not null default '',
  icon text not null default '',
  sort_order integer not null default 0,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_profile_name_idx on public.categories(profile_id, lower(name));
alter table public.categories enable row level security;
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_owner on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy categories_owner on public.categories for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated, service_role;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  category text not null default '',
  price numeric(10,2) not null default 0,
  compare_price numeric(10,2),
  stock integer not null default 0,
  sku text not null default '',
  description text not null default '',
  images text[] not null default '{}',
  tags text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  weight numeric(10,2) not null default 0,
  shipping_days jsonb not null default '{"min":0,"max":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists products_profile_sku_idx on public.products(profile_id, sku) where sku <> '';
create index if not exists products_profile_active_idx on public.products(profile_id, active);
alter table public.products enable row level security;
drop policy if exists products_public_read on public.products;
drop policy if exists products_owner_write on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (active = true);
create policy products_owner_write on public.products for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated, service_role;

-- 3. WEBSITE ORDERS ---------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  profile_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  shipping_address text not null default '',
  shipping_city text not null default '',
  shipping_state text not null default '',
  shipping_zip text not null default '',
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'paid',
  payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists orders_payment_intent_idx on public.orders(payment_intent_id) where payment_intent_id is not null;
alter table public.orders enable row level security;
drop policy if exists orders_owner_read on public.orders;
drop policy if exists orders_customer_read on public.orders;
create policy orders_owner_read on public.orders for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy orders_customer_read on public.orders for select to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.orders to authenticated, service_role;

create table if not exists public.order_items (
  id bigint generated by default as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null default '',
  price numeric(10,2) not null default 0,
  qty integer not null default 1 check (qty > 0),
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
drop policy if exists order_items_owner on public.order_items;
create policy order_items_owner on public.order_items for all to authenticated
  using (exists(select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or o.user_id = auth.uid())))
  with check (exists(select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or o.user_id = auth.uid())));
grant select, insert, update, delete on public.order_items to authenticated, service_role;

-- 4. WEBSITE SETTINGS -> MOBICARE PROFILE ---------------------------------
update public.website_settings ws
set profile_id = p.id
from public.profiles p
where ws.profile_id is null
  and p.email = 'mobicarehello@gmail.com';

insert into public.website_settings (profile_id, business_name, phone, address, updated_at)
select p.id, coalesce(p.business_name, 'Mobicare Device Recovery'), p.phone, p.address, now()
from public.profiles p
where p.email = 'mobicarehello@gmail.com'
  and not exists (select 1 from public.website_settings ws where ws.profile_id = p.id);

-- 5. WEBSITE BOOKING -> NOVAOPS TICKET -------------------------------------
create or replace function public.create_novaops_ticket_from_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
  v_ticket_id bigint;
begin
  if new.novaops_ticket_id is not null then
    return new;
  end if;

  select c.id into v_customer_id
  from public.customers c
  where c.profile_id = new.profile_id
    and lower(coalesce(c.email,'')) = lower(new.customer_email)
  order by c.created_at asc
  limit 1;

  if v_customer_id is null then
    insert into public.customers(profile_id, name, phone, email, notes)
    values(new.profile_id, new.customer_name, new.customer_phone, new.customer_email,
      'Created automatically from website booking ' || new.id)
    returning id into v_customer_id;
  end if;

  insert into public.tickets(
    profile_id, customer_id, device, device_model, device_description,
    issue, status, priority, price, notes, parts
  ) values (
    new.profile_id, v_customer_id, new.device_type, new.device_model, '',
    coalesce(new.issue, new.service), 'Open', 'normal', 0,
    jsonb_build_array(jsonb_build_object(
      'source','website_booking','booking_id',new.id::text,
      'appointment_date',new.appt_date::text,'appointment_time',new.appt_time,
      'visit_type',new.visit_type,'notes',new.notes
    )),
    jsonb_build_array(jsonb_build_object('name',new.service))
  ) returning id into v_ticket_id;

  new.customer_id := v_customer_id;
  new.novaops_ticket_id := v_ticket_id;
  new.status := 'ticket_created';
  return new;
end;
$$;
revoke all on function public.create_novaops_ticket_from_booking() from public, anon, authenticated;
grant execute on function public.create_novaops_ticket_from_booking() to service_role;
drop trigger if exists booking_to_ticket on public.bookings;
create trigger booking_to_ticket before insert on public.bookings
for each row execute function public.create_novaops_ticket_from_booking();

-- 6. SECURITY HARDENING -----------------------------------------------------
alter function public.set_updated_at() set search_path = public;
alter function public.get_platform_connection(uuid, text) set search_path = public;
alter function public.set_profile_id_from_jwt() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.log_connection_sync() set search_path = public;
revoke execute on function public.get_platform_connection(uuid, text) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_profile_id_from_jwt() from anon, authenticated;

-- 7. REALTIME ---------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

grant usage, select on all sequences in schema public to authenticated, service_role;

commit;

-- 8. POST-DEPLOY VERIFICATION ------------------------------------------------
-- Run these separately after deployment:
-- select to_regclass('public.bookings'), to_regclass('public.products'),
--        to_regclass('public.categories'), to_regclass('public.orders'),
--        to_regclass('public.order_items');
-- select tgname from pg_trigger where tgname = 'booking_to_ticket';
