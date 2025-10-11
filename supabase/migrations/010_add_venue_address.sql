-- Migration: 010_add_venue_address
-- Created: 2025
-- Description: Add venue_address column to event_details table

-- =============================================
-- ADD VENUE_ADDRESS COLUMN
-- =============================================

-- Add venue_address column to event_details table
ALTER TABLE event_details 
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN event_details.venue_address IS 'Full venue address including street, postal code, city, and country';

