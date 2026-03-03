-- ── vendor_repairs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_repairs (
  id              bigserial PRIMARY KEY,
  profile_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id     bigint REFERENCES customers(id) ON DELETE SET NULL,
  device          text NOT NULL DEFAULT '',
  issue           text NOT NULL DEFAULT '',
  vendor          text NOT NULL DEFAULT '',
  ticket_ref      text NOT NULL DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'Preparing to Ship',
  sent_date       date,
  est_return      date,
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_repairs_profile_id_idx ON vendor_repairs (profile_id);

ALTER TABLE vendor_repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendor_repairs_owner" ON vendor_repairs
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE TRIGGER vendor_repairs_updated_at  BEFORE UPDATE ON vendor_repairs  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname='supabase_realtime' AND tablename='vendor_repairs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE vendor_repairs;
  END IF;
END $$;
