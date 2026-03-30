-- Table for caching repo summaries
CREATE TABLE IF NOT EXISTS repo_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  reponame TEXT NOT NULL,
  summary TEXT NOT NULL,
  last_pushed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, reponame)
);

-- Enable RLS
ALTER TABLE repo_summaries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repo_summaries' AND policyname = 'Allow public read on repo_summaries'
    ) THEN
        CREATE POLICY "Allow public read on repo_summaries" ON repo_summaries FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repo_summaries' AND policyname = 'Allow service role write'
    ) THEN
        CREATE POLICY "Allow service role write" ON repo_summaries FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repo_summaries_user_repo ON repo_summaries(username, reponame);
