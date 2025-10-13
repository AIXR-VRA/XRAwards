-- Migration: 013_add_event_livestream_link
-- Created: 2025
-- Description: Add livestream_link field to event_details for event livestream URLs

-- =============================================
-- ADD LIVESTREAM_LINK COLUMN
-- =============================================

ALTER TABLE event_details ADD COLUMN IF NOT EXISTS livestream_link TEXT;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN event_details.livestream_link IS 'URL to the event livestream (e.g., YouTube Live, Twitch, Vimeo Live)';

