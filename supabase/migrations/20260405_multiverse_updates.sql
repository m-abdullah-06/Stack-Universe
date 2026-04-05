-- Stack Universe - Multiverse & Discovery Updates

-- Activity Log table (feeds the live ticker)
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    TEXT NOT NULL,
  action      TEXT NOT NULL, -- 'explored', 'claimed', 'discovered'
  target      TEXT,          -- targeted username if any
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Realtime for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read activity logs" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Service can write activity logs" ON activity_log FOR ALL USING (true);

-- Universe Snapshots table (for Time Travel feature)
CREATE TABLE IF NOT EXISTS universe_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  universe_id     UUID REFERENCES universes(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  snapshot_data   JSONB NOT NULL,
  snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_username ON universe_snapshots(username);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON universe_snapshots(snapshot_date DESC);

-- Enable Realtime for snapshots
ALTER TABLE universe_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read snapshots" ON universe_snapshots FOR SELECT USING (true);
CREATE POLICY "Service can write snapshots" ON universe_snapshots FOR ALL USING (true);


-- Update universes table with constellation metadata
ALTER TABLE universes ADD COLUMN IF NOT EXISTS top_languages JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_universes_languages ON universes USING gin(top_languages);

-- Update Realtime settings (Run manually in SQL Editor if publication doesn't exist)
-- ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
-- ALTER PUBLICATION supabase_realtime ADD TABLE universes;
