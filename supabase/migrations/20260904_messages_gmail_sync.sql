-- Adds the column api/fetch-emails.js needs to upsert Gmail messages into
-- `messages` without creating duplicates on repeat syncs.

alter table if exists public.messages
  add column if not exists gmail_message_id text;

create unique index if not exists messages_gmail_message_id_key on public.messages(gmail_message_id) where gmail_message_id is not null;
