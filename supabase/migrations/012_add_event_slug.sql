-- Migration: 012_add_event_slug
-- Created: 2025
-- Description: Add slug field to event_details for custom URL paths

-- =============================================
-- ADD SLUG COLUMN
-- =============================================

ALTER TABLE event_details ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for slug (must be unique across all events)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_details_slug ON event_details(slug);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN event_details.slug IS 'URL-friendly slug for the event page (e.g., xr-awards-2024)';

