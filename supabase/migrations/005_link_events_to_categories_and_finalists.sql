-- Migration: 005_link_events_to_categories_and_finalists
-- Created: 2025
-- Description: Replace year field with event relationships for finalists and categories

-- =============================================
-- UPDATE FINALISTS TABLE
-- =============================================

-- Add event_id column to finalists
ALTER TABLE finalists
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES event_details(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_finalists_event_id ON finalists(event_id);

-- Migrate existing data: link finalists to events based on year
UPDATE finalists
SET event_id = (
  SELECT id FROM event_details
  WHERE event_details.event_year = finalists.year
  LIMIT 1
)
WHERE year IS NOT NULL;

-- Drop the old year column (after data migration)
ALTER TABLE finalists DROP COLUMN IF EXISTS year;

-- Drop the old year index
DROP INDEX IF EXISTS idx_finalists_year;

-- =============================================
-- CATEGORY_EVENTS (Many-to-Many)
-- =============================================

-- Create junction table for categories and events
CREATE TABLE IF NOT EXISTS category_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event_details(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, event_id) -- Prevent duplicate links
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_category_events_category_id ON category_events(category_id);
CREATE INDEX IF NOT EXISTS idx_category_events_event_id ON category_events(event_id);

-- Enable RLS
ALTER TABLE category_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to category_events
CREATE POLICY "Allow public read access to category_events"
  ON category_events
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage category_events
CREATE POLICY "Allow authenticated users to insert category_events"
  ON category_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete category_events"
  ON category_events
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- MIGRATE EXISTING CATEGORIES TO ACTIVE EVENT
-- =============================================

-- Link all existing categories to the active event (if one exists)
INSERT INTO category_events (category_id, event_id)
SELECT c.id, e.id
FROM categories c
CROSS JOIN event_details e
WHERE e.is_active = true
ON CONFLICT (category_id, event_id) DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE category_events IS 'Many-to-many relationship between categories and events';
COMMENT ON COLUMN finalists.event_id IS 'The event this finalist participated in';
COMMENT ON COLUMN category_events.category_id IS 'The category ID';
COMMENT ON COLUMN category_events.event_id IS 'The event ID this category is associated with';
