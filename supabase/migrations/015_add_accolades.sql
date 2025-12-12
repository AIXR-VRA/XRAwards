-- Migration: 015_add_accolades
-- Created: 2025
-- Description: Add accolades system with hierarchical structure

-- =============================================
-- ACCOLADES TABLE (Self-referencing hierarchy)
-- =============================================
-- The main award category (e.g., "A - XR Healthcare Solution of the Year") exists in the categories table.
-- This table stores the accolade hierarchy linked to categories via category_accolades:
-- Level 1 (parent_id = null): Accolade Types (e.g., "A-A. Patient Care and Treatment")
-- Level 2 (has parent): Individual Accolades (e.g., "A-A01 Surgical Planning and Assistance")

CREATE TABLE IF NOT EXISTS accolades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES accolades(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- e.g., "A", "A-A", "A-A01"
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_accolades_parent_id ON accolades(parent_id);
CREATE INDEX IF NOT EXISTS idx_accolades_code ON accolades(code);
CREATE INDEX IF NOT EXISTS idx_accolades_sort_order ON accolades(sort_order);
CREATE INDEX IF NOT EXISTS idx_accolades_is_active ON accolades(is_active);

-- Unique constraint on code
CREATE UNIQUE INDEX IF NOT EXISTS idx_accolades_code_unique ON accolades(code);

-- =============================================
-- CATEGORY_ACCOLADES (Many-to-Many)
-- Links categories to available accolade types (level 2)
-- =============================================

CREATE TABLE IF NOT EXISTS category_accolades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  accolade_id UUID NOT NULL REFERENCES accolades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, accolade_id)
);

CREATE INDEX IF NOT EXISTS idx_category_accolades_category_id ON category_accolades(category_id);
CREATE INDEX IF NOT EXISTS idx_category_accolades_accolade_id ON category_accolades(accolade_id);

-- =============================================
-- FINALIST_ACCOLADES (Many-to-Many)
-- Links finalists to their awarded accolades (level 3)
-- =============================================

CREATE TABLE IF NOT EXISTS finalist_accolades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finalist_id UUID NOT NULL REFERENCES finalists(id) ON DELETE CASCADE,
  accolade_id UUID NOT NULL REFERENCES accolades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(finalist_id, accolade_id)
);

CREATE INDEX IF NOT EXISTS idx_finalist_accolades_finalist_id ON finalist_accolades(finalist_id);
CREATE INDEX IF NOT EXISTS idx_finalist_accolades_accolade_id ON finalist_accolades(accolade_id);

-- =============================================
-- DROP PLACEMENT COLUMN FROM FINALISTS
-- =============================================

ALTER TABLE finalists DROP COLUMN IF EXISTS placement;
DROP INDEX IF EXISTS idx_finalists_placement;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE accolades ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_accolades ENABLE ROW LEVEL SECURITY;
ALTER TABLE finalist_accolades ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR ACCOLADES
-- =============================================

-- Allow public read access
CREATE POLICY "Allow public read access to accolades"
  ON accolades
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage accolades
CREATE POLICY "Allow authenticated users to insert accolades"
  ON accolades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update accolades"
  ON accolades
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete accolades"
  ON accolades
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR CATEGORY_ACCOLADES
-- =============================================

CREATE POLICY "Allow public read access to category_accolades"
  ON category_accolades
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert category_accolades"
  ON category_accolades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update category_accolades"
  ON category_accolades
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete category_accolades"
  ON category_accolades
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR FINALIST_ACCOLADES
-- =============================================

CREATE POLICY "Allow public read access to finalist_accolades"
  ON finalist_accolades
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert finalist_accolades"
  ON finalist_accolades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update finalist_accolades"
  ON finalist_accolades
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete finalist_accolades"
  ON finalist_accolades
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE accolades IS 'Hierarchical accolades: Level 1 (parent_id=null) = Accolade Type, Level 2 = Individual Accolade. Main award categories are in the categories table.';
COMMENT ON COLUMN accolades.parent_id IS 'NULL for accolade types (level 1), references parent type for individual accolades (level 2)';
COMMENT ON COLUMN accolades.code IS 'Unique code like A, A-A, A-A01 that identifies the accolade in hierarchy';
COMMENT ON TABLE category_accolades IS 'Links award categories to accolade types (level 1 only, e.g., A-A). Individual accolades (A-A01) are NOT linked here.';
COMMENT ON TABLE finalist_accolades IS 'Links finalists to their awarded accolades (level 2 individual accolades)';

