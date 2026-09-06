-- ============================================================================
-- List views, search indexes, and a low-stock flag
--
-- The Customers, Inventory, and Messages pages used to download their whole
-- table and do the searching, counting, and totalling in the browser. Serving
-- one page at a time needs three things Postgres has to provide:
--
--   1. A filter for "stock is at or below its threshold". PostgREST can't
--      compare two columns, so the comparison becomes a stored generated
--      column that can also be indexed.
--   2. Per-customer ticket counts and lifetime value, which the browser was
--      deriving by joining every ticket and every sale itself.
--   3. Indexes that make ILIKE '%term%' searches usable, via pg_trgm.
--
-- Every view is security_invoker, so the caller's row-level security applies
-- exactly as it does on the underlying tables — a view without it would run
-- as its owner and hand one shop another shop's rows.
--
-- Safe to re-run.
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

