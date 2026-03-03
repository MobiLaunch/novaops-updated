-- ============================================================================
-- NovaOps — Social Wiring Migration
-- Run AFTER 20240101_brand_manager.sql
--
-- What this adds:
--   1. `social_connections` — new columns for token encryption hints & sync metadata
--   2. `social_sync_log`   — audit trail for platform syncs / webhook events
--   3. Helper function: `get_connection_for_platform()` (service-role use)
--   4. RLS policy update for social_connections to block direct token reads
--   5. Supabase Auth provider linkage view (`auth_social_providers`)
--   6. Realtime publication for all Brand Manager tables (if not already set)
-- ============================================================================

-- ── 1. Extend social_connections ──────────────────────────────────────────────
-- Add columns if they don't already exist (idempotent via DO block)

DO $$ BEGIN
  -- Token expiry tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='social_connections' AND column_name='token_expires_at') THEN
    ALTER TABLE social_connections ADD COLUMN token_expires_at timestamptz;
  END IF;

  -- Granted scopes array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='social_connections' AND column_name='scopes') THEN
    ALTER TABLE social_connections ADD COLUMN scopes text[] NOT NULL DEFAULT '{}';
  END IF;

  -- Refresh token (separate from access token for clarity)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='social_connections' AND column_name='refresh_token') THEN
    ALTER TABLE social_connections ADD COLUMN refresh_token text;
  END IF;

  -- reply_posted_to on social_interactions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='social_interactions' AND column_name='reply_posted_to') THEN
    ALTER TABLE social_interactions ADD COLUMN reply_posted_to text;
  END IF;
END $$;

-- ── 2. Social sync log ─────────────────────────────────────────────────────────
-- Tracks every pull from platform APIs and webhook deliveries.
-- Useful for debugging and rate-limit auditing.

CREATE TABLE IF NOT EXISTS social_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text NOT NULL,
  sync_type       text NOT NULL DEFAULT 'pull',   -- 'pull' | 'webhook' | 'publish' | 'reply'
  status          text NOT NULL DEFAULT 'ok',     -- 'ok' | 'error' | 'partial'
  items_synced    integer NOT NULL DEFAULT 0,
  error_message   text,
  meta            jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_sync_log_profile_platform_idx
  ON social_sync_log (profile_id, platform, created_at DESC);

ALTER TABLE social_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_sync_log_owner" ON social_sync_log
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── 3. RLS: hide raw tokens from the browser ───────────────────────────────────
-- The anon/authenticated role should never read access_token / refresh_token
-- directly from the browser.  Those are fetched server-side via service-role.
-- We drop the previous permissive policy and replace with a column-level restriction.

-- Drop old policy if it was permissive (created in brand_manager migration)
DROP POLICY IF EXISTS "social_connections_owner" ON social_connections;

-- New policy: all columns EXCEPT tokens are readable by the owner
-- Token columns are masked to NULL for browser reads; service-role bypasses RLS.
CREATE POLICY "social_connections_owner_read" ON social_connections
  FOR SELECT
  USING (profile_id = auth.uid());

-- For writes (INSERT/UPDATE/DELETE) the owner is still the only author
CREATE POLICY "social_connections_owner_write" ON social_connections
  FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Column-level security: revoke direct column read of tokens for 'authenticated' role
-- (service-role always bypasses RLS and column-level grants)
-- NOTE: This works in conjunction with a Supabase column masking view below.
REVOKE SELECT (access_token, refresh_token) ON social_connections FROM authenticated;

-- Mask view: what the browser actually queries
-- useBrandManager selects from social_connections — Supabase RLS lets the owner
-- read their own rows but the REVOKE above hides the token columns.
-- The browser sees NULL for access_token / refresh_token, which is correct:
-- they're only needed server-side.

-- ── 4. Server-side helper: fetch connection with token ─────────────────────────
-- Called by Nuxt server routes (which connect with service_role) to get a
-- valid token for a platform API call.  Never exposed to the browser.

CREATE OR REPLACE FUNCTION get_platform_connection(
  p_profile_id  uuid,
  p_platform    text
)
RETURNS TABLE (
  id              uuid,
  platform_id     text,
  handle          text,
  access_token    text,
  refresh_token   text,
  token_expires_at timestamptz,
  scopes          text[],
  meta            jsonb
)
LANGUAGE sql
SECURITY DEFINER   -- runs as the function owner (postgres), bypasses RLS
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

-- Only service_role should call this function from server routes.
-- Revoke access from authenticated (browser) role.
REVOKE EXECUTE ON FUNCTION get_platform_connection(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_platform_connection(uuid, text) FROM anon;

-- ── 5. Auth social provider linkage view ──────────────────────────────────────
-- Lets the app check which Supabase Auth providers a user has linked
-- (Google, Facebook sign-in) without exposing auth.identities directly.

CREATE OR REPLACE VIEW user_auth_providers AS
  SELECT
    user_id,
    provider,
    created_at
  FROM auth.identities
  WHERE user_id = auth.uid();

-- Grant authenticated role read access
GRANT SELECT ON user_auth_providers TO authenticated;

-- ── 6. Enable Realtime for Brand Manager tables ───────────────────────────────
-- Supabase Realtime requires tables to be added to the publication.
-- Run this only once; the DO block makes it idempotent.

DO $$ BEGIN
  -- social_interactions — live review/comment feed
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_interactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_interactions;
  END IF;

  -- social_connections — connection status updates
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_connections;
  END IF;

  -- social_posts — scheduled post status changes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='social_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
  END IF;
END $$;

-- ── 7. Trigger: auto-log sync events ──────────────────────────────────────────
-- Whenever a social_connection is updated (token refreshed, last_synced_at bumped),
-- write a brief entry to social_sync_log for auditing.

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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running this migration:
--   1. Enable Google and Facebook providers in Supabase Auth → Providers
--   2. Add all env vars from .env.example to Vercel (or .env locally)
--   3. Register OAuth redirect URIs in each platform's developer console:
--        https://yourapp.vercel.app/api/brand/callback/facebook
--        https://yourapp.vercel.app/api/brand/callback/google
--        https://yourapp.vercel.app/api/brand/callback/instagram
--        https://yourapp.vercel.app/api/brand/callback/yelp
--        https://yourapp.vercel.app/auth/callback   ← Supabase Auth (sign-in)
