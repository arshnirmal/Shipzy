-- 01-extensions-and-schemas.sql
-- Extensions and schema creation
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify PostGIS
SELECT
    postgis_full_version();

-- Drop existing schemas (for clean re-run in development)
DROP SCHEMA IF EXISTS users CASCADE;

DROP SCHEMA IF EXISTS logistics CASCADE;

DROP SCHEMA IF EXISTS orders CASCADE;

DROP SCHEMA IF EXISTS payments CASCADE;

DROP SCHEMA IF EXISTS tracking CASCADE;

DROP SCHEMA IF EXISTS notifications CASCADE;

-- Drop public tables
DROP TABLE IF EXISTS public.user_roles CASCADE;

DROP TABLE IF EXISTS public.vehicle_categories CASCADE;

DROP TABLE IF EXISTS public.order_statuses CASCADE;

DROP TABLE IF EXISTS public.payment_methods CASCADE;

DROP TABLE IF EXISTS public.payment_statuses CASCADE;

DROP TABLE IF EXISTS public.assignment_statuses CASCADE;

DROP TABLE IF EXISTS public.notification_channels CASCADE;

DROP TABLE IF EXISTS public.notification_statuses CASCADE;

DROP TABLE IF EXISTS public.labels CASCADE;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;

CREATE SCHEMA IF NOT EXISTS logistics;

CREATE SCHEMA IF NOT EXISTS orders;

CREATE SCHEMA IF NOT EXISTS payments;

CREATE SCHEMA IF NOT EXISTS tracking;

CREATE SCHEMA IF NOT EXISTS notifications;