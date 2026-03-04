-- ============================================================================
-- NovaOps — Schema Realignment Migration
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run
--
-- This script is fully IDEMPOTENT (safe to re-run at any time).
-- It brings the live database in sync with what the codebase expects.
--
-- Fixes:
--   1. profiles: add missing services, expenses, display_slides, display_config
--   2. services: create table (code does CRUD on it, no migration existed)
--   3. inventory: add missing item_type, description columns
--   4. vendor_repairs: create table if missing
--   5. messages: create table if missing
--   6. Realtime publication for new tables
-- ============================================================================


-- ── 0. Ensure updated_at trigger function exists ────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 1. PROFILES — add missing columns
-- ============================================================================

DO $$ BEGIN
  -- services JSON blob (used by saveSettings / saveAll in app.ts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='services') THEN
    ALTER TABLE profiles ADD COLUMN services jsonb NOT NULL DEFAULT '[]';
  END IF;

  -- expenses JSON blob (used by saveSettings / saveAll in app.ts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='expenses') THEN
    ALTER TABLE profiles ADD COLUMN expenses jsonb NOT NULL DEFAULT '[]';
  END IF;

  -- display_slides (used by website-settings.vue and display.vue)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='display_slides') THEN
    ALTER TABLE profiles ADD COLUMN display_slides jsonb NOT NULL DEFAULT '[]';
  END IF;

  -- display_config (used by website-settings.vue and display.vue)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='display_config') THEN
    ALTER TABLE profiles ADD COLUMN display_config jsonb NOT NULL DEFAULT '{}';
  END IF;
END $$;


-- ============================================================================
-- 2. SERVICES TABLE — code does full CRUD, no migration ever created it
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id                bigserial    PRIMARY KEY,
  profile_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text         NOT NULL DEFAULT '',
  category          text         NOT NULL DEFAULT 'Services',
  description       text         NOT NULL DEFAULT '',
  price             numeric(10,2) NOT NULL DEFAULT 0,
  estimated_minutes integer      NOT NULL DEFAULT 0,
  duration          integer      NOT NULL DEFAULT 0,
  active            boolean      NOT NULL DEFAULT true,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS services_profile_id_idx ON services (profile_id);
CREATE INDEX IF NOT EXISTS services_active_idx     ON services (profile_id, active) WHERE active = true;

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_owner" ON services;
CREATE POLICY "services_owner" ON services
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Trigger
DO $$ BEGIN
  CREATE TRIGGER services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 3. INVENTORY — add missing columns
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory' AND column_name='item_type') THEN
    ALTER TABLE inventory ADD COLUMN item_type text NOT NULL DEFAULT 'product';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory' AND column_name='description') THEN
    ALTER TABLE inventory ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;


-- ============================================================================
-- 4. VENDOR_REPAIRS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_repairs (
  id              bigserial    PRIMARY KEY,
  profile_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id     bigint       REFERENCES customers(id) ON DELETE SET NULL,
  device          text         NOT NULL DEFAULT '',
  issue           text         NOT NULL DEFAULT '',
  vendor          text         NOT NULL DEFAULT '',
  ticket_ref      text         NOT NULL DEFAULT '',
  tracking_number text         NOT NULL DEFAULT '',
  status          text         NOT NULL DEFAULT 'Preparing to Ship',
  sent_date       date,
  est_return      date,
  notes           text         NOT NULL DEFAULT '',
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_repairs_profile_id_idx ON vendor_repairs (profile_id);

ALTER TABLE vendor_repairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendor_repairs_owner" ON vendor_repairs;
CREATE POLICY "vendor_repairs_owner" ON vendor_repairs
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER vendor_repairs_updated_at
    BEFORE UPDATE ON vendor_repairs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 5. MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id              bigserial    PRIMARY KEY,
  profile_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id     bigint       REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   text         NOT NULL DEFAULT '',
  customer_email  text         NOT NULL DEFAULT '',
  channel         text         NOT NULL DEFAULT 'email',    -- email | sms | chat
  direction       text         NOT NULL DEFAULT 'outbound', -- inbound | outbound
  subject         text         NOT NULL DEFAULT '',
  body            text         NOT NULL DEFAULT '',
  ticket_id       bigint       REFERENCES tickets(id) ON DELETE SET NULL,
  read            boolean      NOT NULL DEFAULT false,
  delivered       boolean      NOT NULL DEFAULT false,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_profile_id_idx     ON messages (profile_id);
CREATE INDEX IF NOT EXISTS messages_customer_id_idx    ON messages (profile_id, customer_id);
CREATE INDEX IF NOT EXISTS messages_customer_email_idx ON messages (profile_id, customer_email);
CREATE INDEX IF NOT EXISTS messages_created_at_idx     ON messages (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_ticket_id_idx      ON messages (ticket_id) WHERE ticket_id IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_owner" ON messages;
CREATE POLICY "messages_owner" ON messages
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 6. REALTIME — add new tables to publication
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='services') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='vendor_repairs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE vendor_repairs;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;


-- ============================================================================
-- DONE — After running this:
--   1. Go to Settings page → edit business info → Save
--   2. Refresh the page — settings should persist
--   3. Check Supabase Table Editor → profiles → verify updated values
-- ============================================================================
