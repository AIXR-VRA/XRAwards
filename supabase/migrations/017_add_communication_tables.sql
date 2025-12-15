-- Migration: 017_add_communication_tables
-- Created: 2025
-- Description: Add communication system tables for sending transactional emails to judges and finalists

-- =============================================
-- USER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- CONTACTS TABLE (Unified CRM)
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_type TEXT NOT NULL, -- 'judge' | 'finalist' | 'sponsor' | 'attendee'
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organization TEXT,
  -- Foreign key relationships (nullable, depends on contact_type)
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE, -- nullable, required for 'judge'
  finalist_id UUID REFERENCES finalists(id) ON DELETE CASCADE, -- nullable, required for 'finalist'
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE, -- nullable, required for 'sponsor'
  attendee_id UUID, -- nullable, required for 'attendee' (table may not exist yet)
  -- Flexible metadata for contact-specific fields
  metadata JSONB DEFAULT '{}',
  -- Status and preferences
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  unsubscribe_token TEXT UNIQUE, -- for unsubscribe links
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  CONSTRAINT check_contact_type_constraints CHECK (
    (contact_type = 'judge' AND judge_id IS NOT NULL AND finalist_id IS NULL AND sponsor_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'finalist' AND finalist_id IS NOT NULL AND judge_id IS NULL AND sponsor_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'sponsor' AND sponsor_id IS NOT NULL AND judge_id IS NULL AND finalist_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'attendee' AND attendee_id IS NOT NULL AND judge_id IS NULL AND finalist_id IS NULL AND sponsor_id IS NULL)
  ),
  -- Prevent duplicate emails per contact
  -- Note: PostgreSQL treats NULL as distinct in UNIQUE constraints, so this works correctly
  CONSTRAINT unique_contact_email UNIQUE(email, contact_type, judge_id, finalist_id, sponsor_id, attendee_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_judge_id ON contacts(judge_id) WHERE judge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_finalist_id ON contacts(finalist_id) WHERE finalist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_sponsor_id ON contacts(sponsor_id) WHERE sponsor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribe_token ON contacts(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;

-- =============================================
-- COMMUNICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_by UUID NOT NULL REFERENCES user_profiles(id),
  subject TEXT NOT NULL,
  message_content TEXT NOT NULL, -- Markdown content (limited formatting: paragraphs, lists, headings, links)
  html_content TEXT NOT NULL, -- Final rendered HTML (template + rendered message_content) sent to Resend
  text_content TEXT, -- Plain text fallback (auto-generated from HTML) for email clients that don't support HTML
  -- Recipient tracking
  recipient_count INTEGER NOT NULL, -- total recipients
  sent_count INTEGER DEFAULT 0, -- successfully sent
  failed_count INTEGER DEFAULT 0, -- failed sends
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'partially_failed'
  -- Metadata
  template_name TEXT NOT NULL, -- Name of email template used (e.g., 'announcement', 'reminder')
  tags JSONB DEFAULT '[]', -- Resend tags for analytics
  scheduled_at TIMESTAMPTZ, -- for future scheduled sends
  sent_at TIMESTAMPTZ, -- when sending completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_communications_sent_by ON communications(sent_by);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_scheduled_at ON communications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_template_name ON communications(template_name);

-- =============================================
-- COMMUNICATION RECIPIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS communication_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  -- Resend tracking
  resend_email_id TEXT, -- Resend's email ID for tracking
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed'
  error_message TEXT, -- if failed
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ, -- if tracking opens
  clicked_at TIMESTAMPTZ, -- if tracking clicks
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  UNIQUE(communication_id, contact_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_communication_recipients_communication_id ON communication_recipients(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_contact_id ON communication_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_status ON communication_recipients(status);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_resend_email_id ON communication_recipients(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_recipients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR USER_PROFILES
-- =============================================

-- Allow authenticated users to read all user profiles (for sender info in communications)
CREATE POLICY "Allow authenticated users to read user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to read their own profile
CREATE POLICY "Allow users to read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS POLICIES FOR CONTACTS
-- =============================================

-- Only authenticated users can read contacts
CREATE POLICY "Allow authenticated users to read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert contacts
CREATE POLICY "Allow authenticated users to insert contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update contacts
CREATE POLICY "Allow authenticated users to update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete contacts
CREATE POLICY "Allow authenticated users to delete contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR COMMUNICATIONS
-- =============================================

-- Only authenticated users can read communications
CREATE POLICY "Allow authenticated users to read communications"
  ON communications
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert communications
CREATE POLICY "Allow authenticated users to insert communications"
  ON communications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update communications
CREATE POLICY "Allow authenticated users to update communications"
  ON communications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete communications
CREATE POLICY "Allow authenticated users to delete communications"
  ON communications
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR COMMUNICATION_RECIPIENTS
-- =============================================

-- Only authenticated users can read communication recipients
CREATE POLICY "Allow authenticated users to read communication recipients"
  ON communication_recipients
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert communication recipients
CREATE POLICY "Allow authenticated users to insert communication recipients"
  ON communication_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update communication recipients
CREATE POLICY "Allow authenticated users to update communication recipients"
  ON communication_recipients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete communication recipients
CREATE POLICY "Allow authenticated users to delete communication recipients"
  ON communication_recipients
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contacts
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for communications
CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE user_profiles IS 'Profile information for authenticated users (admins sending emails)';
COMMENT ON TABLE contacts IS 'Unified contact management table for judges, finalists, sponsors, and attendees';
COMMENT ON TABLE communications IS 'History of all sent communications (emails)';
COMMENT ON TABLE communication_recipients IS 'Individual email delivery status for each recipient';

COMMENT ON COLUMN user_profiles.id IS 'References auth.users(id) - primary key from Supabase auth. Email can be retrieved from auth.users.email when needed.';
COMMENT ON COLUMN user_profiles.first_name IS 'Admin first name displayed in email templates';
COMMENT ON COLUMN user_profiles.last_name IS 'Admin last name displayed in email templates';
COMMENT ON COLUMN user_profiles.profile_photo_url IS 'URL to admin profile photo for email templates';

COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: judge, finalist, sponsor, or attendee';
COMMENT ON COLUMN contacts.judge_id IS 'Foreign key to judges table (required when contact_type = judge)';
COMMENT ON COLUMN contacts.finalist_id IS 'Foreign key to finalists table (required when contact_type = finalist)';
COMMENT ON COLUMN contacts.sponsor_id IS 'Foreign key to sponsors table (required when contact_type = sponsor)';
COMMENT ON COLUMN contacts.attendee_id IS 'Foreign key to attendees table (required when contact_type = attendee)';
COMMENT ON COLUMN contacts.metadata IS 'Flexible JSONB field for contact-specific metadata (job_title, linkedin_url, etc.)';
COMMENT ON COLUMN contacts.is_active IS 'Whether contact is active and should receive emails';
COMMENT ON COLUMN contacts.email_verified IS 'Whether email address has been verified';
COMMENT ON COLUMN contacts.unsubscribe_token IS 'Unique token for unsubscribe links';

COMMENT ON COLUMN communications.sent_by IS 'User profile ID of admin who sent the communication';
COMMENT ON COLUMN communications.message_content IS 'Original Markdown content (limited formatting: paragraphs, bullet points, headings, links). Stored for editing/re-editing. Converted to HTML before sending.';
COMMENT ON COLUMN communications.html_content IS 'Final rendered HTML (email template with variables replaced + rendered message_content). This is what gets sent to Resend API.';
COMMENT ON COLUMN communications.text_content IS 'Plain text fallback (auto-generated from HTML). Optional but recommended for better email deliverability to clients that don''t support HTML.';
COMMENT ON COLUMN communications.recipient_count IS 'Total number of recipients';
COMMENT ON COLUMN communications.sent_count IS 'Number of emails successfully sent';
COMMENT ON COLUMN communications.failed_count IS 'Number of emails that failed to send';
COMMENT ON COLUMN communications.status IS 'Communication status: pending, scheduled, sending, completed, failed, or partially_failed';
COMMENT ON COLUMN communications.template_name IS 'Name of email template used (e.g., announcement, reminder)';
COMMENT ON COLUMN communications.tags IS 'Resend tags for analytics (JSONB array)';
COMMENT ON COLUMN communications.scheduled_at IS 'Timestamp for future scheduled sends (handled by pg_cron)';
COMMENT ON COLUMN communications.sent_at IS 'Timestamp when sending completed';

COMMENT ON COLUMN communication_recipients.communication_id IS 'Foreign key to communications table';
COMMENT ON COLUMN communication_recipients.contact_id IS 'Foreign key to contacts table';
COMMENT ON COLUMN communication_recipients.resend_email_id IS 'Resend API email ID for tracking and webhook lookups';
COMMENT ON COLUMN communication_recipients.status IS 'Individual recipient status: pending, sent, delivered, bounced, or failed';
COMMENT ON COLUMN communication_recipients.error_message IS 'Error message if email failed to send';
COMMENT ON COLUMN communication_recipients.sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN communication_recipients.delivered_at IS 'Timestamp when email was delivered (from Resend webhook)';
COMMENT ON COLUMN communication_recipients.opened_at IS 'Timestamp when email was opened (from Resend webhook)';
COMMENT ON COLUMN communication_recipients.clicked_at IS 'Timestamp when email link was clicked (from Resend webhook)';

