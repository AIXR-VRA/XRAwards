-- Migration: 019_add_click_tracking_data
-- Created: 2025
-- Description: Add detailed click tracking to communication_recipients

-- Add click_data JSONB column to store click details
-- Structure: { clicks: [{ url: string, timestamp: string, ip: string, userAgent: string }], click_count: number }
ALTER TABLE communication_recipients 
ADD COLUMN IF NOT EXISTS click_data JSONB DEFAULT '{"clicks": [], "click_count": 0}'::jsonb;

-- Add open_count column to track multiple opens
ALTER TABLE communication_recipients 
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;

-- Comment on new columns
COMMENT ON COLUMN communication_recipients.click_data IS 'JSONB storing detailed click tracking: { clicks: [{url, timestamp, ip, userAgent}], click_count: number }';
COMMENT ON COLUMN communication_recipients.open_count IS 'Number of times the email was opened (for tracking engagement)';

