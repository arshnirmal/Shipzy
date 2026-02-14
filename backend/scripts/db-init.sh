#!/bin/bash
set -e
export PAGER=cat

echo "🚀 Initialize Database..."

# 1. Extensions
echo "🔌 Enabling Extensions..."
# Default to standard PG env vars if Docker-specific ones are present
export PGUSER="${PGUSER:-$POSTGRES_USER}"
export PGDATABASE="${PGDATABASE:-$POSTGRES_DB}"

# 1. Extensions
echo "🔌 Enabling Extensions..."
psql -v ON_ERROR_STOP=1 <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# 2. Schemas
echo "🏗️  Creating Schemas..."
SCHEMA_DIR="$BACKEND_DIR/src/database/schemas"
# Also check absolute path for Docker
if [ ! -d "$SCHEMA_DIR" ] && [ -d "/src/database/schemas" ]; then
    SCHEMA_DIR="/src/database/schemas"
fi

if [ -d "$SCHEMA_DIR" ]; then
    echo "   Using schemas from: $SCHEMA_DIR"
    for f in "$SCHEMA_DIR"/*.sql; do
        if [ -f "$f" ]; then
            echo "   -- Loading $(basename "$f") --"
            psql -v ON_ERROR_STOP=1 -f "$f"
        fi
    done
else
    echo "⚠️  Schemas directory not found at $SCHEMA_DIR or /src/database/schemas!"
fi

# 3. Functions
echo "⚙️  Installing Functions..."
FUNC_DIR="$BACKEND_DIR/src/database/functions"
# Also check absolute path for Docker
if [ ! -d "$FUNC_DIR" ] && [ -d "/src/database/functions" ]; then
    FUNC_DIR="/src/database/functions"
fi

if [ -d "$FUNC_DIR" ]; then
    echo "   Using functions from: $FUNC_DIR"
    for f in "$FUNC_DIR"/*.sql; do
        if [ -f "$f" ]; then
            echo "   -- Loading $(basename "$f") --"
            psql -v ON_ERROR_STOP=1 -f "$f"
        fi
    done
else
    echo "⚠️  Functions directory not found at $FUNC_DIR or /src/database/functions!"
fi

# 4. User Permissions
echo "🔒 Configure Permissions..."
# Create user if not exists
psql -v ON_ERROR_STOP=0 -c "CREATE USER shipzy_user WITH PASSWORD 'password123';" 2>/dev/null || echo "   User 'shipzy_user' may already exist."

# Grant privileges
psql -v ON_ERROR_STOP=1 <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE "$PGDATABASE" TO shipzy_user;
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
