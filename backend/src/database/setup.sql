-- ========================================
-- SHIPZY - Database Setup (Extensions & Schemas)
-- This file contains only extensions and schema creation
-- All table definitions come from Drizzle migrations
-- ========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify PostGIS
SELECT postgis_full_version();

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS tracking;
CREATE SCHEMA IF NOT EXISTS notifications;

-- Optional extension for retention jobs.
-- pg_cron may be unavailable in some environments (shared_preload setting).
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension unavailable: %', SQLERRM;
END $$;

-- Retention policy for high-volume tracking events (30 days).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'shipzy_tracking_events_retention';

    PERFORM cron.schedule(
      'shipzy_tracking_events_retention',
      '15 3 * * *',
      'DELETE FROM tracking.events WHERE "timestamp" < NOW() - INTERVAL ''30 days'''
    );
  END IF;
END $$;
