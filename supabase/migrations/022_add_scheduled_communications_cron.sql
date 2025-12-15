-- Migration: 022_add_scheduled_communications_cron
-- Created: 2025-12-15
-- Description: Add pg_cron job to process scheduled communications every minute
--
-- =============================================
-- SETUP INSTRUCTIONS (Do these BEFORE running this migration)
-- =============================================
-- 
-- STEP 1: Enable extensions in Supabase Dashboard
--   Go to: Database > Extensions > Enable both pg_cron and pg_net
--
-- STEP 2: Store your service_role key in Vault (run in SQL Editor)
--   The service_role key is found at: Dashboard > Settings > API > service_role (reveal)
--   
--   Run this SQL (replace <YOUR_SERVICE_ROLE_KEY> with actual key):
--   SELECT vault.create_secret('<YOUR_SERVICE_ROLE_KEY>', 'service_role_key');
--
-- NOTE on API Keys:
--   - service_role (JWT format) is legacy but still works with Edge Functions
--   - sb_secret_... (new format) requires --no-verify-jwt flag on Edge Function deploy
--   - For pg_cron → Edge Function calls, service_role is simpler to use
--
-- STEP 3: Run this migration (or execute the cron.schedule SQL below manually)
--
-- =============================================

-- Enable extensions (must be enabled in Dashboard first)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================
-- SCHEDULE CRON JOB
-- =============================================
-- Runs every minute to check for scheduled communications where:
--   scheduled_at <= NOW() AND status = 'scheduled'
-- Then triggers the send-communication Edge Function for each

SELECT cron.schedule(
  'process-scheduled-communications', -- job name (use this to unschedule later)
  '* * * * *', -- cron expression: every minute
  $$
  SELECT net.http_post(
    url := 'https://svcwnedufjiooqonstwv.supabase.co/functions/v1/process-scheduled-communications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- =============================================
-- MONITORING QUERIES
-- =============================================
-- View all scheduled cron jobs:
--   SELECT * FROM cron.job;
--
-- View recent job runs (check for errors):
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Check HTTP responses from pg_net:
--   SELECT * FROM net._http_response ORDER BY created DESC LIMIT 20;
--
-- Manually trigger the cron job for testing:
--   SELECT net.http_post(
--     url := 'https://svcwnedufjiooqonstwv.supabase.co/functions/v1/process-scheduled-communications',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
--     ),
--     body := '{}'::jsonb
--   );
--
-- Unschedule the job if needed:
--   SELECT cron.unschedule('process-scheduled-communications');

