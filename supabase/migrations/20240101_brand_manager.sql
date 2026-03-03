-- ============================================================
-- Brand Manager Migration
-- Tables: brand_settings, social_connections, social_interactions,
--         social_posts, auto_response_rules
-- All rows scoped to profile_id (the auth user's UUID).
-- ============================================================

-- ── brand_settings ───────────────────────────────────────────────
-- One row per user. Stores portal/booking config and brand prefs.
CREATE TABLE IF NOT EXISTS brand_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_enabled  boolean NOT NULL DEFAULT false,
  portal_slug     text NOT NULL DEFAULT '',
  welcome_message text NOT NULL DEFAULT '',
  booking_enabled boolean NOT NULL DEFAULT false,
  booking_open    text NOT NULL DEFAULT '09:00',
  booking_close   text NOT NULL DEFAULT '17:00',
  slot_duration   integer NOT NULL DEFAULT 30,
  auto_response_enabled boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);

ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_settings_owner" ON brand_settings
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── social_connections ───────────────────────────────────────────
-- One row per platform per user. Stores OAuth tokens and metadata.
-- access_token / refresh_token are stored here — in production
-- these should be encrypted at rest (Supabase Vault or pgcrypto).
CREATE TABLE IF NOT EXISTS social_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text NOT NULL,            -- 'facebook' | 'google' | 'instagram' | 'yelp'
  platform_id     text,                     -- external account/page ID
  handle          text,                     -- display name / handle
  access_token    text,                     -- OAuth access token (treat as secret)
  refresh_token   text,                     -- OAuth refresh token
  token_expires_at timestamptz,
  scopes          text[],                   -- granted OAuth scopes
  connected       boolean NOT NULL DEFAULT true,
  meta            jsonb NOT NULL DEFAULT '{}', -- followers, rating, etc. cached snapshot
  last_synced_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_connections_owner" ON social_connections
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── social_interactions ──────────────────────────────────────────
-- Reviews, comments, messages pulled from connected platforms.
-- Also supports manually-logged interactions.
CREATE TABLE IF NOT EXISTS social_interactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text NOT NULL,            -- 'google' | 'facebook' | 'instagram' | 'yelp'
  platform_ref_id text,                     -- external review/comment ID (for deduplication)
  author_name     text NOT NULL DEFAULT '',
  author_id       text,                     -- external author ID
  type            text NOT NULL DEFAULT 'Review', -- 'Review' | 'Comment' | 'Message'
  content         text NOT NULL DEFAULT '',
  rating          integer CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  sentiment       text NOT NULL DEFAULT 'neutral', -- 'positive' | 'neutral' | 'negative'
  likes           integer,
  url             text,
  unread          boolean NOT NULL DEFAULT true,
  starred         boolean NOT NULL DEFAULT false,
  archived        boolean NOT NULL DEFAULT false,
  our_reply       text,
  reply_posted_at timestamptz,
  reply_posted_to text,                     -- platform reply was actually sent to
  interaction_at  timestamptz NOT NULL DEFAULT now(), -- when the original interaction happened
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_interactions_profile_id_idx ON social_interactions (profile_id);
CREATE INDEX IF NOT EXISTS social_interactions_platform_idx   ON social_interactions (profile_id, platform);
CREATE INDEX IF NOT EXISTS social_interactions_unread_idx     ON social_interactions (profile_id, unread) WHERE unread = true;
CREATE INDEX IF NOT EXISTS social_interactions_platform_ref_idx ON social_interactions (platform, platform_ref_id) WHERE platform_ref_id IS NOT NULL;

ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_interactions_owner" ON social_interactions
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── social_posts ─────────────────────────────────────────────────
-- Posts authored in Brand Manager — published or scheduled.
CREATE TABLE IF NOT EXISTS social_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         text NOT NULL DEFAULT '',
  targets         text[] NOT NULL DEFAULT '{}',  -- platform IDs
  media_urls      text[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for   timestamptz,
  published_at    timestamptz,
  platform_post_ids jsonb NOT NULL DEFAULT '{}', -- { facebook: 'xxx', google: 'yyy' }
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_posts_profile_id_idx    ON social_posts (profile_id);
CREATE INDEX IF NOT EXISTS social_posts_scheduled_idx     ON social_posts (profile_id, scheduled_for) WHERE status = 'scheduled';

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_posts_owner" ON social_posts
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── auto_response_rules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_response_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type    text NOT NULL,   -- 'rating_gte' | 'rating_lte' | 'keyword'
  trigger_value   text NOT NULL,   -- '5' | '2' | 'price'
  response_text   text NOT NULL DEFAULT '',
  enabled         boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE auto_response_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_response_rules_owner" ON auto_response_rules
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── updated_at triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER brand_settings_updated_at    BEFORE UPDATE ON brand_settings         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER social_connections_updated_at BEFORE UPDATE ON social_connections     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER social_interactions_updated_at BEFORE UPDATE ON social_interactions   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER social_posts_updated_at       BEFORE UPDATE ON social_posts           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER auto_response_rules_updated_at BEFORE UPDATE ON auto_response_rules  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── seed default auto-response rules for new users ───────────────
-- Called from application code after first sign-up, not here,
-- because we need the user's profile_id. See useBrandManager.ts.
