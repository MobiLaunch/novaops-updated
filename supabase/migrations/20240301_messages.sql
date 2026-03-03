-- ============================================================
-- NovaOps — Messages Migration
-- Adds the messages table for customer communication (email,
-- SMS, chat). All rows scoped to profile_id (auth user UUID).
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id              bigserial PRIMARY KEY,
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id     bigint REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   text NOT NULL DEFAULT '',
  customer_email  text NOT NULL DEFAULT '',
  channel         text NOT NULL DEFAULT 'email',   -- email | sms | chat
  direction       text NOT NULL DEFAULT 'outbound', -- inbound | outbound
  subject         text NOT NULL DEFAULT '',
  body            text NOT NULL DEFAULT '',
  ticket_id       bigint REFERENCES tickets(id) ON DELETE SET NULL,
  read            boolean NOT NULL DEFAULT false,
  delivered       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_profile_id_idx     ON messages (profile_id);
CREATE INDEX IF NOT EXISTS messages_customer_id_idx    ON messages (profile_id, customer_id);
CREATE INDEX IF NOT EXISTS messages_customer_email_idx ON messages (profile_id, customer_email);
CREATE INDEX IF NOT EXISTS messages_created_at_idx     ON messages (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_ticket_id_idx      ON messages (ticket_id) WHERE ticket_id IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_owner" ON messages
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Attach updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable Realtime (run in Supabase SQL editor with superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
