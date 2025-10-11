-- Migration: 011_add_event_media_content
-- Created: 2025
-- Description: Add media and content fields for event pages (hero images, videos, blurbs, etc.)

-- =============================================
-- ADD NEW COLUMNS TO EVENT_DETAILS
-- =============================================

-- Media Fields
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS highlight_video TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS highlight_video_cover_image TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS hero_image TEXT;

-- Blurb/Content Fields
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS finalists_winners_blurb TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS highlight_blurb_1 TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS highlight_blurb_2 TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS entertainment_blurb TEXT;

-- Menu Blurbs (split into courses)
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS menu_blurb_starter TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS menu_blurb_main TEXT;
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS menu_blurb_dessert TEXT;

-- Multiple Image Fields (using TEXT[] arrays)
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS highlight_images TEXT[] DEFAULT '{}';
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS entertainment_images TEXT[] DEFAULT '{}';
ALTER TABLE event_details ADD COLUMN IF NOT EXISTS menu_images TEXT[] DEFAULT '{}';

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN event_details.highlight_video IS 'URL to highlight video (e.g., YouTube, Vimeo, or R2 storage)';
COMMENT ON COLUMN event_details.highlight_video_cover_image IS 'Cover image URL for the highlight video';
COMMENT ON COLUMN event_details.hero_image IS 'Hero/banner image URL for the event page';
COMMENT ON COLUMN event_details.finalists_winners_blurb IS 'Descriptive text about finalists and winners';
COMMENT ON COLUMN event_details.highlight_blurb_1 IS 'First highlight section text';
COMMENT ON COLUMN event_details.highlight_blurb_2 IS 'Second highlight section text';
COMMENT ON COLUMN event_details.entertainment_blurb IS 'Description of entertainment at the event';
COMMENT ON COLUMN event_details.menu_blurb_starter IS 'Description of starter/appetizer course';
COMMENT ON COLUMN event_details.menu_blurb_main IS 'Description of main course';
COMMENT ON COLUMN event_details.menu_blurb_dessert IS 'Description of dessert course';
COMMENT ON COLUMN event_details.highlight_images IS 'Array of image URLs for highlight section';
COMMENT ON COLUMN event_details.entertainment_images IS 'Array of image URLs for entertainment section';
COMMENT ON COLUMN event_details.menu_images IS 'Array of image URLs for menu section';

