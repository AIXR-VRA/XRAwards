-- Migration: 004_add_event_details
-- Created: 2025
-- Description: Add event_details table for storing event information and key dates

-- =============================================
-- EVENT_DETAILS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_year INTEGER NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  organizer_name TEXT,

  -- Key Dates
  nominations_open DATE,
  nominations_close DATE,
  finalists_announced DATE,
  judging_period_start DATE,
  judging_period_end DATE,
  awards_ceremony DATE,

  -- Portal Links
  nomination_portal_url TEXT,
  tickets_portal_url TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT false, -- Only one event should be active at a time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_details_year ON event_details(event_year);
CREATE INDEX IF NOT EXISTS idx_event_details_active ON event_details(is_active);

-- Create partial unique index to ensure only one active event per year
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_details_unique_active
  ON event_details(event_year)
  WHERE is_active = true;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE event_details ENABLE ROW LEVEL SECURITY;

-- Allow public read access to event_details
CREATE POLICY "Allow public read access to event_details"
  ON event_details
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert event_details
CREATE POLICY "Allow authenticated users to insert event_details"
  ON event_details
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update event_details
CREATE POLICY "Allow authenticated users to update event_details"
  ON event_details
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete event_details
CREATE POLICY "Allow authenticated users to delete event_details"
  ON event_details
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for event_details
CREATE TRIGGER update_event_details_updated_at
  BEFORE UPDATE ON event_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION TO ENSURE SINGLE ACTIVE EVENT
-- =============================================

-- Function to ensure only one event is active at a time
CREATE OR REPLACE FUNCTION ensure_single_active_event()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this event to active, deactivate all others
  IF NEW.is_active = true THEN
    UPDATE event_details
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single active event
CREATE TRIGGER ensure_single_active_event_trigger
  BEFORE INSERT OR UPDATE ON event_details
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_event();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert 2025 event details
INSERT INTO event_details (
  event_name,
  event_year,
  location,
  description,
  organizer_name,
  nominations_open,
  nominations_close,
  finalists_announced,
  judging_period_start,
  judging_period_end,
  awards_ceremony,
  nomination_portal_url,
  tickets_portal_url,
  is_active
) VALUES (
  'United XR Awards 2025',
  2025,
  'Brussels, Belgium',
  'The AIXR XR Awards sit at the heart of recognising excellence in virtual and augmented reality. Now part of United XR, we''ve joined forces with AWE and Stereopsia''s European XR Awards to expand our global reach.',
  'AIXR',
  '2025-05-13',
  '2025-09-09',
  '2025-09-23',
  '2025-09-25',
  '2025-10-09',
  '2025-12-09',
  'https://app.aixr.org/e/20a6e09d-7e86-488d-8436-1cd162d0f5df',
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE event_details IS 'Stores event information and key dates for XR Awards';
COMMENT ON COLUMN event_details.is_active IS 'Only one event should be active at a time (shown on homepage)';
COMMENT ON COLUMN event_details.nominations_open IS 'Date when nominations open';
COMMENT ON COLUMN event_details.nominations_close IS 'Date when nominations close (Late Fees Apply after this)';
COMMENT ON COLUMN event_details.finalists_announced IS 'Date when finalists are announced';
COMMENT ON COLUMN event_details.judging_period_start IS 'Start date of judging period';
COMMENT ON COLUMN event_details.judging_period_end IS 'End date of judging period';
COMMENT ON COLUMN event_details.awards_ceremony IS 'Date of the awards ceremony';
COMMENT ON COLUMN event_details.nomination_portal_url IS 'URL to the nomination submission portal';
COMMENT ON COLUMN event_details.tickets_portal_url IS 'URL to purchase tickets for the event';
