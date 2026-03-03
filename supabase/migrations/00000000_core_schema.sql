-- ============================================================
-- NovaOps — Core Schema Migration
-- Run this FIRST before any other migrations.
-- Creates: profiles, tickets, customers, inventory,
--          house_calls, appointments
-- All rows are scoped to profile_id (the auth user UUID).
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- One row per registered user. Stores business settings and
-- JSON blobs for services and expenses (low cardinality data).
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL DEFAULT '',
  business_name   text NOT NULL DEFAULT '',
  phone           text NOT NULL DEFAULT '',
  address         text NOT NULL DEFAULT '',
  currency        text NOT NULL DEFAULT '$',
  tax_rate        numeric(5,2) NOT NULL DEFAULT 0,
  statuses        text NOT NULL DEFAULT 'Open, In Progress, Waiting for Parts, Completed, Delivered',
  pin             text NOT NULL DEFAULT '1234',
  -- Square integration (stored server-side via settings page)
  square_access_token  text NOT NULL DEFAULT '',
  square_location_id   text NOT NULL DEFAULT '',
  square_sandbox       boolean NOT NULL DEFAULT false,
  -- JSON arrays stored in profile for low-volume data
  services        jsonb NOT NULL DEFAULT '[]',
  expenses        jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner" ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── customers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              bigserial PRIMARY KEY,
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL DEFAULT '',
  phone           text NOT NULL DEFAULT '',
  email           text NOT NULL DEFAULT '',
  address         text NOT NULL DEFAULT '',
  drivers_license text NOT NULL DEFAULT '',
  tags            text[] NOT NULL DEFAULT '{}',
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_profile_id_idx ON customers (profile_id);
CREATE INDEX IF NOT EXISTS customers_email_idx      ON customers (profile_id, email);
CREATE INDEX IF NOT EXISTS customers_name_idx       ON customers (profile_id, name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_owner" ON customers
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── tickets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                  bigserial PRIMARY KEY,
  profile_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id         bigint REFERENCES customers(id) ON DELETE SET NULL,
  device              text NOT NULL DEFAULT '',
  device_model        text NOT NULL DEFAULT '',
  device_description  text NOT NULL DEFAULT '',
  issue               text NOT NULL DEFAULT '',
  status              text NOT NULL DEFAULT 'Open',
  priority            text NOT NULL DEFAULT 'normal',   -- low | normal | high | urgent
  price               numeric(10,2) NOT NULL DEFAULT 0,
  serial_number       text NOT NULL DEFAULT '',
  warranty_days       integer NOT NULL DEFAULT 0,
  warranty_start      date,
  photos              jsonb NOT NULL DEFAULT '[]',
  signature           text,
  notes               jsonb NOT NULL DEFAULT '[]',
  parts               jsonb NOT NULL DEFAULT '[]',
  payments            jsonb NOT NULL DEFAULT '[]',
  time_log            jsonb NOT NULL DEFAULT '[]',
  tracking            jsonb,
  diagnostics         jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_profile_id_idx  ON tickets (profile_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx      ON tickets (profile_id, status);
CREATE INDEX IF NOT EXISTS tickets_customer_id_idx ON tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_created_at_idx  ON tickets (profile_id, created_at DESC);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_owner" ON tickets
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── inventory ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id          bigserial PRIMARY KEY,
  profile_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  sku         text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'Parts',
  model       text NOT NULL DEFAULT '',
  stock       integer NOT NULL DEFAULT 0,
  low         integer NOT NULL DEFAULT 5,    -- low-stock threshold
  cost        numeric(10,2) NOT NULL DEFAULT 0,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_profile_id_idx ON inventory (profile_id);
CREATE INDEX IF NOT EXISTS inventory_sku_idx        ON inventory (profile_id, sku) WHERE sku <> '';

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_owner" ON inventory
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── house_calls ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS house_calls (
  id          bigserial PRIMARY KEY,
  profile_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id bigint REFERENCES customers(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  address     text NOT NULL DEFAULT '',
  date        date,
  time        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'scheduled',   -- scheduled | completed | cancelled
  notes       text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS house_calls_profile_id_idx ON house_calls (profile_id);
CREATE INDEX IF NOT EXISTS house_calls_date_idx       ON house_calls (profile_id, date);

ALTER TABLE house_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "house_calls_owner" ON house_calls
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          bigserial PRIMARY KEY,
  profile_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id bigint REFERENCES customers(id) ON DELETE SET NULL,
  title       text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  date        date,
  time        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'scheduled',   -- scheduled | completed | cancelled | no-show
  notes       text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_profile_id_idx ON appointments (profile_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx       ON appointments (profile_id, date);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_owner" ON appointments
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── updated_at trigger function ──────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Attach triggers (idempotent)
DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER customers_updated_at    BEFORE UPDATE ON customers    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER tickets_updated_at      BEFORE UPDATE ON tickets      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER inventory_updated_at    BEFORE UPDATE ON inventory    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER house_calls_updated_at  BEFORE UPDATE ON house_calls  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Auto-create profile row on signup ────────────────────────
-- This function is triggered by Supabase Auth after new user creation.
-- Ensures profiles.id always has a row to upsert against.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate so reruns are safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Enable Realtime on all core tables ───────────────────────
-- Run in Supabase SQL editor (requires superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE tickets, customers, inventory, house_calls, appointments;
