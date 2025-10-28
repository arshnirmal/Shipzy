-- ============================================
-- Initialize PostgreSQL Extensions
-- ============================================

\echo '🔧 Installing PostgreSQL extensions...'

-- Enable PostGIS for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify PostGIS installation
SELECT postgis_full_version();

\echo '✅ Extensions installed successfully'
\echo ''

