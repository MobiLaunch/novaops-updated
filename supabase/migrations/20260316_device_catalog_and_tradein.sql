-- ══════════════════════════════════════════════════════════════════════════════
-- NovaOps: Device Catalog + Trade-In
-- Run in Supabase SQL editor or via `supabase db push`
-- ══════════════════════════════════════════════════════════════════════════════

-- ── device_brands ─────────────────────────────────────────────────────────────
-- User-defined brand overrides/additions. Merged with the built-in KNOWN_BRANDS
-- list in the UI. icon_url accepts a full https:// URL or a simpleicons.org slug.
CREATE TABLE IF NOT EXISTS device_brands (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text         NOT NULL,
  icon_url    text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id, name)
);

ALTER TABLE device_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "device_brands_owner" ON device_brands;
CREATE POLICY "device_brands_owner" ON device_brands
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── device_categories ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_categories (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text         NOT NULL,
  emoji       text         NOT NULL DEFAULT '📦',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id, name)
);

ALTER TABLE device_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "device_categories_owner" ON device_categories;
CREATE POLICY "device_categories_owner" ON device_categories
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── device_models ─────────────────────────────────────────────────────────────
-- Per-user model overrides. Supplements the shared `devices` table.
CREATE TABLE IF NOT EXISTS device_models (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand       text         NOT NULL,
  category    text         NOT NULL,
  name        text         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id, brand, category, name)
);

ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "device_models_owner" ON device_models;
CREATE POLICY "device_models_owner" ON device_models
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── trade_ins ─────────────────────────────────────────────────────────────────
-- Each row is a completed trade-in evaluation. The wizard calculates
-- offer_price and estimated_resale; the shop decides whether to accept.
CREATE TABLE IF NOT EXISTS trade_ins (
  id                  bigserial    PRIMARY KEY,
  profile_id          uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id         bigint       REFERENCES customers(id) ON DELETE SET NULL,

  -- Device identity
  brand               text         NOT NULL DEFAULT '',
  model               text         NOT NULL DEFAULT '',
  model_number        text         NOT NULL DEFAULT '',   -- e.g. MQ3D3LL/A, SM-G998B
  imei                text         NOT NULL DEFAULT '',   -- 15-digit IMEI or serial
  storage             text         NOT NULL DEFAULT '',
  color               text         NOT NULL DEFAULT '',

  -- Condition inputs (wizard answers)
  condition_grade     text         NOT NULL DEFAULT 'Good',   -- Excellent/Good/Fair/Poor
  age_years           numeric(4,1) NOT NULL DEFAULT 0,
  screen_condition    text         NOT NULL DEFAULT 'Perfect', -- Perfect/Minor Scratches/Cracked/Shattered
  battery_health      int          NOT NULL DEFAULT 80,        -- 0–100 %
  functional_issues   text[]       NOT NULL DEFAULT '{}',     -- ['charging_port','camera',…]
  cosmetic_issues     text[]       NOT NULL DEFAULT '{}',     -- ['dents','back_cracked',…]
  accessories         text[]       NOT NULL DEFAULT '{}',     -- ['box','charger','earphones']
  icloud_locked       boolean      NOT NULL DEFAULT false,
  frp_locked          boolean      NOT NULL DEFAULT false,

  -- Pricing outputs
  market_price        numeric(10,2),   -- fetched market value (MSRP or eBay sold)
  repair_cost_est     numeric(10,2),   -- estimated cost to restore to resale condition
  offer_price         numeric(10,2),   -- what the shop will pay the customer
  estimated_resale    numeric(10,2),   -- expected sale price after refurbishment
  estimated_profit    numeric(10,2),   -- estimated_resale - offer_price - repair_cost_est

  -- Outcome
  status              text         NOT NULL DEFAULT 'Pending', -- Pending/Accepted/Declined/Completed
  notes               text         NOT NULL DEFAULT '',

  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trade_ins_owner" ON trade_ins;
CREATE POLICY "trade_ins_owner" ON trade_ins
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE TRIGGER trade_ins_updated_at
  BEFORE UPDATE ON trade_ins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_device_brands_profile     ON device_brands(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_categories_profile ON device_categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_models_profile     ON device_models(profile_id);
CREATE INDEX IF NOT EXISTS idx_trade_ins_profile         ON trade_ins(profile_id);
CREATE INDEX IF NOT EXISTS idx_trade_ins_customer        ON trade_ins(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_ins_status          ON trade_ins(status);

-- ── pos_sales ─────────────────────────────────────────────────────────────────
-- Regular point-of-sale transactions. Completely separate from tickets, which
-- are repair jobs. ticketMode payments (paying off a repair) update the
-- ticket's payments JSONB array and reference this sale's ID in the note.
CREATE TABLE IF NOT EXISTS pos_sales (
  id             bigserial    PRIMARY KEY,
  profile_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id    bigint       REFERENCES customers(id) ON DELETE SET NULL,

  -- Line items as JSONB array: [{name, price, quantity, sku?}]
  items          jsonb        NOT NULL DEFAULT '[]',

  subtotal       numeric(10,2) NOT NULL DEFAULT 0,
  tax            numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text         NOT NULL DEFAULT 'Cash',
  note           text         NOT NULL DEFAULT '',

  -- 'completed' | 'refunded' | 'voided'
  status         text         NOT NULL DEFAULT 'completed',

  created_at     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_sales_owner" ON pos_sales;
CREATE POLICY "pos_sales_owner" ON pos_sales
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pos_sales_profile    ON pos_sales(profile_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_customer   ON pos_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at ON pos_sales(created_at DESC);
