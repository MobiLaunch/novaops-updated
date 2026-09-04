-- Lets the website send a customer_messages row without knowing NovaOps's
-- internal Supabase Auth user id ahead of time. Previously the website had
-- to be configured with VITE_NOVAOPS_PROFILE_ID (the shop's own auth uid)
-- before Account -> Messages could send anything — awkward to set up and
-- one more thing to keep in sync if the shop's account ever changes.
--
-- Instead: the website omits profile_id entirely, and this BEFORE INSERT
-- trigger fills it in from public.staff_users (owned by mobicare-business,
-- shared in the same Supabase project) — the same allowlist the website's
-- own admin portal and is_admin() already trust. This assumes a single-shop
-- deployment (one enabled admin); if that ever changes, this is the first
-- place to revisit.
--
-- BEFORE ROW triggers run before the NOT NULL constraint and RLS WITH CHECK
-- are evaluated, so this is compatible with profile_id's existing
-- `not null` column definition and the customer_messages_customer_insert
-- policy (which only checks customer_user_id / direction, not profile_id).

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
