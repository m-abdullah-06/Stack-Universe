-- Table for caching weekly horoscopes
CREATE TABLE IF NOT EXISTS horoscopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  horoscope TEXT NOT NULL,
  week_offset INTEGER NOT NULL, -- e.g., 202613 for year 2026, week 13
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, week_offset)
);

-- Enable RLS
ALTER TABLE horoscopes ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'horoscopes' AND policyname = 'Allow public read on horoscopes'
    ) THEN
        CREATE POLICY "Allow public read on horoscopes" ON horoscopes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'horoscopes' AND policyname = 'Allow service role write horoscope'
    ) THEN
        CREATE POLICY "Allow service role write horoscope" ON horoscopes FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_horoscopes_user_week ON horoscopes(username, week_offset);
