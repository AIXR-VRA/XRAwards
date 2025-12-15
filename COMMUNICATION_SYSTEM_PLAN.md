# Communication System Implementation Plan

## Overview
This plan outlines the implementation of a communication system for sending transactional emails to judges and finalists using Resend API, with proper database structure, security, and scalability considerations.

## Implementation Status

**Phase 1: Database Setup** ✅ **COMPLETED**
- Migration `017_add_communication_tables.sql` created and ready
- All tables, RLS policies, indexes, and triggers implemented
- See Phase 1 section below for details

**Phase 2: Edge Functions** ✅ **COMPLETED**
- `send-communication/index.ts` - Sends emails via Resend batch API
- `resend-webhook/index.ts` - Handles delivery status webhooks from Resend
- See Phase 2 section below for details

**Phase 3: Admin UI** ✅ **COMPLETED**
- Communications Dashboard page (`/admin/communications/`) created
- Compose Message page (`/admin/communications/compose/`) created with:
  - Recipient selection with filters (event year, contact type, winner status)
  - Sender selection dropdown (from user_profiles)
  - Optional subject line with smart defaults based on recipient type
  - Optional preheader with smart defaults based on sender name
  - Message content editor with markdown support (bold, italic, lists, links)
  - Optional CTA button toggle with custom text and link fields
  - Dynamic FAQ section (uses active event `tickets_portal_url`, dynamic winners info based on ceremony date)
  - Live email preview showing subject and preheader
  - Schedule & Send modal (immediate or scheduled sending)
- API endpoints created:
  - `/api/communications.ts` - List and create communication records
  - `/api/user-profiles.ts` - List admin user profiles for sender selection
  - `/api/contacts-with-events.ts` - List contacts with event filtering for recipient selection
- AdminLayout updated with "Communications" nav item
- See Phase 3 section below for details

**Phase 3.5: User Profile Photo Upload** ✅ **COMPLETED**
- Profile photo upload functionality implemented in admin dashboard
- Uses existing `/api/media/` endpoint with proper admin authentication
- Profile editing modal with FileUpload component (includes cropping)
- Profile data stored in `user_profiles` table
- See Phase 3.5 section below for details

**Phase 3.6: Contact Management Infrastructure** ✅ **COMPLETED**
- Contacts API endpoint (`/api/contacts/`) implemented with full CRUD operations
- Contact management UI integrated into judges and finalists admin pages
- Supports creating, editing, and deleting contacts for judges and finalists
- Proper authentication and RLS policy enforcement

**Phase 4: Testing** ⏳ **PENDING**
- Test end-to-end email sending flow
- Verify webhook delivery tracking

## Architecture Decisions

### 1. Contact Tables: Unified CRM Table vs Separate Tables

**RECOMMENDATION: Single Unified `contacts` Table**

**Rationale:**
- **Simpler CSV Import**: One table structure makes bulk imports easier
- **Unified Queries**: Can query all contacts in one place for communication history
- **Consistent RLS**: Single set of policies to maintain
- **Flexible Schema**: Use JSONB for contact-specific metadata to handle different fields between judges and finalists
- **Future-Proof**: Easy to add new contact types (sponsors, media, etc.)

**Alternative Considered:**
- Separate `judge_contacts` and `finalist_contacts` tables
- **Rejected because**: Duplicates structure, complicates queries, harder CSV import, more RLS policies to maintain

**Table Structure:**
```sql
contacts (
  id UUID PRIMARY KEY,
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Constraints
  CHECK (
    (contact_type = 'judge' AND judge_id IS NOT NULL AND finalist_id IS NULL AND sponsor_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'finalist' AND finalist_id IS NOT NULL AND judge_id IS NULL AND sponsor_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'sponsor' AND sponsor_id IS NOT NULL AND judge_id IS NULL AND finalist_id IS NULL AND attendee_id IS NULL) OR
    (contact_type = 'attendee' AND attendee_id IS NOT NULL AND judge_id IS NULL AND finalist_id IS NULL AND sponsor_id IS NULL)
  ),
  -- Prevent duplicate emails per contact
  -- Note: PostgreSQL treats NULL as distinct in UNIQUE constraints, so this works correctly
  UNIQUE(email, contact_type, judge_id, finalist_id, sponsor_id, attendee_id)
)
```

**Benefits:**
- Handles "many-to-one" emails (multiple emails per judge/finalist/sponsor/attendee)
- Single source of truth for all contacts
- Easy to extend with new contact types (already includes 'sponsor' and 'attendee' for future expansion)
- JSONB metadata can store contact-specific fields (job_title, linkedin_url, etc.)
- Supports all contact types: judges, finalists, sponsors, and attendees

### 2. Function Platform: Supabase Edge Functions vs Cloudflare Functions

**RECOMMENDATION: Supabase Edge Functions**

**Rationale:**
- **Already in Use**: Project already uses Edge Functions (brevo-forms, upload-media, etc.)
- **Consistency**: Same deployment and monitoring patterns
- **Database Access**: Direct access to Supabase database without additional auth
- **Cost**: No additional infrastructure
- **Batching Support**: Resend provides batch API (up to 100 emails per batch request)
- **Timeout Handling**: For 500 emails, use background processing with chunked batches

**IMPORTANT: Resend Batching Clarification**
- **Resend does NOT automatically batch emails** - you must explicitly use `resend.batch.send()` API
- **Batch Limit**: Maximum 100 emails per batch request
- **Rate Limit**: Default 2 requests/second (can be increased by contacting Resend support)
- **For 500 emails**: You must manually split into 5 batches of 100 and send them (with rate limiting)

**Implementation Strategy for 500 Emails (Simplest Approach):**
1. **Manual Chunking Required**: Resend does NOT automatically batch emails. You must explicitly use the batch API and split large sends into chunks of 100 (Resend's batch limit)
2. **Use Background Tasks**: Use `EdgeRuntime.waitUntil()` to process email sending in background - this is the **easiest and recommended Supabase approach**
3. **Chunked Batch Sending**: Split 500 emails into 5 batches of 100, send each batch using `resend.batch.send()`
4. **Rate Limit Handling**: Resend default rate limit is 2 requests/second. For 500 emails (5 batches):
   - **Simplest**: Send batches sequentially with 500ms delay between batches (safe, ~2.5 seconds total)
   - **Faster**: Send 2 batches concurrently, wait 1 second, send 2 more, wait, send final batch (~2 seconds total)
   - **Best Performance**: Request rate limit increase from Resend support for higher throughput
5. **Return Immediately**: Function returns immediately to client with communication ID, processing continues in background
6. **Idempotency**: Use Resend's idempotency keys to prevent duplicate sends on retries

**Why Background Tasks (Not Queue):**
- **Simpler**: No queue setup required, just use `EdgeRuntime.waitUntil()`
- **Recommended**: This is Supabase's recommended pattern for async operations
- **Sufficient**: For email sending, background tasks handle retries and errors adequately
- **Queue Optional**: Only use pgmq queue if you need scheduled retries or complex workflow management

**Alternative Considered:**
- Cloudflare Functions
- **Rejected because**: Additional infrastructure, different deployment process, would need separate auth setup

### 3. Database Schema Design

#### 3.1 User Profiles Table (`user_profiles`)
Stores profile information for authenticated users (admins sending emails).

```sql
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Note**: Email is retrieved from `auth.users.email` when needed (not denormalized to avoid sync issues).

**RLS Policy**: Authenticated users can read all profiles (for sender info in communications). Users can only update their own profile.

**Profile Photo Upload & Storage:**
- **Use existing `upload-media` Edge Function**: Already handles R2 storage uploads
- **Storage Path**: Store profile photos in `images/profiles/{user_id}/` folder structure
- **Process**:
  1. Admin uploads photo via admin UI (reuse MediaSelector component or create profile-specific upload)
  2. Call `upload-media` Edge Function with file data
  3. Function uploads to R2: `images/profiles/{user_id}/{filename}`
  4. Returns public URL
  5. Update `user_profiles.profile_photo_url` with returned URL
- **Admin UI**: Add profile photo upload section to user profile settings page
- **Reuse existing patterns**: Follow same upload pattern as media library and judge profile images

#### 3.2 Contacts Table (`contacts`)
Unified contact management table (as described above).

**RLS Policy**: Only authenticated users can access. No public access.

#### 3.3 Communications Table (`communications`)
Stores history of all sent communications.

```sql
communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_by UUID NOT NULL REFERENCES user_profiles(id),
  subject TEXT NOT NULL,
  message_content TEXT NOT NULL, -- Markdown content (limited formatting: paragraphs, lists, headings, links)
  html_content TEXT NOT NULL, -- Rendered HTML from template + message_content
  text_content TEXT, -- Plain text fallback (auto-generated from HTML)
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
)
```

**RLS Policy**: Only authenticated users can access.

#### 3.4 Email Templates (Configuration or Database Table)

**Option A: Store in Code/Config (Simpler)**
- Define templates as TypeScript objects or JSON files
- Templates include HTML structure with variable placeholders
- Easy to version control and update

**Option B: Store in Database (More Flexible)**
```sql
email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'announcement', 'reminder', 'welcome', etc.
  subject_template TEXT NOT NULL, -- Can include {{variables}}
  html_template TEXT NOT NULL, -- HTML with {{variables}}
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Template Variables Available (Default HTML Template):**
- `{{subject}}` - Email subject line (see default behaviour below)
- `{{preheader}}` - Short preview text shown in inbox (see default behaviour below)
- `{{sender_name}}` - Admin's full name (constructed from `first_name + last_name` from `user_profiles`)
- `{{sender_photo_url}}` - Admin's profile photo URL
- `{{sender_title}}` - Optional sender job title / role label
- `{{message_content}}` - Rendered Markdown message content (HTML)
- `{{recipient_name_or_default}}` - Greeting name resolved in the Edge Function:
  - If contact has a first name: that value (e.g. "Alex")
  - If no name is available: the literal string `"there"` so the greeting becomes **"Hi there,"**
- `{{recipient_email}}` - Contact's email
- `{{organization_name}}` - Contact's organization
- `{{cta_text}}` - Label for primary CTA button (e.g. "Secure Tickets", "Nominate Now")
- `{{cta_href}}` - URL for primary CTA button (typically from `getCTAButton` in `date-checker`)
- `{{tickets_url}}` - URL to the active event ticketing page (from `event_details.tickets_portal_url`)
- `{{ unsubscribe }}` - Unsubscribe URL token used in footer

**Subject & Preheader Defaults (Edge Function Behaviour):**
- If `subject` is not provided by the admin:
  - Default to: **"You have a new update on your XR Awards Gala entry."**
- If `preheader` is not provided by the admin:
  - Default to: **"`{{sender_name}}` has an update for you about your XR Awards gala entry."**
- These defaults are applied in the Edge Function before rendering the template so the HTML template can always rely on `{{subject}}` and `{{preheader}}` being present.

**Markdown Rendering:**
- Use a lightweight Markdown library (e.g., `marked`, `markdown-it`, or `remark`)
- **Supported Markdown elements only**:
  - Paragraphs
  - Bullet points/lists
  - Headings (`#`, `##`, `###`)
  - Links
  - **NOT supported**: Images, tables, complex HTML, scripts, React/JSX components
- Convert Markdown → HTML before inserting into template

#### 3.5 Communication Recipients Table (`communication_recipients`)
Tracks individual email delivery status for each recipient.

```sql
communication_recipients (
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
)
```

**RLS Policy**: Only authenticated users can access.

**Indexes:**
- `idx_communication_recipients_communication_id` on `communication_id`
- `idx_communication_recipients_contact_id` on `contact_id`
- `idx_communication_recipients_status` on `status`
- `idx_communication_recipients_resend_email_id` on `resend_email_id` (for webhook lookups)

### 4. Edge Function Architecture

#### 4.1 Function: `send-communication`

**Purpose**: Send emails to selected contacts using Resend API

**Input:**
```typescript
{
  contactIds: UUID[], // Array of contact IDs to send to
  templateName: string, // Pre-made template name (e.g., 'announcement', 'reminder')
  subject: string, // Subject line (may include template variables)
  messageContent: string, // Markdown content (limited: bullet points, paragraphs, headings, links)
  scheduledAt?: string, // ISO timestamp for future sends (handled in Supabase, not Resend)
  tags?: Array<{ name: string, value: string }>
}
```

**Email Template System:**
- **Pre-made templates**: Store email templates in database or config file
- **Template structure**: Includes header (sender photo/name), message area, footer
- **Template variables** (mapped to the default HTML file): 
  - `{{subject}}` / `{{preheader}}` - Subject and inbox preview text (with Edge Function defaults)
  - `{{sender_name}}` - Admin's full name (constructed from `first_name + last_name` from `user_profiles`)
  - `{{sender_photo_url}}` - Admin's profile photo URL
  - `{{sender_title}}` - Optional sender job title / role label
  - `{{message_content}}` - Rendered Markdown message content (HTML)
  - `{{recipient_name_or_default}}` - Resolved greeting value (contact first name or `"there"`)
  - `{{organization_name}}` - Contact's organization
  - `{{cta_text}}` / `{{cta_href}}` - CTA button text + URL (from `getCTAButton` / `date-checker`)
  - `{{tickets_url}}` - Active event tickets URL for FAQ link
- **Markdown Editor**: Simple editor supporting:
  - Paragraphs
  - Bullet points/lists
  - Headings (`#`, `##`, `###`)
  - Links
  - **Stretch goal**: Images - single image support
  - **NOT full HTML or React/JSX** - limited formatting for security and simplicity
- **Template Rendering**: 
  1. Admin writes Markdown message in editor
  2. Convert Markdown → HTML (server-side)
  3. Insert rendered HTML into template at `{{message_content}}`
  4. Replace other template variables (sender name, photo, recipient name)
  5. Send via Resend

**IMPORTANT: Scheduling Limitations**
- **Resend supports `scheduledAt` for individual emails** (up to 30 days in advance)
- **Resend does NOT support `scheduledAt` for batch sends** (batch API doesn't accept scheduledAt)
- **For scheduled batch sends**: Store `scheduled_at` in database, use Supabase `pg_cron` to trigger Edge Function at scheduled time

**Process (Using Background Tasks - Recommended):**

**For Immediate Sends:**
1. Validate request (authenticated user, valid contacts)
2. Create `communication` record with status 'pending', `scheduled_at = NULL`
3. Create `communication_recipients` records for each contact
4. **Return immediately to client** with communication ID
5. **Process in background** using `EdgeRuntime.waitUntil()`:
   - Chunk contacts into batches of 100 (Resend batch limit)
   - For each batch:
     - Send using `resend.batch.send()` (no scheduledAt support in batch API)
     - Update recipient statuses in database
     - Wait 500ms between batches (rate limit: 2 req/sec)
   - Update communication status to 'completed' or 'partially_failed'
   - Handle errors with try/catch and update status accordingly

**For Scheduled Sends:**
1. Validate request (authenticated user, valid contacts, future scheduledAt)
2. Create `communication` record with status 'scheduled', `scheduled_at = provided timestamp`
3. Create `communication_recipients` records for each contact
4. **Return immediately to client** with communication ID and scheduled time
5. **Scheduling handled by pg_cron**: A scheduled job checks for communications where `scheduled_at <= NOW()` and `status = 'scheduled'`, then triggers the send function
6. When scheduled time arrives, pg_cron invokes Edge Function to send emails (same process as immediate sends)

**Code Pattern:**
```typescript
Deno.serve(async (req) => {
  const { contactIds, templateName, subject, messageContent, scheduledAt } = await req.json()
  
  // Validate and get sender profile
  const senderProfile = await getSenderProfile(userId)
  
  // Render Markdown message to HTML (limited formatting only)
  const renderedMessage = renderMarkdown(messageContent) // Convert Markdown to HTML
  
  // Load email template
  const template = await getEmailTemplate(templateName)
  
  // Create communication record
  const { data: communication } = await supabase
    .from('communications')
    .insert({
      sent_by: userId,
      subject,
      message_content: messageContent, // Store original Markdown
      html_content: renderTemplate(template, {
        sender_name: `${senderProfile.first_name} ${senderProfile.last_name}`,
        sender_photo_url: senderProfile.profile_photo_url,
        message_content: renderedMessage
      }),
      template_name: templateName,
      status: scheduledAt ? 'scheduled' : 'pending',
      scheduled_at: scheduledAt || null
    })
    .select()
    .single()
  
  // Create recipient records
  // ...
  
  // Return immediately, process in background (if not scheduled)
  if (!scheduledAt) {
    EdgeRuntime.waitUntil(sendEmailsInBackground(communication.id, contacts, template, senderProfile))
  }
  
  return new Response(JSON.stringify({ 
    communicationId: communication.id,
    status: scheduledAt ? 'scheduled' : 'pending',
    message: scheduledAt ? 'Email scheduled' : 'Emails are being sent in the background'
  }))
})

async function sendEmailsInBackground(
  communicationId: string, 
  contacts: Contact[], 
  template: EmailTemplate,
  sender: UserProfile
) {
  try {
    // Chunk contacts into batches of 100
    // For each batch:
    //   - Render template with recipient-specific variables
    //   - Send via resend.batch.send()
    //   - Update recipient statuses
  } catch (error) {
    // Update communication status to 'failed'
    // Log error
  }
}
```

**Error Handling:**
- Retry logic for transient failures (3 retries with exponential backoff)
- Idempotency keys to prevent duplicate sends
- Update recipient status to 'failed' with error message
- Log errors to Sentry (following existing pattern)

**Rate Limiting:**
- **Resend Batch API**: Up to 100 emails per batch request (you must chunk manually)
- **Resend Rate Limit**: Default 2 requests/second (can be increased by contacting support)
- **Daily Quota**: Varies by plan (free tier typically 3,000-10,000 emails/day)
- **Implementation**: For 500 emails, send 5 batches sequentially with 500ms delay, or request rate limit increase
- **Note**: Resend does NOT automatically batch - you must use `resend.batch.send()` explicitly

#### 4.2 Function: `process-scheduled-communications` (For Scheduled Sends)

**Purpose**: Process scheduled communications that are ready to send

**Trigger**: Called by `pg_cron` on a schedule (e.g., every minute)

**Process:**
1. Query `communications` table for records where:
   - `status = 'scheduled'`
   - `scheduled_at <= NOW()`
   - `scheduled_at IS NOT NULL`
2. For each scheduled communication:
   - Update status to 'pending'
   - Trigger the same send process as immediate sends
   - Use background tasks to send emails

**pg_cron Setup:**
```sql
-- Run every minute to check for scheduled communications
SELECT cron.schedule(
  'process-scheduled-communications',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/process-scheduled-communications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Alternative: Simpler Approach**
- Use a single Edge Function that checks `scheduled_at` before sending
- If `scheduled_at` is in the future, just store and return
- Use pg_cron to call the function periodically, which checks and sends if ready

#### 4.3 Function: `resend-webhook` (Future)

**Purpose**: Handle Resend webhooks for delivery status updates

**Webhook Events:**
- `email.sent` → Update `communication_recipients.status = 'sent'`
- `email.delivered` → Update `communication_recipients.status = 'delivered'`
- `email.bounced` → Update `communication_recipients.status = 'bounced'`
- `email.opened` → Update `communication_recipients.opened_at`
- `email.clicked` → Update `communication_recipients.clicked_at`

### 5. Migration Strategy

#### Migration 017: Add Communication Tables

**File**: `supabase/migrations/017_add_communication_tables.sql`

**Steps:**
1. Create `user_profiles` table
2. Create `contacts` table with proper constraints
3. Create `communications` table
4. Create `communication_recipients` table
5. Add indexes for performance
6. Enable RLS on all tables
7. Create RLS policies (authenticated users only)
8. Add triggers for `updated_at` timestamps
9. Add foreign key constraints

**RLS Policies Pattern:**
```sql
-- Example for contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read contacts
CREATE POLICY "Allow authenticated users to read contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert contacts
CREATE POLICY "Allow authenticated users to insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update contacts
CREATE POLICY "Allow authenticated users to update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete contacts
CREATE POLICY "Allow authenticated users to delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (true);
```

**Apply same pattern to:**
- `user_profiles` (with additional policy: users can only update their own profile)
- `communications`
- `communication_recipients`

### 6. CSV Import Consideration (Future)

**Design for CSV Import:**
- Users will upload complete records with all information (name, email, organization, etc.)
- System will create/link contacts automatically based on matching criteria
- Edge Function: `import-contacts-csv`
- Process: Parse CSV → Validate → Match existing records (by email/name) → Create new or link existing → Bulk insert contacts

**CSV Format Examples:**

**For Judges:**
```csv
contact_type,email,first_name,last_name,organization,job_title,linkedin_url
judge,john.doe@example.com,John,Doe,Acme Corp,CEO,https://linkedin.com/in/johndoe
judge,jane.smith@tech.com,Jane,Smith,Tech Inc,CTO,https://linkedin.com/in/janesmith
```

**For Finalists:**
```csv
contact_type,email,first_name,last_name,organization,finalist_title
finalist,contact@finalist.com,Jane,Smith,Finalist Inc,XR Experience Platform
finalist,info@project.com,John,Developer,Project Corp,VR Training Solution
```

**For Sponsors:**
```csv
contact_type,email,first_name,last_name,organization,sponsor_name,tier,contact_role
sponsor,sponsor@example.com,Marketing,Director,Sponsor Corp,Gold Sponsor,gold,Marketing Director
```

**For Attendees:**
```csv
contact_type,email,first_name,last_name,organization,ticket_type,dietary_requirements
attendee,attendee@example.com,Attendee,Name,Company Inc,VIP,vegetarian
```

**Import Process:**
1. Parse CSV and validate required fields per contact_type
2. **For judges**: Match by email or (first_name + last_name + organization) → Create judge if doesn't exist → Link contact
3. **For finalists**: Match by email or (title + organization) → Create finalist if doesn't exist → Link contact
4. **For sponsors**: Match by email or sponsor name → Link to existing sponsor or create new → Link contact
5. **For attendees**: Match by email → Create attendee record if needed → Link contact
6. Handle duplicates: If contact already exists (same email + contact_type), update instead of creating duplicate
7. Store additional fields in `metadata` JSONB column (job_title, linkedin_url, ticket_type, etc.)

### 7. Implementation Phases

#### Phase 1: Database Setup ✅ **COMPLETED**
1. ✅ Create migration `017_add_communication_tables.sql`
2. ✅ Add RLS policies following existing patterns
3. ⏳ Test RLS policies with authenticated/unauthenticated users (pending migration application)
4. ✅ Add indexes for performance

**Status**: Migration file created and ready. Includes:
- `user_profiles` table (first_name, last_name, profile_photo_url)
- `contacts` table (unified CRM with support for judges, finalists, sponsors, attendees)
- `communications` table (stores Markdown content, rendered HTML, and plain text)
- `communication_recipients` table (tracks individual email delivery status)
- All RLS policies configured for authenticated users only
- Indexes added for performance
- Triggers for `updated_at` timestamps
- Comprehensive comments and documentation

**Note**: Schema uses Markdown (not full MDX) for `message_content` since emails can't render React components. Content is converted to HTML server-side before sending to Resend.

#### Phase 2: Edge Functions ✅ **COMPLETED**

**2.1 Send Communication Function** (`send-communication/index.ts`)
1. ✅ Created Edge Function with Resend batch API integration
2. ✅ Batch sending logic (chunks into 100 emails per batch - Resend limit)
3. ✅ Background processing with `EdgeRuntime.waitUntil()` for immediate response
4. ✅ Rate limiting (500ms delay between batches - safe for 2 req/sec limit)
5. ✅ Error handling with per-recipient status tracking
6. ✅ Dynamic sender name (e.g., "Daniel from XR Awards <awards@aixr.org>")
7. ✅ Recipient-specific placeholder replacement (`{{recipient_name_or_default}}`, etc.)

**How it works:**
- Triggered from compose page after communication record is created
- Fetches communication + sender profile from database
- Fetches all pending recipients with contact info
- Chunks recipients into batches of 100
- Sends each batch via `https://api.resend.com/emails/batch`
- Updates `communication_recipients.resend_email_id` with returned email IDs
- Updates `communications.sent_count` and `failed_count` in real-time
- Sets final status: `completed`, `failed`, or `partially_failed`

**2.2 Resend Webhook Handler** (`resend-webhook/index.ts`)
1. ✅ Handles all 10 Resend webhook events
2. ✅ Signature verification using Svix (Resend's webhook provider)
3. ✅ Updates recipient delivery status in database
4. ✅ Auto-deactivates contacts on permanent bounces/complaints

**Webhook Events Handled:**

| Event | Database Update |
|-------|-----------------|
| `email.sent` | Sets `status = 'sent'`, `sent_at` timestamp |
| `email.delivered` | Sets `status = 'delivered'`, `delivered_at` timestamp |
| `email.bounced` | Sets `status = 'bounced'`, stores error message, deactivates contact (if permanent) |
| `email.complained` | Sets `status = 'bounced'`, deactivates contact |
| `email.opened` | Sets `opened_at` timestamp |
| `email.clicked` | Sets `clicked_at` timestamp |
| `email.failed` | Sets `status = 'failed'`, stores failure reason |
| `email.delivery_delayed` | Logs warning (no status change - temporary) |
| `email.scheduled` | Logs only (we handle scheduling ourselves) |
| `email.received` | Logs only (inbound email - not used) |

**Webhook Endpoint URL:**
```
https://svcwnedufjiooqonstwv.supabase.co/functions/v1/resend-webhook
```

**Secrets Configured:**
- `resend` - Resend API key for sending
- `RESEND_WEBHOOK_SECRET` - For verifying webhook signatures

**Status**: Both Edge Functions deployed and operational. Email sending and webhook tracking fully functional.

#### Phase 3: Admin UI - Communication Interface ✅ **COMPLETED**
1. ✅ Communications Dashboard page (`/admin/communications/index.astro`)
   - Lists all sent communications with status badges (pending, sending, completed, failed)
   - Shows stats: total sent, scheduled, completed, failed counts
   - Filter by status
   - Link to compose new message
2. ✅ Compose Message page (`/admin/communications/compose.astro`)
   - Two-column layout: Editor (left) + Live Preview (right)
3. ✅ Recipient selection interface
   - Filter by event year (with active event pre-selected and marked with ★)
   - Filter by contact type (judges, finalists, sponsors)
   - Filter by winner status (all, winners only, finalists only)
   - Load Recipients button to fetch filtered contacts
   - Checkbox selection with Select All / Deselect All
   - Shows recipient count badge
4. ✅ Sender selection
   - Dropdown populated from `user_profiles` table
   - Shows sender name, stores sender ID, photo URL, and job title
5. ✅ Subject line (optional with smart defaults)
   - Auto-generates based on recipient type if left empty:
     - Finalists: "You have a new update on your {event name} Entry. 📬"
     - Judges: "You have an update on your {event name} judging. 📬"
     - Sponsors: "You have an update on your {event name} sponsorship. 📬"
     - Mixed: "You have a new update from the {event name} team. 📬"
6. ✅ Preheader (optional with smart defaults)
   - Auto-generates based on sender name and recipient type if left empty
   - Example: "Daniel has an update for you about your XR Awards entry."
7. ✅ Message content editor
   - Markdown support: **bold**, *italic*, bullet points (- item), [links](url)
   - Character count display
8. ✅ CTA button (optional)
   - Toggle switch to enable/disable CTA
   - Custom button text and link fields when enabled
   - CTA section omitted from email when disabled
9. ✅ Dynamic FAQ section
   - Ticketing link uses `tickets_portal_url` from active event in database
   - Winners info is dynamic based on ceremony date:
     - Past ceremony: "Winners were announced on {date} live on stage in Belgium..."
     - Future ceremony: "Winners will be revealed on the awards night..."
10. ✅ Live email preview
    - Shows subject and preheader at top of preview panel
    - Renders full HTML email template in iframe
    - Updates in real-time as user types
11. ✅ Schedule & Send modal
    - Shows summary: recipient count, sender name, subject
    - Radio options: Send Immediately or Schedule for Later
    - Date and time pickers for scheduled sends
    - Confirm & Send button with loading state
12. ✅ API endpoints created:
    - `/api/communications.ts` - GET (list with pagination) and POST (create record)
    - `/api/user-profiles.ts` - GET (list admin profiles for sender selection)
    - `/api/contacts-with-events.ts` - GET (list contacts with event filtering)
13. ✅ AdminLayout updated with "Communications" nav item

**Status**: Admin UI is complete and functional. Users can compose messages, preview emails, select recipients, and send communications. The compose page automatically triggers the `send-communication` Edge Function after creating a record.

#### Phase 3.5: User Profile Photo Upload ✅ **COMPLETED**
1. ✅ Add profile photo upload section to user profile settings
   - Implemented clickable user section in AdminLayout sidebar
   - ProfileEditForm React component with Modal and FileUpload
   - FileUpload component includes image cropping (circular crop for profile photos)
2. ✅ Reuse existing upload system
   - Uses `/api/media/` endpoint (same as media library)
   - Properly authenticated using `createSecureSupabaseClient` pattern
   - Stores photos via existing media library system
3. ✅ Store photos in media library
   - Photos uploaded through standard media library upload flow
   - Returns URL stored in `user_profiles.profile_photo_url`
4. ✅ Update `user_profiles.profile_photo_url` after upload
   - Profile API endpoint (`/api/profile/`) handles updates
   - Supports first_name, last_name, and profile_photo_url updates
5. ⏳ Display profile photo in email templates (pending email template implementation)

#### Phase 3.6: Contact Management Infrastructure ✅ **COMPLETED**
1. ✅ Contacts API endpoint (`/api/contacts/`) created
   - GET: List contacts with filtering by `judge_id`, `finalist_id`, `sponsor_id`, or `contact_type`
   - POST: Create new contacts with proper validation based on `contact_type`
   - PUT: Update existing contacts (email, name, organization, is_active)
   - DELETE: Delete contacts
   - All endpoints require authentication and enforce RLS policies
2. ✅ Contact management UI integrated into admin pages
   - Judges admin page (`/admin/judges`) includes contact management section
   - Finalists admin page (`/admin/finalists`) includes contact management section
   - Nested modal system for adding/editing contacts
   - Contact list display with edit/delete functionality
   - Proper event handling to prevent parent modal from closing when interacting with nested contact modal
3. ✅ Contact form fields
   - Email (required)
   - First name, last name (optional)
   - Organization (optional)
   - Active status (checkbox - determines if contact can receive emails)
4. ✅ Data validation
   - Email validation
   - Contact type validation (judge/finalist/sponsor/attendee)
   - Required ID validation based on contact type
   - Prevents duplicate contacts (enforced by database unique constraint)

**Status**: Contact management infrastructure is complete and functional. Admins can now manage contacts for judges and finalists directly from their respective admin pages. The API endpoint supports all CRUD operations and is ready for use by the communication system.

#### Phase 4: Testing & Optimization
1. Test with small batches (10-50 emails)
2. Test with large batches (500 emails)
3. Monitor Edge Function timeouts and memory
4. Optimize batch sizes and concurrency
5. Add queue-based processing if needed

#### Phase 5: Future Enhancements
1. Resend webhook handler for delivery tracking
2. CSV import functionality (with automatic record creation/linking)
3. More email templates
4. Analytics dashboard
5. ~~Profile photo upload UI for admin users~~ ✅ **COMPLETED** (see Phase 3.5)

### 8. Key Considerations

#### 8.0 Scheduling Communications

**Resend Scheduling Support:**
- ✅ **Individual emails**: Resend supports `scheduledAt` parameter (up to 30 days in advance)
- ❌ **Batch emails**: Resend does NOT support `scheduledAt` in batch API
- ❌ **Emails with attachments**: Scheduling not available

**Our Implementation Strategy:**
- **Store `scheduled_at` in database**: All scheduled communications stored with future timestamp
- **Use Supabase `pg_cron`**: Scheduled job runs every minute to check for ready-to-send communications
- **Trigger Edge Function**: When `scheduled_at <= NOW()`, pg_cron invokes Edge Function to send
- **Use batch API**: When triggered, send using batch API (same as immediate sends)

**Why This Approach:**
- Works for any number of recipients (batch or individual)
- Consistent with immediate sends (same code path)
- Reliable (pg_cron is built into Supabase)
- Simple (no need to handle Resend's scheduling limitations)

**Alternative (Not Recommended):**
- Send individual emails with Resend's `scheduledAt` for each recipient
- **Rejected because**: Defeats purpose of batching, slower, more API calls, higher cost

#### 8.1 Email Delivery Reliability
- **Resend Batch API**: Up to 100 emails per batch request (manual chunking required)
- **Important**: Resend does NOT automatically batch emails - you must explicitly use `resend.batch.send()` and chunk large sends yourself
- **Chunking Strategy**: Split 500 emails into 5 batches of 100
- **Rate Limit**: Default 2 requests/second (500ms between batches is safe)
- **Processing Options**:
  - **Sequential**: Send batch 1 → wait 500ms → send batch 2 → wait 500ms → etc. (safest, ~2.5 seconds for 5 batches)
  - **Concurrent with Rate Limiting**: Send 2 batches concurrently → wait 1 second → send 2 more → wait → send final (faster, ~2 seconds)
  - **Request Rate Increase**: Contact Resend support to increase from 2 req/sec to higher limit
- **Error Recovery**: Track failed sends per batch, allow retry of failed batches
- **Idempotency**: Use Resend idempotency keys to prevent duplicate sends on retries

#### 8.2 Edge Function Timeouts
- **Request Timeout**: Edge Functions have request timeout limits
- **Solution**: Use `EdgeRuntime.waitUntil()` for background processing - this is the **easiest and recommended approach**
- **Background Tasks**: Can run longer than request timeout, function continues until promise completes
- **No Queue Needed**: Background tasks are sufficient for email sending - queue (pgmq) only needed for complex retry workflows
- **Error Handling**: Use try/catch in background task and handle `unhandledrejection` events

#### 8.3 Data Consistency
- **Transaction Safety**: Create communication record first, then recipients
- **Status Updates**: Use database transactions for atomic updates
- **Idempotency**: Use Resend idempotency keys to prevent duplicate sends

#### 8.4 Security
- **RLS Policies**: All tables protected, authenticated users only
- **API Keys**: Store Resend API key in Edge Function secrets
- **Input Validation**: Validate all inputs before processing
- **Rate Limiting**: Implement client-side rate limiting for UI

### 9. File Structure

```
supabase/
  migrations/
    017_add_communication_tables.sql ✅
    018_add_job_title_to_user_profiles.sql ✅
  functions/
    send-communication/
      default-communication.html ✅ (HTML template)
      index.ts ✅ (Edge Function - sends emails via Resend batch API)
    resend-webhook/
      index.ts ✅ (Edge Function - handles delivery status webhooks)
    import-contacts-csv/ (future)
      index.ts

src/
  pages/
    admin/
      communications/
        index.astro ✅ (dashboard - list communications)
        compose.astro ✅ (compose message page + triggers send function)
      contacts.astro (future - standalone contact management page)
      judges.astro ✅ (includes contact management)
      finalists.astro ✅ (includes contact management)
    api/
      contacts.ts ✅ (CRUD for contacts)
      communications.ts ✅ (list/create communications)
      user-profiles.ts ✅ (list admin profiles for sender selection)
      contacts-with-events.ts ✅ (list contacts with event filtering)
  components/
    admin/
      AdminLayout.astro ✅ (updated with Communications nav item + Supabase URL)
  utils/
    date-checker.ts ✅ (used for dynamic FAQ content - ceremony date check)
```

### 10. Dependencies

**Edge Function Dependencies (Deno imports):**
- `https://deno.land/std@0.168.0/http/server.ts` - HTTP server
- `https://esm.sh/@supabase/supabase-js@2` - Supabase client

**Supabase Edge Function Secrets:**
| Secret | Purpose |
|--------|---------|
| `resend` | Resend API key for sending emails |
| `RESEND_WEBHOOK_SECRET` | Verifies webhook signatures from Resend |
| `SUPABASE_URL` | Supabase project URL (auto-configured) |
| `SUPABASE_ANON_KEY` | Supabase anon key (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for webhook processing |

**Resend Configuration:**
- Domain: `aixr.org` (verified in Resend dashboard)
- From address: `awards@aixr.org`
- Sender format: `{FirstName} from XR Awards <awards@aixr.org>`

### 11. Testing Strategy

1. **Unit Tests**: Test batch chunking logic
2. **Integration Tests**: Test Edge Function with mock Resend API
3. **E2E Tests**: Test full flow from admin UI to email delivery
4. **Load Tests**: Test with 500 emails to verify timeout handling
5. **Error Scenarios**: Test with invalid emails, API failures, network issues

### 12. Monitoring & Observability

- **Sentry**: Error tracking (already in use)
- **Edge Function Logs**: Monitor execution time and memory usage
- **Database Logs**: Monitor query performance
- **Resend Dashboard**: Monitor email delivery rates and bounces

---

## Summary

This communication system provides:
- **Unified contacts table** for judges, finalists, sponsors, and attendees
- **Bulk email sending** via Resend batch API (100 emails per batch, 500ms rate limiting)
- **Delivery tracking** via webhooks (sent, delivered, bounced, opened, clicked)
- **Auto-deactivation** of contacts on permanent bounces or spam complaints
- **Admin UI** with live preview, recipient filtering, and scheduling
- **Secure** with RLS policies (authenticated users only)
- **Audit trail** with full communication history in database

**Email Flow:**
```
Admin Compose → Communication Record → send-communication Edge Function
                                              ↓
                            Resend Batch API (100 per batch)
                                              ↓
                            Webhook Events → resend-webhook Edge Function
                                              ↓
                            Database Update (delivery status)
```

The implementation follows KISS and DRY principles, reusing existing Supabase Edge Functions patterns.

---

## Current Status Summary

### ✅ Completed
- **Phase 1**: Database setup (migrations, tables, RLS policies)
- **Phase 2**: Edge Functions
  - `send-communication` - Sends emails via Resend batch API (100 per batch)
  - `resend-webhook` - Handles all 10 webhook events for delivery tracking
- **Phase 3**: Admin UI (dashboard, compose page, recipient selection, preview, scheduling)
- **Phase 3.5**: User profile photo upload
- **Phase 3.6**: Contact management infrastructure

### ⏳ Remaining Work
- **Phase 4**: Testing
  - Test with small batches (10-50 emails)
  - Test with large batches (500 emails)
  - Error scenario testing
  - Verify webhook delivery tracking
- **Future Enhancements**:
  - CSV import for bulk contact upload
  - `pg_cron` setup for scheduled sends (currently immediate sends only)
  - Additional email templates

---

## Quick Reference

### Send an Email
1. Go to `/admin/communications/compose/`
2. Select recipients using filters
3. Choose sender (from user profiles)
4. Write message content (markdown supported)
5. Preview email in real-time
6. Click "Schedule & Send" → "Send Immediately" → "Confirm & Send"

### Track Email Delivery
- View communication status in `/admin/communications/`
- Individual recipient status stored in `communication_recipients` table
- Statuses: `pending` → `sent` → `delivered` (or `bounced`/`failed`)
- Open and click tracking via `opened_at` and `clicked_at` fields

### Webhook Endpoint
```
https://svcwnedufjiooqonstwv.supabase.co/functions/v1/resend-webhook
```

### Supabase Secrets Required
| Secret Name | Purpose |
|-------------|---------|
| `resend` | Resend API key for sending emails |
| `RESEND_WEBHOOK_SECRET` | Verifies webhook signatures (optional but recommended) |

### Files Created
```
supabase/functions/
  send-communication/
    index.ts              # Main email sending function
    default-communication.html  # HTML email template
  resend-webhook/
    index.ts              # Webhook handler for delivery tracking
```

