-- 01-extensions-and-schemas.sql
-- Extensions and schema creation
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify PostGIS
SELECT
    postgis_full_version();

-- [SAFE MODE] Destructive DROPs removed for production safety
-- To reset the database in development, use scripts/reset-db.sh

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;

CREATE SCHEMA IF NOT EXISTS logistics;

CREATE SCHEMA IF NOT EXISTS orders;

CREATE SCHEMA IF NOT EXISTS payments;

CREATE SCHEMA IF NOT EXISTS tracking;

CREATE SCHEMA IF NOT EXISTS notifications;