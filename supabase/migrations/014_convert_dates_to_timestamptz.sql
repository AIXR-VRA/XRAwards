-- Migration: 014_convert_dates_to_timestamptz
-- Created: 2025
-- Description: Convert date fields to TIMESTAMPTZ for proper timezone handling

-- =============================================
-- CONVERT DATE FIELDS TO TIMESTAMPTZ
-- =============================================

-- Convert all date fields to TIMESTAMPTZ with UTC midnight as default
ALTER TABLE event_details 
  ALTER COLUMN nominations_open TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN nominations_open IS NULL THEN NULL 
      ELSE (nominations_open::text || ' 00:00:00+00')::timestamptz 
    END,
  ALTER COLUMN nominations_close TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN nominations_close IS NULL THEN NULL 
      ELSE (nominations_close::text || ' 00:00:00+00')::timestamptz 
    END,
  ALTER COLUMN finalists_announced TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN finalists_announced IS NULL THEN NULL 
      ELSE (finalists_announced::text || ' 00:00:00+00')::timestamptz 
    END,
  ALTER COLUMN judging_period_start TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN judging_period_start IS NULL THEN NULL 
      ELSE (judging_period_start::text || ' 00:00:00+00')::timestamptz 
    END,
  ALTER COLUMN judging_period_end TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN judging_period_end IS NULL THEN NULL 
      ELSE (judging_period_end::text || ' 00:00:00+00')::timestamptz 
    END,
  ALTER COLUMN awards_ceremony TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN awards_ceremony IS NULL THEN NULL 
      ELSE (awards_ceremony::text || ' 00:00:00+00')::timestamptz 
    END;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN event_details.nominations_open IS 'Date when nominations open (UTC midnight)';
COMMENT ON COLUMN event_details.nominations_close IS 'Date when nominations close (UTC midnight)';
COMMENT ON COLUMN event_details.finalists_announced IS 'Date when finalists are announced (UTC midnight)';
COMMENT ON COLUMN event_details.judging_period_start IS 'Start date of judging period (UTC midnight)';
COMMENT ON COLUMN event_details.judging_period_end IS 'End date of judging period (UTC midnight)';
COMMENT ON COLUMN event_details.awards_ceremony IS 'Date of the awards ceremony (UTC midnight)';
