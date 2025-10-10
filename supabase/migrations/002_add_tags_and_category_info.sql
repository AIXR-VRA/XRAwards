-- Migration: 002_add_tags_and_category_info
-- Created: 2024
-- Description: Add tags system for finalists and categories, plus additional category info

-- =============================================
-- TAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly version
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- =============================================
-- CATEGORY_TAGS (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS category_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, tag_id) -- Prevent duplicate tags on same category
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_category_tags_category_id ON category_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_category_tags_tag_id ON category_tags(tag_id);

-- =============================================
-- FINALIST_TAGS (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS finalist_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finalist_id UUID NOT NULL REFERENCES finalists(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(finalist_id, tag_id) -- Prevent duplicate tags on same finalist
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_finalist_tags_finalist_id ON finalist_tags(finalist_id);
CREATE INDEX IF NOT EXISTS idx_finalist_tags_tag_id ON finalist_tags(tag_id);

-- =============================================
-- ADD ADDITIONAL INFO TO CATEGORIES
-- =============================================
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE finalist_tags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR TAGS
-- =============================================

-- Allow public read access to tags
CREATE POLICY "Allow public read access to tags"
  ON tags
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert tags
CREATE POLICY "Allow authenticated users to insert tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tags
CREATE POLICY "Allow authenticated users to update tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete tags
CREATE POLICY "Allow authenticated users to delete tags"
  ON tags
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR CATEGORY_TAGS
-- =============================================

-- Allow public read access to category_tags
CREATE POLICY "Allow public read access to category_tags"
  ON category_tags
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage category_tags
CREATE POLICY "Allow authenticated users to insert category_tags"
  ON category_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete category_tags"
  ON category_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR FINALIST_TAGS
-- =============================================

-- Allow public read access to finalist_tags
CREATE POLICY "Allow public read access to finalist_tags"
  ON finalist_tags
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage finalist_tags
CREATE POLICY "Allow authenticated users to insert finalist_tags"
  ON finalist_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete finalist_tags"
  ON finalist_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for tags
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to generate slug from tag name
CREATE OR REPLACE FUNCTION generate_tag_slug(tag_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(tag_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically generate slug when inserting a tag
CREATE OR REPLACE FUNCTION auto_generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_tag_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE TRIGGER generate_tag_slug_trigger
  BEFORE INSERT OR UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tag_slug();

-- =============================================
-- SEED DATA (Optional)
-- =============================================

-- Insert some common tags
INSERT INTO tags (name, description) VALUES
  ('2024', 'Projects from 2024'),
  ('2025', 'Projects from 2025'),
  ('VR', 'Virtual Reality projects'),
  ('AR', 'Augmented Reality projects'),
  ('MR', 'Mixed Reality projects'),
  ('Gaming', 'Gaming and entertainment'),
  ('Enterprise', 'Enterprise and business solutions'),
  ('Education', 'Educational applications'),
  ('Healthcare', 'Healthcare and medical'),
  ('Innovation', 'Innovative technology'),
  ('Social', 'Social and communication'),
  ('Training', 'Training and simulation'),
  ('Mobile', 'Mobile XR applications'),
  ('Standalone', 'Standalone headset experiences')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE tags IS 'Reusable tags for categorizing finalists and categories';
COMMENT ON TABLE category_tags IS 'Many-to-many relationship between categories and tags';
COMMENT ON TABLE finalist_tags IS 'Many-to-many relationship between finalists and tags';
COMMENT ON COLUMN tags.slug IS 'URL-friendly version of tag name (auto-generated)';
COMMENT ON COLUMN categories.additional_info IS 'Additional information to display in forms/lists (JSON or text)';
COMMENT ON FUNCTION generate_tag_slug(TEXT) IS 'Convert tag name to URL-friendly slug';
COMMENT ON FUNCTION auto_generate_tag_slug() IS 'Automatically generate slug from tag name on insert/update';

