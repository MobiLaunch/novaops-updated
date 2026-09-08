-- ============================================================================
--  Fold the `devices` catalogue into the shared device list both apps use
--
--  WHAT THIS IS FOR
--
--  The website's booking wizard walks manufacturer -> device type -> model ->
--  generation, off `deviceManufacturers` inside site_settings.content. That
--  list is hand-written defaults: a handful of iPhone and Galaxy entries.
--
--  The `devices` table, left behind by the old Nuxt build and read by nothing,
--  holds 1859 rows across 22 brands and 2017-2025. It is the better list, and
--  its `category` column already carries the type/family split the wizard
--  wants ("Laptop - XPS" -> type "Laptop", family "XPS").
--
--  So: convert it into the wizard's shape and MERGE it into site_settings.
--  Nothing already in that list is removed — anything you have edited in the
--  website's Admin -> Site Content survives, and only missing entries are
--  added.
--
--  Both apps then read one list from one place. site_settings is already
--  `public read ... using (true)`, so the booking wizard's anonymous visitors
--  can read it; `devices` is authenticated-only and they could not.
--
--  SAFE TO RE-RUN. It merges, so running it twice changes nothing the second
--  time. It does not modify or drop `devices`.
--
--  BEFORE YOU RUN IT — decide what belongs on a public booking form. Every
--  device type in the table is imported, and some of them are probably not
--  things you repair:
--
--      Accessory · AR Headset · Enterprise Display · Monitor ·
--      Spatial Computing · Streaming / Smart Home · VR Accessory · VR Headset
--
--  Add any you do not want to the `skip_types` array below. They are dropped
--  before anything is written. You can also delete them afterwards in the
--  website's Site Content editor — nothing here is one-way.
-- ============================================================================


-- ─── Helpers, created for this import and dropped again at the end ─────────

-- "Laptop - XPS" -> "laptop-xps". Ids have to match the ones already in the
-- list ("apple", "apple-phone", "apple-iphone") or the merge below would add
-- a second copy of every model instead of recognising it.
create or replace function public.novaops_slug(src text)
returns text language sql immutable as $fn$
  select trim(both '-' from regexp_replace(lower(coalesce(src, '')), '[^a-z0-9]+', '-', 'g'));
$fn$;

-- Work out where a model name ends and its generation begins.
--
-- The family from `category` is not always a clean space-delimited prefix of
-- `name`: Dell gives family "XPS" and name "XPS 13 (9380)", but Samsung gives
-- family "Galaxy S" and name "Galaxy S24 Ultra" — no space after the "S". So
-- take the longest prefix of `name` that ends on a space boundary AND is
-- still a prefix of the family, and split there. That yields ("XPS",
-- "13 (9380)") and ("Galaxy", "S24 Ultra").
--
-- Splitting on a space is what makes this safe: the wizard renders a device
-- as `model || ' ' || generation`, so the two halves always rejoin into the
-- original name. Where no such prefix exists (HP files an "Envy x360 14"
-- under family "Spectre") the row becomes its own model with no generation,
-- rather than a doubled "Spectre Envy x360 14".
create or replace function public.novaops_split_model(family text, src_name text)
returns text[] language plpgsql immutable as $fn$
declare
  toks text[];
  i    int;
  cand text;
  best text := '';
begin
  if coalesce(family, '') = '' then
    return array[src_name, ''];
  end if;

  toks := string_to_array(src_name, ' ');
  for i in 1 .. coalesce(array_length(toks, 1), 0) loop
    cand := array_to_string(toks[1:i], ' ');
    -- Plain comparison, not LIKE: model names contain characters LIKE treats
    -- as wildcards.
    exit when left(family, length(cand)) <> cand;
    best := cand;
  end loop;

  if best = '' then
    return array[src_name, ''];
  end if;
  return array[best, btrim(substring(src_name from length(best) + 1))];
end;
$fn$;

-- Merge two model arrays: same id means the same model, and its generation
-- lists are unioned with the existing order kept in front.
create or replace function public.novaops_merge_models(existing jsonb, built jsonb)
returns jsonb language plpgsql immutable as $fn$
declare
  out_models jsonb := '[]'::jsonb;
  m          jsonb;
  other      jsonb;
  gens       jsonb;
  g          jsonb;
begin
  for m in select value from jsonb_array_elements(existing) loop
    other := (select value from jsonb_array_elements(built) b
              where b.value ->> 'id' = m ->> 'id' limit 1);
    if other is null then
      out_models := out_models || jsonb_build_array(m);
    else
      gens := coalesce(m -> 'generations', '[]'::jsonb);
      for g in select value from jsonb_array_elements(coalesce(other -> 'generations', '[]'::jsonb)) loop
        if not (gens @> jsonb_build_array(g)) then
          gens := gens || jsonb_build_array(g);
        end if;
      end loop;
      out_models := out_models || jsonb_build_array(m || jsonb_build_object('generations', gens));
    end if;
  end loop;

  for m in select value from jsonb_array_elements(built) loop
    if not exists (select 1 from jsonb_array_elements(existing) e
                   where e.value ->> 'id' = m ->> 'id') then
      out_models := out_models || jsonb_build_array(m);
    end if;
  end loop;

  return out_models;
end;
$fn$;

-- Same idea one level up, recursing into the models.
create or replace function public.novaops_merge_cats(existing jsonb, built jsonb)
returns jsonb language plpgsql immutable as $fn$
declare
  out_cats jsonb := '[]'::jsonb;
  c        jsonb;
  other    jsonb;
begin
  for c in select value from jsonb_array_elements(existing) loop
    other := (select value from jsonb_array_elements(built) b
              where b.value ->> 'id' = c ->> 'id' limit 1);
    if other is null then
      out_cats := out_cats || jsonb_build_array(c);
    else
      out_cats := out_cats || jsonb_build_array(c || jsonb_build_object('models',
        public.novaops_merge_models(coalesce(c -> 'models', '[]'::jsonb),
                                    coalesce(other -> 'models', '[]'::jsonb))));
    end if;
  end loop;

  for c in select value from jsonb_array_elements(built) loop
    if not exists (select 1 from jsonb_array_elements(existing) e
                   where e.value ->> 'id' = c ->> 'id') then
      out_cats := out_cats || jsonb_build_array(c);
    end if;
  end loop;

  return out_cats;
end;
$fn$;

-- And the manufacturers. Existing entries win on their own fields, so a name
-- edited in the website's Site Content editor is not overwritten here.
create or replace function public.novaops_merge_devices(existing jsonb, built jsonb)
returns jsonb language plpgsql immutable as $fn$
declare
  out_man jsonb := '[]'::jsonb;
  m       jsonb;
  other   jsonb;
begin
  for m in select value from jsonb_array_elements(existing) loop
    other := (select value from jsonb_array_elements(built) b
              where b.value ->> 'id' = m ->> 'id' limit 1);
    if other is null then
      out_man := out_man || jsonb_build_array(m);
    else
      out_man := out_man || jsonb_build_array(m || jsonb_build_object('categories',
        public.novaops_merge_cats(coalesce(m -> 'categories', '[]'::jsonb),
                                  coalesce(other -> 'categories', '[]'::jsonb))));
    end if;
  end loop;

  for m in select value from jsonb_array_elements(built) loop
    if not exists (select 1 from jsonb_array_elements(existing) e
                   where e.value ->> 'id' = m ->> 'id') then
      out_man := out_man || jsonb_build_array(m);
    end if;
  end loop;

  return out_man;
end;
$fn$;


do $$
declare
  -- Device types to leave out entirely. Names here are AFTER the renames
  -- below, so use 'Phone', not 'Smartphone'.
  skip_types  text[] := array[]::text[];

  built       jsonb;
  existing    jsonb;
  merged      jsonb;
  n_rows      bigint;
  n_before    int;
  r           record;
  n_after     int;
begin
  if to_regclass('public.devices') is null then
    raise exception 'public.devices does not exist — nothing to import.';
  end if;
  if to_regclass('public.site_settings') is null then
    raise exception 'public.site_settings does not exist. Apply the mobicare-business schema first; that is where the shared list lives.';
  end if;

  select count(*) into n_rows from public.devices;

  -- ── Build the wizard's four-level tree out of the flat table ────────────
  --
  --  brand                     -> manufacturer
  --  category before the " - " -> device type   ("Laptop - XPS" -> "Laptop")
  --  category after  the " - " -> model family  ("Laptop - XPS" -> "XPS")
  --  name minus the family     -> generation    ("XPS 13 (9380)" -> "13 (9380)")
  --
  --  The wizard renders a model as `model.name || ' ' || generation`, so the
  --  split has to reconstruct `name` exactly. Where a name does not begin
  --  with its family, the row becomes its own model with no generation
  --  rather than producing a doubled label like "XPS XPS 13 (9380)".
  with parsed as (
    select
      d.brand,
      case
        when d.category like '% - %'
          then split_part(d.category, ' - ', 1)
        else d.category
      end as type_raw,
      case
        when d.category like '% - %'
          then substring(d.category from position(' - ' in d.category) + 3)
      end as family,
      d.name,
      d.year
    from public.devices d
    where coalesce(d.brand, '') <> '' and coalesce(d.name, '') <> ''
  ),
  renamed as (
    select
      brand,
      -- Two renames, both because the table uses a different word for a
      -- bucket that already exists: the wizard's own list says "Phone", and
      -- Sony/Nothing file headphones under "Headphones" where Samsung,
      -- Apple, Google and OnePlus use "Audio". Without these, Apple would
      -- end up with both a "Phone" and a "Smartphone" type.
      case type_raw
        when 'Smartphone' then 'Phone'
        when 'Headphones' then 'Audio'
        else type_raw
      end as dev_type,
      family, name, year
    from parsed
  ),
  split as (
    select
      brand, dev_type, name, year,
      (public.novaops_split_model(family, name))[1] as model_name,
      (public.novaops_split_model(family, name))[2] as generation
    from renamed
    where dev_type is not null and dev_type <> ''
      and not (dev_type = any(skip_types))
  ),
  -- Newest first, matching how the hand-written generations are ordered.
  gens as (
    select brand, dev_type, model_name,
           jsonb_agg(distinct generation) filter (where generation <> '') as gen_set,
           max(year) as newest
    from split
    group by brand, dev_type, model_name
  ),
  gens_ordered as (
    select g.brand, g.dev_type, g.model_name, g.newest,
           coalesce((
             select jsonb_agg(s.generation order by s.year desc, s.generation desc)
             from (select distinct generation, max(year) as year
                   from split s2
                   where s2.brand = g.brand and s2.dev_type = g.dev_type
                     and s2.model_name = g.model_name and s2.generation <> ''
                   group by generation) s
           ), '[]'::jsonb) as generations
    from gens g
  ),
  models as (
    select brand, dev_type,
           jsonb_agg(jsonb_build_object(
             'id',          public.novaops_slug(brand || '-' || model_name),
             'name',        model_name,
             'generations', generations
           ) order by newest desc nulls last, model_name) as models
    from gens_ordered
    group by brand, dev_type
  ),
  categories as (
    select brand,
           jsonb_agg(jsonb_build_object(
             'id',     public.novaops_slug(brand || '-' || dev_type),
             'name',   dev_type,
             'models', models
           ) order by dev_type) as categories
    from models
    group by brand
  )
  select jsonb_agg(jsonb_build_object(
           'id',         public.novaops_slug(brand),
           'name',       brand,
           'categories', categories
         ) order by brand)
    into built
    from categories;

  if built is null then
    raise exception 'Nothing to import — every row was filtered out. Check skip_types.';
  end if;

  -- ── Merge into whatever is already there ────────────────────────────────
  select coalesce(content -> 'deviceManufacturers', '[]'::jsonb)
    into existing
    from public.site_settings
   where id = 'mobicare-config';

  existing := coalesce(existing, '[]'::jsonb);
  n_before := jsonb_array_length(existing);

  merged := public.novaops_merge_devices(existing, built);
  n_after := jsonb_array_length(merged);

  -- ── Write it back, leaving the rest of site content untouched ───────────
  insert into public.site_settings (id, content)
  values ('mobicare-config', jsonb_build_object('deviceManufacturers', merged))
  on conflict (id) do update
    set content    = public.site_settings.content || jsonb_build_object('deviceManufacturers', merged),
        updated_at = now();

  raise notice 'Imported % device row(s). Manufacturers: % before, % after.',
    n_rows, n_before, n_after;

  -- The wizard renders every level as a row of chips, so a very long list is
  -- a usability problem rather than a data problem. Report the worst ones so
  -- it is visible before a customer meets it.
  for r in
    select mm ->> 'name' as manufacturer, cc ->> 'name' as device_type,
           count(*)::int as models,
           coalesce(max(jsonb_array_length(mo -> 'generations')), 0) as most_generations
    from jsonb_array_elements(merged) mm,
         jsonb_array_elements(mm -> 'categories') cc,
         jsonb_array_elements(cc -> 'models') mo
    group by 1, 2
    having count(*) > 25 or max(jsonb_array_length(mo -> 'generations')) > 25
    order by greatest(count(*), max(jsonb_array_length(mo -> 'generations'))) desc
    limit 10
  loop
    raise notice '  long chip list: % / % — % model(s), up to % generation(s)',
      r.manufacturer, r.device_type, r.models, r.most_generations;
  end loop;
end;
$$;


-- The helpers were only needed for the import.
drop function if exists public.novaops_merge_devices(jsonb, jsonb);
drop function if exists public.novaops_merge_cats(jsonb, jsonb);
drop function if exists public.novaops_merge_models(jsonb, jsonb);
drop function if exists public.novaops_split_model(text, text);
drop function if exists public.novaops_slug(text);
