-- Migration: 021_add_contact_junction_tables
-- Created: 2025
-- Description: Add junction tables for contact relationships (many-to-many)
--              and update contacts constraint to be more flexible

-- =============================================
-- STEP 1: CREATE JUNCTION TABLES FOR MANY-TO-MANY RELATIONSHIPS
-- =============================================

-- Junction table for contacts linked to finalists (many-to-many)
CREATE TABLE IF NOT EXISTS contact_finalists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  finalist_id UUID NOT NULL REFERENCES finalists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, finalist_id)
);

-- Junction table for contacts linked to judges (many-to-many)
CREATE TABLE IF NOT EXISTS contact_judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, judge_id)
);

-- Junction table for contacts linked to sponsors (many-to-many)
CREATE TABLE IF NOT EXISTS contact_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, sponsor_id)
);

-- =============================================
-- STEP 2: ADD INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contact_finalists_contact_id ON contact_finalists(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_finalists_finalist_id ON contact_finalists(finalist_id);

CREATE INDEX IF NOT EXISTS idx_contact_judges_contact_id ON contact_judges(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_judges_judge_id ON contact_judges(judge_id);

CREATE INDEX IF NOT EXISTS idx_contact_sponsors_contact_id ON contact_sponsors(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_sponsors_sponsor_id ON contact_sponsors(sponsor_id);

-- =============================================
-- STEP 3: ENABLE RLS
-- =============================================

ALTER TABLE contact_finalists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sponsors ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: RLS POLICIES FOR contact_finalists
-- =============================================

CREATE POLICY "Allow authenticated users to read contact_finalists"
  ON contact_finalists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert contact_finalists"
  ON contact_finalists FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contact_finalists"
  ON contact_finalists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contact_finalists"
  ON contact_finalists FOR DELETE TO authenticated USING (true);

-- =============================================
-- STEP 5: RLS POLICIES FOR contact_judges
-- =============================================

CREATE POLICY "Allow authenticated users to read contact_judges"
  ON contact_judges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert contact_judges"
  ON contact_judges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contact_judges"
  ON contact_judges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contact_judges"
  ON contact_judges FOR DELETE TO authenticated USING (true);

-- =============================================
-- STEP 6: RLS POLICIES FOR contact_sponsors
-- =============================================

CREATE POLICY "Allow authenticated users to read contact_sponsors"
  ON contact_sponsors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert contact_sponsors"
  ON contact_sponsors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contact_sponsors"
  ON contact_sponsors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contact_sponsors"
  ON contact_sponsors FOR DELETE TO authenticated USING (true);

-- =============================================
-- STEP 7: DROP OLD CONSTRAINT AND MAKE contact_type FLEXIBLE
-- =============================================

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_contact_type_constraints;

ALTER TABLE contacts ADD CONSTRAINT check_valid_contact_type 
  CHECK (contact_type IN ('judge', 'finalist', 'sponsor', 'attendee', 'general'));

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE contact_finalists IS 'Junction table linking contacts to finalists (many-to-many)';
COMMENT ON TABLE contact_judges IS 'Junction table linking contacts to judges (many-to-many)';
COMMENT ON TABLE contact_sponsors IS 'Junction table linking contacts to sponsors (many-to-many)';

COMMENT ON CONSTRAINT check_valid_contact_type ON contacts IS 'Validates contact_type. Use junction tables for relationships.';

