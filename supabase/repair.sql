-- ============================================================================
--  NovaOps — repair
--
--  This file DROPS THINGS. schema.sql deliberately never does; the two are
--  separate so that running the schema can never cost you data, and this one
--  is read before it is run.
--
--  Nothing here touches a table that has rows in it. Tables with data are
--  reported and left exactly as they are; only provably empty ones go.
--
--  Note that the Supabase SQL editor runs a whole file as one transaction, so
--  a section that raises undoes the sections before it. That is why section B
--  reports rather than raises: a tidy-up must never cost you the fix in A.
--
--  Run this when schema.sql's preflight tells you to, then run schema.sql.
--  Run supabase/diagnose.sql first if you want the counts for yourself.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- A. Rebuild `appointments` with the key type the app expects
--
--    An old migration created it with `id uuid`. NovaOps points bigint
--    foreign keys at that id (shipments.appointment_id), so the schema
--    cannot be applied while it is a uuid — which is what the
--    "incompatible types: bigint and uuid" error was.
--
--    Only runs if the table is empty. schema.sql recreates it, with its
--    columns, indexes and policy, on the next run.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare n bigint;
begin
  if to_regclass('public.appointments') is null then
    raise notice 'A: public.appointments does not exist; schema.sql will create it correctly.';
    return;
  end if;

  if exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.appointments'::regclass and i.indisprimary
      and a.attname = 'id'
      and format_type(a.atttypid, a.atttypmod) in ('bigint', 'integer')
  ) then
    raise notice 'A: public.appointments already has a bigint id; nothing to do.';
    return;
  end if;

  select count(*) into n from public.appointments;
  if n > 0 then
    raise exception 'public.appointments holds % row(s). Rebuilding it would destroy them. Export them, empty the table, then re-run this file.', n;
  end if;

  drop table public.appointments cascade;
  raise notice 'A: dropped the empty uuid-keyed public.appointments. Run schema.sql now to recreate it.';
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- B. Retire tables no code reads — but only the ones that are empty
--
--    These were left behind by earlier versions of this app and by the old
--    Nuxt build. Nothing in NovaOps or the website reads or writes any of
--    them; that was checked against every `.from(...)` call in both repos.
--
--    An empty one is dropped. One with rows in it is NOT touched and NOT
--    treated as an error — it is reported at the end with its row count and
--    the exact statement to drop it, so the decision stays yours. An earlier
--    version of this file raised instead, which rolled back section A along
--    with it; a tidy-up must never cost you the fix above.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare
  t       text;
  n       bigint;
  dropped text[] := '{}';
  kept    text[] := '{}';
  dead    text[] := array[
    'auto_response_rules','brand_settings','device_brands','device_categories',
    'device_models','devices','expenses','sales','services','settings',
    'social_interactions','social_posts','social_sync_log','square_config',
    'vendor_repairs','website_settings'];
begin
  foreach t in array dead loop
    if to_regclass('public.' || t) is null then continue; end if;

    -- Counted, not estimated: pg_stat_user_tables.n_live_tup can be stale or
    -- reset to zero, which is how a table holding 1859 rows read as empty in
    -- the diagnostic.
    execute format('select count(*) from public.%I', t) into n;

    if n = 0 then
      execute format('drop table public.%I cascade', t);
      dropped := dropped || t;
    else
      kept := kept || format('%s (%s rows)', t, n);
    end if;
  end loop;

  if array_length(dropped, 1) > 0 then
    raise notice 'B: dropped % empty unused table(s): %',
      array_length(dropped, 1), array_to_string(dropped, ', ');
  else
    raise notice 'B: no empty unused tables to drop.';
  end if;

  if array_length(kept, 1) > 0 then
    raise notice E'B: LEFT ALONE, because they hold data:\n      %\n    Nothing in either app reads them, but that is a judgement about code, not about what the rows are worth. Look at them first — supabase/diagnose.sql lists their columns alongside the counts. Some are worth keeping: `services` is a price list and `devices` is a device catalogue. To drop one once you are sure:\n      drop table public.<name> cascade;',
      array_to_string(kept, E'\n      ');
  end if;
end;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- C. The old signup trigger
--
--    An earlier setup script installed `on_auth_user_created` on auth.users,
--    running handle_new_user(). It raises rather than warning, so if it ever
--    fails it takes the whole signup with it — on the website as well as
--    here. schema.sql installs its own trigger that cannot do that and that
--    backfills the users this one missed.
--
--    This is left commented out because it is the one thing here that is not
--    obviously inert: if you wrote that function yourself and it does
--    something besides creating a profile row, read it first.
--
--      select prosrc from pg_proc where proname = 'handle_new_user';
--
--    Then, if it only creates a profile:
--
--      drop trigger if exists on_auth_user_created on auth.users;
--      drop function if exists public.handle_new_user();
-- ────────────────────────────────────────────────────────────────────────────
