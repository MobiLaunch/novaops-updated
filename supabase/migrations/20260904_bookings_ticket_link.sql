-- Links website bookings to NovaOps tickets.
--
-- `public.bookings` is owned by the mobicare-business website repo (it's
-- written by that repo's /api/create-booking serverless function) — this
-- migration lives here too because NovaOps is what actually needs the new
-- column, but it must be run once against the SAME Supabase project both
-- apps share, same as mobicare-business's own migrations.
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.

alter table if exists public.bookings
  add column if not exists novaops_ticket_id bigint references public.tickets(id) on delete set null;

create index if not exists bookings_novaops_ticket_id_idx on public.bookings(novaops_ticket_id);

-- Reminder: reading/updating `bookings` from NovaOps requires the signed-in
-- Supabase user to also be a row in public.staff_users (role='admin' or
-- 'staff', enabled=true) — the same allowlist mobicare-business's admin
-- portal uses (see its src/admin/schemaSql.ts). Without that, RLS silently
-- returns zero rows instead of an error.
