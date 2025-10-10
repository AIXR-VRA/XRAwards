-- Migration: 008_add_judges_profile_image
-- Created: 2025
-- Description: Add profile_image_url field to judges table for R2 storage

-- Add profile_image_url column to judges
ALTER TABLE judges
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add comment
COMMENT ON COLUMN judges.profile_image_url IS 'URL to judge profile image (stored in R2)';
