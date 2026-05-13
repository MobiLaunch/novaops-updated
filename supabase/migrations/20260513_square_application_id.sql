-- Web Payments SDK needs Application ID on the client (separate from access token).
ALTER TABLE square_config
  ADD COLUMN IF NOT EXISTS application_id text NOT NULL DEFAULT '';
