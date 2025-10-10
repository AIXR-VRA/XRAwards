-- Migration: 003_add_category_slugs
-- Created: 2024
-- Description: Add slug support to categories table for URL-friendly individual pages

-- =============================================
-- ADD SLUG COLUMN TO CATEGORIES
-- =============================================
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =============================================
-- HELPER FUNCTIONS FOR SLUG GENERATION
-- =============================================

-- Function to generate slug from category name
CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(category_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically generate slug when inserting a category
CREATE OR REPLACE FUNCTION auto_generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_category_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE TRIGGER generate_category_slug_trigger
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_category_slug();

-- =============================================
-- UPDATE EXISTING CATEGORIES WITH SLUGS
-- =============================================

-- Generate slugs for existing categories
UPDATE categories
SET slug = generate_category_slug(name)
WHERE slug IS NULL;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN categories.slug IS 'URL-friendly version of category name (auto-generated)';
COMMENT ON FUNCTION generate_category_slug(TEXT) IS 'Convert category name to URL-friendly slug';
COMMENT ON FUNCTION auto_generate_category_slug() IS 'Automatically generate slug from category name on insert/update';

