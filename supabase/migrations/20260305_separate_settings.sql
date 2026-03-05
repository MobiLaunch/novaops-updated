-- ============================================================================
-- NovaOps — Separate Settings Tables Migration
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run
--
-- Fully IDEMPOTENT (safe to re-run).
-- Creates: expenses, square_config
-- Ensures: settings table has profile_id, services table exists
-- ============================================================================

-- ── 0. Helper ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 1. SETTINGS — ensure profile_id exists so we can scope by user
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='settings' AND column_name='profile_id') THEN
    ALTER TABLE settings ADD COLUMN profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS (idempotent)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_owner" ON settings;
CREATE POLICY "settings_owner" ON settings
  USING     (profile_id = auth.uid() OR profile_id IS NULL)
  WITH CHECK (profile_id = auth.uid() OR profile_id IS NULL);


-- ============================================================================
-- 2. SERVICES — ensure table exists (CRUD code already targets it)
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

CREATE INDEX IF NOT EXISTS services_profile_id_idx ON services (profile_id);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_owner" ON services;
CREATE POLICY "services_owner" ON services
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 3. EXPENSES — new standalone table (was JSON blob in profiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text         NOT NULL DEFAULT '',
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  category    text         NOT NULL DEFAULT 'Overhead',
  date        date         NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_profile_id_idx ON expenses (profile_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx       ON expenses (profile_id, date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_owner" ON expenses;
CREATE POLICY "expenses_owner" ON expenses
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 4. SQUARE_CONFIG — Square payment integration credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS square_config (
  id            bigserial    PRIMARY KEY,
  profile_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text         NOT NULL DEFAULT '',
  location_id   text         NOT NULL DEFAULT '',
  sandbox       boolean      NOT NULL DEFAULT false,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);

ALTER TABLE square_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "square_config_owner" ON square_config;
CREATE POLICY "square_config_owner" ON square_config
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER square_config_updated_at
    BEFORE UPDATE ON square_config
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 5. REALTIME — add new tables to publication
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='square_config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE square_config;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='services') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;
END $$;


-- ============================================================================
-- DONE — After running this:
--   1. Go to Settings page → edit business info → Save  (uses `settings` table)
--   2. Add a service → should persist                   (uses `services` table)
--   3. Add an expense → should persist                  (uses `expenses` table)
--   4. Save Square credentials → should persist         (uses `square_config` table)
-- ============================================================================
