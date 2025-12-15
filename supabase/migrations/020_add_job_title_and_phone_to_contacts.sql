-- Migration: 020_add_job_title_and_phone_to_contacts
-- Created: 2025
-- Description: Add job_title and phone_number columns to contacts table

-- Add job_title column to contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add phone_number column to contacts (stored in E.164 format: +1234567890)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_job_title ON contacts(job_title) WHERE job_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number) WHERE phone_number IS NOT NULL;

-- Add comments
COMMENT ON COLUMN contacts.job_title IS 'Job title of the contact';
COMMENT ON COLUMN contacts.phone_number IS 'Phone number in E.164 format (e.g., +1234567890) with country dialing code';

