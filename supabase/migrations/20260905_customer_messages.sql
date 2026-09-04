-- Direct customer <-> shop messaging, separate from the Gmail-synced
-- `messages` table. A signed-in website customer writes a row here (as
-- themselves); the shop reads/replies from NovaOps Messages -> Customer
-- Chat. This table is NEW on both sides — the mobicare-business website
-- doesn't have a composer for it yet (see README "Customer chat" section
-- for what that needs).

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

create index if not exists customer_messages_profile_id_idx  on customer_messages(profile_id, created_at desc);
create index if not exists customer_messages_customer_idx    on customer_messages(customer_user_id);
create index if not exists customer_messages_ticket_id_idx   on customer_messages(ticket_id);

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
