-- Migration: 023_remove_contact_type_column
-- Description: Remove legacy contact_type column and direct FK columns
--              Since we now use junction tables (contact_judges, contact_finalists, contact_sponsors)
--              the contact_type field is redundant - types are derived from junction relationships

-- =============================================
-- STEP 1: DROP CONSTRAINTS
-- =============================================

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_valid_contact_type;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_contact_type_constraints;

-- =============================================
-- STEP 2: DROP INDEXES ON COLUMNS TO BE REMOVED
-- =============================================

DROP INDEX IF EXISTS idx_contacts_contact_type;
DROP INDEX IF EXISTS idx_contacts_judge_id;
DROP INDEX IF EXISTS idx_contacts_finalist_id;
DROP INDEX IF EXISTS idx_contacts_sponsor_id;

-- =============================================
-- STEP 3: DROP THE LEGACY COLUMNS
-- =============================================

-- Remove contact_type column (types are now derived from junction tables)
ALTER TABLE contacts DROP COLUMN IF EXISTS contact_type;

-- Remove direct FK columns (relationships are now in junction tables)
ALTER TABLE contacts DROP COLUMN IF EXISTS judge_id;
ALTER TABLE contacts DROP COLUMN IF EXISTS finalist_id;
ALTER TABLE contacts DROP COLUMN IF EXISTS sponsor_id;
ALTER TABLE contacts DROP COLUMN IF EXISTS attendee_id;

-- =============================================
-- STEP 4: UPDATE UNIQUE CONSTRAINT
-- =============================================

-- Remove old unique constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS unique_contact_email;

-- Add simpler unique constraint - email should be unique per contact
-- (junction tables handle which entities they're associated with)
ALTER TABLE contacts ADD CONSTRAINT unique_contact_email UNIQUE(email);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE contacts IS 'Contact records for communications. Types are derived from junction tables: contact_judges, contact_finalists, contact_sponsors';

