-- Migration: 018_add_job_title_to_user_profiles
-- Created: 2025
-- Description: Add job_title column to user_profiles for email template sender information

-- Add job_title column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add comment
COMMENT ON COLUMN user_profiles.job_title IS 'Job title of the admin user (displayed in email templates)';


