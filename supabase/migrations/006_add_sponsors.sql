-- Migration: 006_add_sponsors
-- Created: 2025
-- Description: Add sponsors table with many-to-many relationships to events and optional categories

-- =============================================
-- SPONSORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sponsors_sort_order ON sponsors(sort_order);
CREATE INDEX IF NOT EXISTS idx_sponsors_is_visible ON sponsors(is_visible);

-- Enable RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Allow public read access to visible sponsors
CREATE POLICY "Allow public read access to visible sponsors"
  ON sponsors
  FOR SELECT
  USING (is_visible = true);

-- Allow authenticated users to manage sponsors
CREATE POLICY "Allow authenticated users to insert sponsors"
  ON sponsors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sponsors"
  ON sponsors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sponsors"
  ON sponsors
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- SPONSOR_EVENTS (Many-to-Many) - REQUIRED
-- =============================================

CREATE TABLE IF NOT EXISTS sponsor_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event_details(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, event_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sponsor_events_sponsor_id ON sponsor_events(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_events_event_id ON sponsor_events(event_id);

-- Enable RLS
ALTER TABLE sponsor_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sponsor_events
CREATE POLICY "Allow public read access to sponsor_events"
  ON sponsor_events
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage sponsor_events
CREATE POLICY "Allow authenticated users to insert sponsor_events"
  ON sponsor_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sponsor_events"
  ON sponsor_events
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- SPONSOR_CATEGORIES (Many-to-Many) - OPTIONAL
-- =============================================

CREATE TABLE IF NOT EXISTS sponsor_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, category_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sponsor_categories_sponsor_id ON sponsor_categories(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_categories_category_id ON sponsor_categories(category_id);

-- Enable RLS
ALTER TABLE sponsor_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sponsor_categories
CREATE POLICY "Allow public read access to sponsor_categories"
  ON sponsor_categories
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage sponsor_categories
CREATE POLICY "Allow authenticated users to insert sponsor_categories"
  ON sponsor_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sponsor_categories"
  ON sponsor_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE sponsors IS 'Sponsors for events and categories';
COMMENT ON TABLE sponsor_events IS 'Many-to-many relationship between sponsors and events (required)';
COMMENT ON TABLE sponsor_categories IS 'Many-to-many relationship between sponsors and categories (optional)';
COMMENT ON COLUMN sponsors.logo_url IS 'URL to sponsor logo image';
COMMENT ON COLUMN sponsors.website_url IS 'Sponsor website URL';
COMMENT ON COLUMN sponsors.sort_order IS 'Display order of sponsors';
