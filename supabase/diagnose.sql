-- ============================================================================
--  NovaOps + mobicare-business — read-only diagnostic
--
--  Paste the whole thing into the Supabase SQL editor, run it, and send back
--  the table it prints. It reports on both apps, since they share one
--  project: which tables exist, which app owns each, whether a name is taken
--  by something that is neither app's, and whether the permissions each side
--  depends on are actually wired up.
--
--  It changes nothing in your schema. It builds one temporary table so the
--  editor can show every answer in a single result (the editor only displays
--  the last statement's output); that table disappears with the connection.
--
--  Run this first if supabase/schema.sql refuses to apply — its preflight
--  names the conflicts, and this explains them.
-- ============================================================================

drop table if exists _novaops_diag;
create temp table _novaops_diag (sort text, section text, item text, detail text);

do $$
declare
  r        record;
  n        bigint;
  m        bigint;
  owner    text;
  warn     text;
  pkcols   text;
  pktypes  text;
begin
  ---------------------------------------------------------------------------
  -- 1. Every table in `public`: who owns it, its key, and its RLS posture.
  ---------------------------------------------------------------------------
  for r in
    select c.oid, c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace nsp on nsp.oid = c.relnamespace
    where nsp.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  loop
    select string_agg(a.attname, ', ' order by k.ord),
           string_agg(format_type(a.atttypid, a.atttypmod), ', ' order by k.ord)
      into pkcols, pktypes
      from pg_index i
      cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
     where i.indrelid = r.oid and i.indisprimary;

    if r.relname in ('customers','tickets','inventory','appointments','house_calls',
                     'messages','customer_messages','trade_ins','pos_sales','shipments',
                     'technicians','shop_settings','social_connections') then
      -- Every NovaOps table carries profile_id uuid; its RLS keys on it.
      owner := case when exists (
                 select 1 from information_schema.columns
                 where table_schema='public' and table_name=r.relname
                   and column_name='profile_id' and data_type='uuid')
               then 'NovaOps' else 'NAME CLASH — not NovaOps''s' end;
    elsif r.relname in ('staff_users','categories','products','orders','order_items',
                        'bookings','site_settings') then
      owner := 'website';
    elsif r.relname = 'profiles' then
      owner := 'shared (both apps)';
    else
      owner := 'unknown / leftover';
    end if;

    -- Counted, not estimated. pg_stat_user_tables.n_live_tup is a statistic
    -- that can be stale or reset to zero (a restore, a stats reset, a table
    -- autovacuum has not reached), which made a table holding 1859 rows read
    -- as empty here.
    execute format('select count(*) from public.%I', r.relname) into n;

    -- The same checks schema.sql's preflight runs, so the two agree on what
    -- counts as a conflict.
    warn := '';
    if owner like 'NAME CLASH%' then
      warn := ' | ** schema.sql will refuse to touch this **';
    elsif owner = 'NovaOps' and r.relname in
          ('customers','tickets','messages','appointments','technicians')
          and (pkcols is distinct from 'id' or pktypes not in ('bigint','integer')) then
      warn := ' | ** other tables point bigint foreign keys at this id **';
    elsif owner = 'NovaOps' and r.relname = 'shop_settings'
          and pkcols is distinct from 'profile_id' then
      warn := ' | ** settings are upserted on profile_id; this key duplicates rows **';
    end if;

    insert into _novaops_diag values ('1', '1. tables', r.relname, format(
      'owner=%s | pk=(%s %s) | rls=%s | policies=%s | %s rows%s',
      owner, coalesce(pkcols,'none'), coalesce(pktypes,''),
      case when r.relrowsecurity then 'on' else 'OFF' end,
      (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=r.relname),
      n, warn));
  end loop;

  ---------------------------------------------------------------------------
  -- 1b. What is actually in the tables neither app reads, so a decision about
  --     them can be made from their shape rather than their name.
  ---------------------------------------------------------------------------
  for r in
    select c.relname
    from pg_class c
    join pg_namespace nsp on nsp.oid = c.relnamespace
    where nsp.nspname = 'public' and c.relkind = 'r'
      and c.relname not in ('customers','tickets','inventory','appointments','house_calls',
            'messages','customer_messages','trade_ins','pos_sales','shipments','technicians',
            'shop_settings','social_connections','staff_users','categories','products',
            'orders','order_items','bookings','site_settings','profiles')
    order by c.relname
  loop
    execute format('select count(*) from public.%I', r.relname) into n;
    if n > 0 then
      insert into _novaops_diag values ('1b', '1b. unread tables with data', r.relname,
        format('%s rows | %s', n,
          (select string_agg(column_name, ', ' order by ordinal_position)
             from information_schema.columns
            where table_schema='public' and table_name=r.relname)));
    end if;
  end loop;

  ---------------------------------------------------------------------------
  -- 2. Anything either app expects and cannot find.
  ---------------------------------------------------------------------------
  for r in
    select * from (values
      ('customers','NovaOps'),         ('tickets','NovaOps'),
      ('inventory','NovaOps'),         ('appointments','NovaOps'),
      ('house_calls','NovaOps'),       ('messages','NovaOps'),
      ('customer_messages','NovaOps'), ('trade_ins','NovaOps'),
      ('pos_sales','NovaOps'),         ('shipments','NovaOps'),
      ('technicians','NovaOps'),       ('shop_settings','NovaOps'),
      ('social_connections','NovaOps'),
      ('staff_users','website'),       ('categories','website'),
      ('products','website'),          ('orders','website'),
      ('order_items','website'),       ('bookings','website'),
      ('site_settings','website'),     ('profiles','shared')
    ) as e(tablename, owner)
  loop
    if to_regclass('public.' || r.tablename) is null then
      insert into _novaops_diag values ('2', '2. missing', r.tablename,
        format('expected by %s — not present', r.owner));
    end if;
  end loop;

  ---------------------------------------------------------------------------
  -- 3. The cross-app permission chain.
  --    The website gates bookings/orders on public.is_admin(), which reads
  --    the staff_users allowlist. NovaOps reads those tables as an admin, and
  --    the chat trigger resolves the shop from the same allowlist. When a
  --    link here is missing, Bookings and the website half of Accounting read
  --    as empty and website chat inserts fail — with nothing pointing here.
  ---------------------------------------------------------------------------
  insert into _novaops_diag values ('3', '3. wiring', 'is_admin()',
    case when exists (select 1 from pg_proc p join pg_namespace nsp on nsp.oid=p.pronamespace
                      where nsp.nspname='public' and p.proname='is_admin')
         then 'present' else 'MISSING — apply the mobicare-business schema' end);

  if to_regclass('public.staff_users') is null then
    insert into _novaops_diag values ('3', '3. wiring', 'staff allowlist',
      'staff_users missing — NovaOps cannot read bookings or orders, and website chat inserts fail');
  else
    execute 'select count(*) from public.staff_users where enabled' into n;
    insert into _novaops_diag values ('3', '3. wiring', 'staff allowlist',
      case when n = 0
           then '0 enabled rows — run: select public.novaops_grant_staff(''you@yourshop.com'');'
           else n || ' enabled row(s)' end);
    for r in execute
      'select coalesce(u.email, ''(no auth user)'') as email, s.role, s.enabled
         from public.staff_users s left join auth.users u on u.id = s.user_id
        order by s.created_at'
    loop
      insert into _novaops_diag values ('3', '3. wiring', 'staff member',
        format('%s | role=%s | enabled=%s', r.email, r.role, r.enabled));
    end loop;
  end if;

  insert into _novaops_diag values ('3', '3. wiring', 'bookings.novaops_ticket_id',
    case when to_regclass('public.bookings') is null then 'bookings table missing'
         when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='bookings'
                        and column_name='novaops_ticket_id') then 'present'
         else 'MISSING — re-run schema.sql now that bookings exists' end);

  insert into _novaops_diag values ('3', '3. wiring', 'chat shop-resolver trigger',
    case when exists (select 1 from pg_trigger
                      where tgname='customer_messages_fill_profile_id' and not tgisinternal)
         then 'present' else 'missing' end);

  select count(*) into m from auth.users;
  if to_regclass('public.profiles') is null then
    insert into _novaops_diag values ('3', '3. wiring', 'profiles coverage',
      format('profiles table missing; %s auth user(s)', m));
  else
    execute 'select count(*) from public.profiles' into n;
    insert into _novaops_diag values ('3', '3. wiring', 'profiles coverage',
      format('%s profile row(s) for %s auth user(s)%s', n, m,
             case when n < m then ' — the signup trigger has not backfilled' else '' end));
  end if;

  ---------------------------------------------------------------------------
  -- 4. Triggers on auth.users. An earlier setup script installed one that
  --    writes to `profiles`; if it references columns that table does not
  --    have, every signup fails — on the website as well as here.
  ---------------------------------------------------------------------------
  for r in
    select t.tgname, p.proname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace nsp on nsp.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where nsp.nspname = 'auth' and not t.tgisinternal
    order by t.tgname
  loop
    insert into _novaops_diag values ('4', '4. auth.users triggers', r.tgname,
      'runs ' || r.proname || '()');
  end loop;
  if not found then
    insert into _novaops_diag values ('4', '4. auth.users triggers', '(none)',
      'no profile is created on signup');
  end if;

  ---------------------------------------------------------------------------
  -- 5. The shape of `profiles` — shared, and neither app used to create it.
  ---------------------------------------------------------------------------
  for r in
    select column_name, data_type, is_nullable, coalesce(column_default,'') as def
    from information_schema.columns
    where table_schema='public' and table_name='profiles'
    order by ordinal_position
  loop
    insert into _novaops_diag values ('5', '5. profiles columns', r.column_name,
      format('%s | nullable=%s | default=%s', r.data_type, r.is_nullable, r.def));
  end loop;

  ---------------------------------------------------------------------------
  -- 6. Every row-level-security policy in `public`.
  ---------------------------------------------------------------------------
  for r in
    select tablename, policyname, cmd, coalesce(qual,'-') as qual,
           coalesce(with_check,'-') as wc
    from pg_policies where schemaname='public'
    order by tablename, policyname
  loop
    insert into _novaops_diag values ('6', '6. policies', r.tablename || ' · ' || r.policyname,
      format('%s | using %s | check %s', r.cmd, r.qual, r.wc));
  end loop;
end;
$$;

select section, item, detail from _novaops_diag order by sort, section, item;
