-- Parts-order tracking: lets NovaOps auto-collect shipping/delivery info
-- from known parts-supplier emails (synced via api/fetch-emails.js) and
-- surface them as a "Parts Orders" tab plus calendar entries, with the
-- ability to assign an incoming shipment to the customer ticket it's for.

-- Per-shop supplier email allowlist (edited from Settings). Defaults to the
-- two suppliers mentioned when this was set up; each shop can add more.
alter table if exists profiles
  add column if not exists supplier_emails text[] not null default array['konok@mobilesentrix.com', 'support@injuredgadgets.com'];

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

create index if not exists shipments_profile_id_idx  on shipments(profile_id);
create index if not exists shipments_ticket_id_idx   on shipments(ticket_id);
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
