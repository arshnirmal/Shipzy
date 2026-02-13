#!/bin/bash
set -e

echo "🚀 Initialize Database..."

# 1. Extensions
echo "🔌 Enabling Extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

# 2. Schemas
echo "🏗️  Creating Schemas..."
# Iterate through all SQL files in /src/database/schemas
if [ -d "/src/database/schemas" ]; then
    for f in /src/database/schemas/*.sql; do
        if [ -f "$f" ]; then
            echo "   -- Loading $(basename "$f") --"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
        fi
    done
else
    echo "⚠️  /src/database/schemas directory not found!"
fi

# 3. Functions
echo "⚙️  Installing Functions..."
if [ -d "/src/database/functions" ]; then
    for f in /src/database/functions/*.sql; do
        if [ -f "$f" ]; then
            echo "   -- Loading $(basename "$f") --"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
        fi
    done
else
    echo "⚠️  /src/database/functions directory not found!"
fi

# 4. User Permissions (from old dev.sh logic)
echo "🔒 Configure Permissions..."
# Create user if not exists (idempotent check is complex in bash, but CREATE USER throws error if exists, catch it)
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE USER shipzy_user WITH PASSWORD 'password123';" 2>/dev/null || echo "   User 'shipzy_user' may already exist."

# Grant privileges
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_DB" TO shipzy_user;
    ALTER USER shipzy_user CREATEDB;
    GRANT CREATE ON SCHEMA public TO shipzy_user;
    -- Try to grant usage on common schemas if they exist
    DO \$\$
    BEGIN
        EXECUTE 'GRANT USAGE ON SCHEMA users, logistics, orders, payments, tracking, notifications TO shipzy_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Some schemas might not exist yet, skipping grant for them';
    END
    \$\$;
EOSQL

echo "✅ Database Initialization Complete!"
