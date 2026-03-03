   -- ============================================================
-- NovaOps — Full Supabase Schema Migration
-- Safe to run on new OR existing databases.
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
-- Linked to auth.users via id (UUID). Created on first login/register.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT DEFAULT '',
  business_name TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  currency    TEXT DEFAULT '$',
  tax_rate    NUMERIC DEFAULT 0,
  statuses    TEXT DEFAULT 'Open, In Progress, Completed',
  pin         TEXT DEFAULT '1234',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Add columns that may be missing on existing installs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address     TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency    TEXT DEFAULT '$';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_rate    NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS statuses    TEXT DEFAULT 'Open, In Progress, Completed';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin         TEXT DEFAULT '1234';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now();

-- ── 2. CUSTOMERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  drivers_license TEXT DEFAULT '',
  address         TEXT DEFAULT '',
  tags            JSONB DEFAULT '[]'::jsonb,
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS drivers_license TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address         TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags            JSONB DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes           TEXT DEFAULT '';

-- ── 3. TICKETS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id        BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  device             TEXT DEFAULT '',
  device_model       TEXT DEFAULT '',
  device_description TEXT DEFAULT '',
  issue              TEXT DEFAULT '',
  status             TEXT DEFAULT 'Open',
  priority           TEXT DEFAULT 'normal',
  price              NUMERIC DEFAULT 0,
  serial_number      TEXT DEFAULT '',
  warranty_days      INTEGER DEFAULT 0,
  warranty_start     DATE,
  tracking           TEXT,
  signature          TEXT,
  photos             JSONB DEFAULT '[]'::jsonb,
  notes              JSONB DEFAULT '[]'::jsonb,
  parts              JSONB DEFAULT '[]'::jsonb,
  services           JSONB DEFAULT '[]'::jsonb,
  payments           JSONB DEFAULT '[]'::jsonb,
  time_log           JSONB DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS device_model       TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS device_description TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority           TEXT DEFAULT 'normal';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS serial_number      TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS warranty_days      INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS warranty_start     DATE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tracking           TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS signature          TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS photos             JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes              JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS parts              JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS services           JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payments           JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS time_log           JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

-- ── 4. INVENTORY ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  sku         TEXT DEFAULT '',
  category    TEXT DEFAULT 'Parts',
  stock       INTEGER DEFAULT 0,
  low         INTEGER DEFAULT 5,
  cost        NUMERIC DEFAULT 0,
  price       NUMERIC DEFAULT 0,
  model       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sku       TEXT DEFAULT '';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS category  TEXT DEFAULT 'Parts';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS low       INTEGER DEFAULT 5;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cost      NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS model     TEXT DEFAULT '';

-- ── 5. HOUSE CALLS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS house_calls (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  date        DATE,
  time        TEXT DEFAULT '',
  status      TEXT DEFAULT 'scheduled',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE house_calls ADD COLUMN IF NOT EXISTS time    TEXT DEFAULT '';
ALTER TABLE house_calls ADD COLUMN IF NOT EXISTS notes   TEXT DEFAULT '';

-- ── 6. APPOINTMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  date        DATE,
  time        TEXT DEFAULT '',
  status      TEXT DEFAULT 'scheduled',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS title  TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time   TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes  TEXT DEFAULT '';

-- ── 7. DEVICES (lookup table for ticket wizard) ──────────────
-- Brand → Category → Model hierarchy used by NewTicketDialog
CREATE TABLE IF NOT EXISTS devices (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand    TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  name     TEXT NOT NULL DEFAULT ''
);

-- ── 8. SERVICES (service catalog) ────────────────────────────
-- Used by TicketDetailDialog to look up labor, and Services page
CREATE TABLE IF NOT EXISTS services (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  description       TEXT DEFAULT '',
  category          TEXT DEFAULT '',
  flat_rate         NUMERIC DEFAULT 0,
  hourly_rate       NUMERIC DEFAULT 75,
  estimated_minutes INTEGER DEFAULT 60,
  price             NUMERIC DEFAULT 0,
  duration          INTEGER DEFAULT 60,
  active            BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS description       TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS category          TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS flat_rate         NUMERIC DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS hourly_rate       NUMERIC DEFAULT 75;
ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 60;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price             NUMERIC DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration          INTEGER DEFAULT 60;
ALTER TABLE services ADD COLUMN IF NOT EXISTS active            BOOLEAN DEFAULT true;

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ══════════════════════════════════════════════════════════════

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_calls  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services     ENABLE ROW LEVEL SECURITY;
-- devices is a shared lookup table — no RLS needed

-- Helper: drop policies if they exist, then recreate
-- (Postgres doesn't have CREATE POLICY IF NOT EXISTS)

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TICKETS
DROP POLICY IF EXISTS "Users can CRUD own tickets" ON tickets;
CREATE POLICY "Users can CRUD own tickets" ON tickets FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can CRUD own customers" ON customers;
CREATE POLICY "Users can CRUD own customers" ON customers FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- INVENTORY
DROP POLICY IF EXISTS "Users can CRUD own inventory" ON inventory;
CREATE POLICY "Users can CRUD own inventory" ON inventory FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- HOUSE CALLS
DROP POLICY IF EXISTS "Users can CRUD own house_calls" ON house_calls;
CREATE POLICY "Users can CRUD own house_calls" ON house_calls FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users can CRUD own appointments" ON appointments;
CREATE POLICY "Users can CRUD own appointments" ON appointments FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- SERVICES
DROP POLICY IF EXISTS "Users can CRUD own services" ON services;
CREATE POLICY "Users can CRUD own services" ON services FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- DEVICES (public read for all authenticated users)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read devices" ON devices;
CREATE POLICY "Authenticated users can read devices" ON devices FOR SELECT USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- REALTIME — enable for tables that use live subscriptions
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE customers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE house_calls;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE on new user signup (trigger)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'businessName', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- INDEXES for common queries
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tickets_profile      ON tickets(profile_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status       ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_customers_profile    ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_inventory_profile    ON inventory(profile_id);
CREATE INDEX IF NOT EXISTS idx_house_calls_profile  ON house_calls(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_profile ON appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_profile     ON services(profile_id);
CREATE INDEX IF NOT EXISTS idx_devices_brand        ON devices(brand);

-- ══════════════════════════════════════════════════════════════
-- SEED: Sample devices for the ticket wizard (optional)
-- Only inserts if the devices table is empty
-- ══════════════════════════════════════════════════════════════

INSERT INTO devices (brand, category, name)
SELECT * FROM (VALUES
  -- Apple iPhones
  ('Apple', 'iPhone', 'iPhone 16 Pro Max'),
  ('Apple', 'iPhone', 'iPhone 16 Pro'),
  ('Apple', 'iPhone', 'iPhone 16'),
  ('Apple', 'iPhone', 'iPhone 15 Pro Max'),
  ('Apple', 'iPhone', 'iPhone 15 Pro'),
  ('Apple', 'iPhone', 'iPhone 15'),
  ('Apple', 'iPhone', 'iPhone 14 Pro Max'),
  ('Apple', 'iPhone', 'iPhone 14 Pro'),
  ('Apple', 'iPhone', 'iPhone 14'),
  ('Apple', 'iPhone', 'iPhone 13'),
  ('Apple', 'iPhone', 'iPhone 12'),
  ('Apple', 'iPhone', 'iPhone 11'),
  ('Apple', 'iPhone', 'iPhone SE (3rd Gen)'),
  -- Apple iPads
  ('Apple', 'iPad', 'iPad Pro 13" (M4)'),
  ('Apple', 'iPad', 'iPad Pro 11" (M4)'),
  ('Apple', 'iPad', 'iPad Air (M2)'),
  ('Apple', 'iPad', 'iPad (10th Gen)'),
  ('Apple', 'iPad', 'iPad Mini (6th Gen)'),
  -- Apple Watch
  ('Apple', 'Watch', 'Apple Watch Ultra 2'),
  ('Apple', 'Watch', 'Apple Watch Series 9'),
  ('Apple', 'Watch', 'Apple Watch SE (2nd Gen)'),
  -- Apple Mac
  ('Apple', 'Mac', 'MacBook Pro 16"'),
  ('Apple', 'Mac', 'MacBook Pro 14"'),
  ('Apple', 'Mac', 'MacBook Air 15"'),
  ('Apple', 'Mac', 'MacBook Air 13"'),
  ('Apple', 'Mac', 'iMac 24"'),
  -- Samsung Phones
  ('Samsung', 'Phone', 'Galaxy S25 Ultra'),
  ('Samsung', 'Phone', 'Galaxy S25+'),
  ('Samsung', 'Phone', 'Galaxy S25'),
  ('Samsung', 'Phone', 'Galaxy S24 Ultra'),
  ('Samsung', 'Phone', 'Galaxy S24+'),
  ('Samsung', 'Phone', 'Galaxy S24'),
  ('Samsung', 'Phone', 'Galaxy S23'),
  ('Samsung', 'Phone', 'Galaxy Z Fold 6'),
  ('Samsung', 'Phone', 'Galaxy Z Flip 6'),
  ('Samsung', 'Phone', 'Galaxy A55'),
  ('Samsung', 'Phone', 'Galaxy A35'),
  ('Samsung', 'Phone', 'Galaxy A15'),
  -- Samsung Tablets
  ('Samsung', 'Tablet', 'Galaxy Tab S9 Ultra'),
  ('Samsung', 'Tablet', 'Galaxy Tab S9+'),
  ('Samsung', 'Tablet', 'Galaxy Tab S9'),
  ('Samsung', 'Tablet', 'Galaxy Tab A9+'),
  -- Samsung Watch
  ('Samsung', 'Watch', 'Galaxy Watch Ultra'),
  ('Samsung', 'Watch', 'Galaxy Watch 7'),
  -- Google
  ('Google', 'Phone', 'Pixel 9 Pro XL'),
  ('Google', 'Phone', 'Pixel 9 Pro'),
  ('Google', 'Phone', 'Pixel 9'),
  ('Google', 'Phone', 'Pixel 8 Pro'),
  ('Google', 'Phone', 'Pixel 8'),
  ('Google', 'Phone', 'Pixel 8a'),
  ('Google', 'Phone', 'Pixel 7'),
  ('Google', 'Tablet', 'Pixel Tablet'),
  ('Google', 'Watch', 'Pixel Watch 3'),
  -- OnePlus
  ('OnePlus', 'Phone', 'OnePlus 13'),
  ('OnePlus', 'Phone', 'OnePlus 12'),
  ('OnePlus', 'Phone', 'OnePlus Nord 4'),
  -- Motorola
  ('Motorola', 'Phone', 'Edge 50 Ultra'),
  ('Motorola', 'Phone', 'Razr+ (2024)'),
  ('Motorola', 'Phone', 'Moto G Power (2024)'),
  -- Other
  ('Other', 'Phone', 'Other Phone'),
  ('Other', 'Tablet', 'Other Tablet'),
  ('Other', 'Laptop', 'Other Laptop'),
  ('Other', 'Watch', 'Other Watch'),
  ('Other', 'Console', 'Nintendo Switch'),
  ('Other', 'Console', 'PlayStation 5'),
  ('Other', 'Console', 'Xbox Series X'),
  ('Other', 'Other', 'Other Device')
) AS v(brand, category, name)
WHERE NOT EXISTS (SELECT 1 FROM devices LIMIT 1);

-- ✅ Done! All tables, RLS policies, realtime, and indexes are set up.
