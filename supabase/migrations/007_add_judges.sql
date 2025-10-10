-- Migration: 007_add_judges
-- Created: 2025
-- Description: Add judges table with many-to-many relationships to events and tags

-- =============================================
-- JUDGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_title TEXT,
  organization TEXT,
  linkedin_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_judges_sort_order ON judges(sort_order);
CREATE INDEX IF NOT EXISTS idx_judges_is_visible ON judges(is_visible);
CREATE INDEX IF NOT EXISTS idx_judges_last_name ON judges(last_name);

-- Enable RLS
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;

-- Allow public read access to visible judges
CREATE POLICY "Allow public read access to visible judges"
  ON judges
  FOR SELECT
  USING (is_visible = true);

-- Allow authenticated users to manage judges
CREATE POLICY "Allow authenticated users to insert judges"
  ON judges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update judges"
  ON judges
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete judges"
  ON judges
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- JUDGE_EVENTS (Many-to-Many) - REQUIRED
-- =============================================

CREATE TABLE IF NOT EXISTS judge_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event_details(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(judge_id, event_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_judge_events_judge_id ON judge_events(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_events_event_id ON judge_events(event_id);

-- Enable RLS
ALTER TABLE judge_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to judge_events
CREATE POLICY "Allow public read access to judge_events"
  ON judge_events
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage judge_events
CREATE POLICY "Allow authenticated users to insert judge_events"
  ON judge_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete judge_events"
  ON judge_events
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- JUDGE_TAGS (Many-to-Many) - OPTIONAL
-- =============================================

CREATE TABLE IF NOT EXISTS judge_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(judge_id, tag_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_judge_tags_judge_id ON judge_tags(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_tags_tag_id ON judge_tags(tag_id);

-- Enable RLS
ALTER TABLE judge_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to judge_tags
CREATE POLICY "Allow public read access to judge_tags"
  ON judge_tags
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage judge_tags
CREATE POLICY "Allow authenticated users to insert judge_tags"
  ON judge_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete judge_tags"
  ON judge_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_judges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_judges_updated_at
  BEFORE UPDATE ON judges
  FOR EACH ROW
  EXECUTE FUNCTION update_judges_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE judges IS 'Judges for XR Awards events';
COMMENT ON TABLE judge_events IS 'Many-to-many relationship between judges and events (required)';
COMMENT ON TABLE judge_tags IS 'Many-to-many relationship between judges and tags (optional)';
COMMENT ON COLUMN judges.first_name IS 'Judge first name';
COMMENT ON COLUMN judges.last_name IS 'Judge last name';
COMMENT ON COLUMN judges.job_title IS 'Judge job title';
COMMENT ON COLUMN judges.organization IS 'Judge organization/company';
COMMENT ON COLUMN judges.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN judges.description IS 'Judge bio/description';
