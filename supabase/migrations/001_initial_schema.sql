-- Initial Database Schema for XR Awards Admin
-- Migration: 001_initial_schema
-- Created: 2024

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_visible BOOLEAN DEFAULT true, -- Hide categories without deleting them
  sort_order INTEGER DEFAULT 0, -- Control display order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(is_visible);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- =============================================
-- FINALISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS finalists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  organization TEXT, -- Company/organization name
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image_url TEXT,
  website_url TEXT, -- Project/company website
  is_winner BOOLEAN DEFAULT false,
  year INTEGER,
  placement INTEGER, -- 1st place, 2nd place, etc. (null for regular finalists)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_finalists_category_id ON finalists(category_id);
CREATE INDEX IF NOT EXISTS idx_finalists_year ON finalists(year);
CREATE INDEX IF NOT EXISTS idx_finalists_is_winner ON finalists(is_winner);
CREATE INDEX IF NOT EXISTS idx_finalists_organization ON finalists(organization);
CREATE INDEX IF NOT EXISTS idx_finalists_created_at ON finalists(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on both tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finalists ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR CATEGORIES
-- =============================================

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
  ON categories
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert categories
CREATE POLICY "Allow authenticated users to insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update categories
CREATE POLICY "Allow authenticated users to update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete categories
CREATE POLICY "Allow authenticated users to delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR FINALISTS
-- =============================================

-- Allow public read access to finalists
CREATE POLICY "Allow public read access to finalists"
  ON finalists
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert finalists
CREATE POLICY "Allow authenticated users to insert finalists"
  ON finalists
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update finalists
CREATE POLICY "Allow authenticated users to update finalists"
  ON finalists
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete finalists
CREATE POLICY "Allow authenticated users to delete finalists"
  ON finalists
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for finalists
CREATE TRIGGER update_finalists_updated_at
  BEFORE UPDATE ON finalists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA (Optional)
-- =============================================

-- Insert some default categories with sort order
INSERT INTO categories (name, description, is_visible, sort_order) VALUES
  ('Best VR Experience', 'Outstanding virtual reality experiences', true, 1),
  ('Best AR Application', 'Innovative augmented reality applications', true, 2),
  ('Best MR Solution', 'Mixed reality solutions pushing boundaries', true, 3),
  ('Innovation Award', 'Most innovative use of XR technology', true, 4),
  ('Enterprise Solution', 'Best XR solution for enterprise', true, 5),
  ('Educational Experience', 'Best use of XR in education', true, 6),
  ('Healthcare Innovation', 'XR innovation in healthcare', true, 7),
  ('Gaming Experience', 'Outstanding XR gaming experience', true, 8)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE categories IS 'Award categories for the XR Awards';
COMMENT ON TABLE finalists IS 'Finalists and winners for each category';
COMMENT ON COLUMN categories.is_visible IS 'Whether to show category publicly (false = archived but still linked to old finalists)';
COMMENT ON COLUMN categories.sort_order IS 'Display order on public pages (lower numbers first)';
COMMENT ON COLUMN finalists.organization IS 'Company or organization that created the project';
COMMENT ON COLUMN finalists.is_winner IS 'Whether this finalist is the winner';
COMMENT ON COLUMN finalists.year IS 'Award year (e.g., 2024, 2025)';
COMMENT ON COLUMN finalists.placement IS '1 for 1st place, 2 for 2nd place, etc. Null for regular finalists';
COMMENT ON COLUMN finalists.website_url IS 'Project or company website URL';

