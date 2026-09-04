-- ⚠️  DO NOT RUN — WILL ERROR against the live database (no `square_config`
-- table exists there; see 20260305_separate_settings.sql's warning). Square
-- credentials are stored in the browser via Settings in the current React
-- app, not the database. Use MASTER_SETUP.sql instead. Kept for history.

-- Web Payments SDK needs Application ID on the client (separate from access token).
ALTER TABLE square_config
  ADD COLUMN IF NOT EXISTS application_id text NOT NULL DEFAULT '';
