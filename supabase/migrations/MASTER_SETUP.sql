-- ============================================================================
-- NovaOps — MASTER SETUP SQL
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- This single file is fully idempotent (safe to re-run).
-- It creates ALL tables, columns, indexes, RLS policies, triggers,
-- realtime publication entries, and the auth-user auto-profile trigger.
--
-- Tables created:
--   profiles             (1 row per user — all business settings)
--   customers
--   tickets
--   inventory
--   house_calls
--   appointments
--   brand_settings       (Brand Manager portal/booking config)
--   social_connections   (OAuth tokens for Facebook/Google/Instagram/Yelp)
--   social_interactions  (Reviews, comments, messages)
--   social_posts         (Scheduled/published posts)
--   auto_response_rules  (Auto-reply rules)
--   social_sync_log      (Audit trail)
-- ============================================================================


-- ── 0. Helper: updated_at auto-stamp function ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per registered user.
-- Stores business settings, Square creds, and JSON blobs for
-- low-cardinality data (services list, expenses list).
-- display_slides / display_config power the customer-facing TV display.

CREATE TABLE IF NOT EXISTS profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                text        NOT NULL DEFAULT '',
  business_name        text        NOT NULL DEFAULT '',
  phone                text        NOT NULL DEFAULT '',
  address              text        NOT NULL DEFAULT '',
  currency             text        NOT NULL DEFAULT '$',
  tax_rate             numeric(5,2) NOT NULL DEFAULT 0,
  statuses             text        NOT NULL DEFAULT 'Open, In Progress, Waiting for Parts, Completed, Delivered',
  pin                  text        NOT NULL DEFAULT '1234',
  -- Square POS integration
  square_access_token  text        NOT NULL DEFAULT '',
  square_location_id   text        NOT NULL DEFAULT '',
  square_sandbox       boolean     NOT NULL DEFAULT false,
  -- JSON blobs for low-volume data (no separate table needed)
  services             jsonb       NOT NULL DEFAULT '[]',
  expenses             jsonb       NOT NULL DEFAULT '[]',
  -- Customer-facing TV display
  display_slides       jsonb       NOT NULL DEFAULT '[]',
  display_config       jsonb       NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Add display columns to existing installs (safe if they already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='display_slides') THEN
    ALTER TABLE profiles ADD COLUMN display_slides jsonb NOT NULL DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='display_config') THEN
    ALTER TABLE profiles ADD COLUMN display_config jsonb NOT NULL DEFAULT '{}';
  END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_owner" ON profiles;
CREATE POLICY "profiles_owner" ON profiles
  USING     (id = auth.uid())
  WITH CHECK (id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── customers ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id              bigserial    PRIMARY KEY,
  profile_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text         NOT NULL DEFAULT '',
  phone           text         NOT NULL DEFAULT '',
  email           text         NOT NULL DEFAULT '',
  address         text         NOT NULL DEFAULT '',
  drivers_license text         NOT NULL DEFAULT '',
  tags            text[]       NOT NULL DEFAULT '{}',
  notes           text         NOT NULL DEFAULT '',
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_profile_id_idx ON customers (profile_id);
CREATE INDEX IF NOT EXISTS customers_email_idx      ON customers (profile_id, email);
CREATE INDEX IF NOT EXISTS customers_name_idx       ON customers (profile_id, name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_owner" ON customers;
CREATE POLICY "customers_owner" ON customers
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── tickets ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tickets (
  id                  bigserial    PRIMARY KEY,
  profile_id          uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id         bigint       REFERENCES customers(id) ON DELETE SET NULL,
  device              text         NOT NULL DEFAULT '',
  device_model        text         NOT NULL DEFAULT '',
  device_description  text         NOT NULL DEFAULT '',
  issue               text         NOT NULL DEFAULT '',
  status              text         NOT NULL DEFAULT 'Open',
  priority            text         NOT NULL DEFAULT 'normal',  -- low | normal | high | urgent
  price               numeric(10,2) NOT NULL DEFAULT 0,
  serial_number       text         NOT NULL DEFAULT '',
  warranty_days       integer      NOT NULL DEFAULT 0,
  warranty_start      date,
  photos              jsonb        NOT NULL DEFAULT '[]',
  signature           text,
  notes               jsonb        NOT NULL DEFAULT '[]',
  parts               jsonb        NOT NULL DEFAULT '[]',
  payments            jsonb        NOT NULL DEFAULT '[]',
  time_log            jsonb        NOT NULL DEFAULT '[]',
  tracking            jsonb,
  diagnostics         jsonb,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_profile_id_idx  ON tickets (profile_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx      ON tickets (profile_id, status);
CREATE INDEX IF NOT EXISTS tickets_customer_id_idx ON tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_created_at_idx  ON tickets (profile_id, created_at DESC);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_owner" ON tickets;
CREATE POLICY "tickets_owner" ON tickets
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── inventory ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text         NOT NULL DEFAULT '',
  sku         text         NOT NULL DEFAULT '',
  category    text         NOT NULL DEFAULT 'Parts',
  model       text         NOT NULL DEFAULT '',
  stock       integer      NOT NULL DEFAULT 0,
  low         integer      NOT NULL DEFAULT 5,   -- low-stock alert threshold
  cost        numeric(10,2) NOT NULL DEFAULT 0,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_profile_id_idx ON inventory (profile_id);
CREATE INDEX IF NOT EXISTS inventory_sku_idx        ON inventory (profile_id, sku) WHERE sku <> '';

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_owner" ON inventory;
CREATE POLICY "inventory_owner" ON inventory
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── house_calls ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS house_calls (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id bigint       REFERENCES customers(id) ON DELETE SET NULL,
  description text         NOT NULL DEFAULT '',
  address     text         NOT NULL DEFAULT '',
  date        date,
  time        text         NOT NULL DEFAULT '',
  status      text         NOT NULL DEFAULT 'scheduled',  -- scheduled | completed | cancelled
  notes       text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS house_calls_profile_id_idx ON house_calls (profile_id);
CREATE INDEX IF NOT EXISTS house_calls_date_idx       ON house_calls (profile_id, date);

ALTER TABLE house_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "house_calls_owner" ON house_calls;
CREATE POLICY "house_calls_owner" ON house_calls
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER house_calls_updated_at
    BEFORE UPDATE ON house_calls
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── appointments ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id          bigserial    PRIMARY KEY,
  profile_id  uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id bigint       REFERENCES customers(id) ON DELETE SET NULL,
  title       text         NOT NULL DEFAULT '',
  description text         NOT NULL DEFAULT '',
  date        date,
  time        text         NOT NULL DEFAULT '',
  status      text         NOT NULL DEFAULT 'scheduled',  -- scheduled | confirmed | completed | cancelled | no-show
  notes       text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_profile_id_idx ON appointments (profile_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx       ON appointments (profile_id, date);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_owner" ON appointments;
CREATE POLICY "appointments_owner" ON appointments
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- BRAND MANAGER TABLES
-- ============================================================================

-- ── brand_settings ────────────────────────────────────────────────────────────
-- One row per user. Portal/booking config and auto-response toggle.

CREATE TABLE IF NOT EXISTS brand_settings (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_enabled        boolean      NOT NULL DEFAULT false,
  portal_slug           text         NOT NULL DEFAULT '',
  welcome_message       text         NOT NULL DEFAULT '',
  booking_enabled       boolean      NOT NULL DEFAULT false,
  booking_open          text         NOT NULL DEFAULT '09:00',
  booking_close         text         NOT NULL DEFAULT '17:00',
  slot_duration         integer      NOT NULL DEFAULT 30,
  auto_response_enabled boolean      NOT NULL DEFAULT false,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);

ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand_settings_owner" ON brand_settings;
CREATE POLICY "brand_settings_owner" ON brand_settings
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER brand_settings_updated_at
    BEFORE UPDATE ON brand_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── social_connections ────────────────────────────────────────────────────────
-- One row per platform per user. Stores OAuth tokens (treat as secrets).
-- access_token and refresh_token are REVOKED from the browser-facing
-- 'authenticated' role — only server routes (service_role) can read them.

CREATE TABLE IF NOT EXISTS social_connections (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform         text         NOT NULL,   -- 'facebook' | 'google' | 'instagram' | 'yelp'
  platform_id      text,                    -- external account/page ID
  handle           text,                    -- display name / @handle
  access_token     text,                    -- OAuth access token  ← hidden from browser
  refresh_token    text,                    -- OAuth refresh token ← hidden from browser
  token_expires_at timestamptz,
  scopes           text[]       NOT NULL DEFAULT '{}',
  connected        boolean      NOT NULL DEFAULT true,
  meta             jsonb        NOT NULL DEFAULT '{}',  -- cached: followers, rating, etc.
  last_synced_at   timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (profile_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_connections_owner"        ON social_connections;
DROP POLICY IF EXISTS "social_connections_owner_read"   ON social_connections;
DROP POLICY IF EXISTS "social_connections_owner_write"  ON social_connections;

-- Owner can read all their own rows (token columns are revoked separately below)
CREATE POLICY "social_connections_owner_read" ON social_connections
  FOR SELECT USING (profile_id = auth.uid());

-- Owner can insert/update/delete their own rows
CREATE POLICY "social_connections_owner_write" ON social_connections
  FOR ALL
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Hide raw tokens from the browser (service_role bypasses this)
REVOKE SELECT (access_token, refresh_token) ON social_connections FROM authenticated;

DO $$ BEGIN
  CREATE TRIGGER social_connections_updated_at
    BEFORE UPDATE ON social_connections
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── social_interactions ───────────────────────────────────────────────────────
-- Reviews, comments, messages — from connected platforms or manually logged.

CREATE TABLE IF NOT EXISTS social_interactions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text         NOT NULL,   -- 'google' | 'facebook' | 'instagram' | 'yelp'
  platform_ref_id text,                    -- external ID (deduplication)
  author_name     text         NOT NULL DEFAULT '',
  author_id       text,
  type            text         NOT NULL DEFAULT 'Review',  -- 'Review' | 'Comment' | 'Message'
  content         text         NOT NULL DEFAULT '',
  rating          integer      CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  sentiment       text         NOT NULL DEFAULT 'neutral', -- 'positive' | 'neutral' | 'negative'
  likes           integer,
  url             text,
  unread          boolean      NOT NULL DEFAULT true,
  starred         boolean      NOT NULL DEFAULT false,
  archived        boolean      NOT NULL DEFAULT false,
  our_reply       text,
  reply_posted_at timestamptz,
  reply_posted_to text,
  interaction_at  timestamptz  NOT NULL DEFAULT now(),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_interactions_profile_id_idx   ON social_interactions (profile_id);
CREATE INDEX IF NOT EXISTS social_interactions_platform_idx     ON social_interactions (profile_id, platform);
CREATE INDEX IF NOT EXISTS social_interactions_unread_idx       ON social_interactions (profile_id, unread) WHERE unread = true;
CREATE INDEX IF NOT EXISTS social_interactions_platform_ref_idx ON social_interactions (platform, platform_ref_id) WHERE platform_ref_id IS NOT NULL;

ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_interactions_owner" ON social_interactions;
CREATE POLICY "social_interactions_owner" ON social_interactions
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER social_interactions_updated_at
    BEFORE UPDATE ON social_interactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── social_posts ──────────────────────────────────────────────────────────────
-- Posts authored in Brand Manager — drafted, scheduled, or published.

CREATE TABLE IF NOT EXISTS social_posts (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           text         NOT NULL DEFAULT '',
  targets           text[]       NOT NULL DEFAULT '{}',   -- e.g. ['facebook','google']
  media_urls        text[]       NOT NULL DEFAULT '{}',
  status            text         NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for     timestamptz,
  published_at      timestamptz,
  platform_post_ids jsonb        NOT NULL DEFAULT '{}',   -- { "facebook": "123", "google": "abc" }
  error_message     text,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_posts_profile_id_idx ON social_posts (profile_id);
CREATE INDEX IF NOT EXISTS social_posts_scheduled_idx  ON social_posts (profile_id, scheduled_for) WHERE status = 'scheduled';

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_posts_owner" ON social_posts;
CREATE POLICY "social_posts_owner" ON social_posts
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── auto_response_rules ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auto_response_rules (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type   text         NOT NULL,   -- 'rating_gte' | 'rating_lte' | 'keyword'
  trigger_value  text         NOT NULL,   -- '5' | '2' | 'great service'
  response_text  text         NOT NULL DEFAULT '',
  enabled        boolean      NOT NULL DEFAULT true,
  sort_order     integer      NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE auto_response_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auto_response_rules_owner" ON auto_response_rules;
CREATE POLICY "auto_response_rules_owner" ON auto_response_rules
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DO $$ BEGIN
  CREATE TRIGGER auto_response_rules_updated_at
    BEFORE UPDATE ON auto_response_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── social_sync_log ───────────────────────────────────────────────────────────
-- Audit trail for platform API syncs and webhook deliveries.

CREATE TABLE IF NOT EXISTS social_sync_log (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       text         NOT NULL,
  sync_type      text         NOT NULL DEFAULT 'pull',   -- 'pull' | 'webhook' | 'publish' | 'reply'
  status         text         NOT NULL DEFAULT 'ok',     -- 'ok' | 'error' | 'partial'
  items_synced   integer      NOT NULL DEFAULT 0,
  error_message  text,
  meta           jsonb        NOT NULL DEFAULT '{}',
  created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_sync_log_profile_platform_idx
  ON social_sync_log (profile_id, platform, created_at DESC);

ALTER TABLE social_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_sync_log_owner" ON social_sync_log;
CREATE POLICY "social_sync_log_owner" ON social_sync_log
  USING     (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());


-- ============================================================================
-- SERVER-SIDE HELPER FUNCTION
-- ============================================================================
-- Used by Nuxt server routes (service_role) to fetch a platform's OAuth token.
-- The 'authenticated' (browser) role is explicitly denied execute access.

CREATE OR REPLACE FUNCTION get_platform_connection(
  p_profile_id  uuid,
  p_platform    text
)
RETURNS TABLE (
  id               uuid,
  platform_id      text,
  handle           text,
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  scopes           text[],
  meta             jsonb
)
LANGUAGE sql
SECURITY DEFINER  -- runs as postgres, bypasses RLS and column-level grants
STABLE
AS $$
  SELECT
    id, platform_id, handle,
    access_token, refresh_token, token_expires_at,
    scopes, meta
  FROM social_connections
  WHERE profile_id = p_profile_id
    AND platform   = p_platform
    AND connected  = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION get_platform_connection(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_platform_connection(uuid, text) FROM anon;


-- ============================================================================
-- AUTH TRIGGER — auto-create profile row on sign-up
-- ============================================================================
-- Fires after Supabase Auth creates a new user.
-- Guarantees profiles always has a row so upserts never fail with FK errors.

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- SYNC LOG TRIGGER — auto-log connection syncs
-- ============================================================================

CREATE OR REPLACE FUNCTION log_connection_sync()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.last_synced_at IS DISTINCT FROM OLD.last_synced_at THEN
    INSERT INTO social_sync_log (profile_id, platform, sync_type, status, items_synced)
    VALUES (NEW.profile_id, NEW.platform, 'pull', 'ok', 0);
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER social_connection_sync_log
    AFTER UPDATE ON social_connections
    FOR EACH ROW EXECUTE FUNCTION log_connection_sync();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- REALTIME — enable live updates for all tables
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='tickets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='customers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='inventory') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='house_calls') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE house_calls;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_interactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_interactions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_connections') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_connections;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
  END IF;
END $$;


-- ============================================================================
-- DONE
-- ============================================================================
--
-- After running this SQL:
--
-- 1. SET YOUR .env (or Supabase → Settings → Environment Variables):
--      NUXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
--      NUXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
--      SUPABASE_SERVICE_ROLE_KEY    = eyJ...  (server-only, never expose to browser)
--
-- 2. SETTINGS PAGE not showing?
--    The settings page uses `middleware: ['auth']`.
--    Make sure you are LOGGED IN. The nav menu Settings link should work.
--    If you just registered, the handle_new_user trigger will have created
--    your profiles row automatically.
--
-- 3. THINGS THAT "HALF WORK" without this SQL:
--    - Saving business settings (profiles table missing display_slides/display_config)
--    - Brand Manager tab (brand_settings, social_* tables missing)
--    - Customer display / TV slides (display_slides column missing from profiles)
--    - Realtime updates on tickets/customers (not in publication)
--
-- 4. For Brand Manager social OAuth (Facebook, Google, etc.):
--    Add these env vars and register redirect URIs in each platform's dev console:
--      FB_APP_ID, FB_APP_SECRET
--      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
--      IG_APP_ID, IG_APP_SECRET
--      YELP_CLIENT_ID, YELP_CLIENT_SECRET
--      BRAND_OAUTH_REDIRECT_BASE = https://yourapp.com  (or http://localhost:3000 for dev)
--
-- ============================================================================
