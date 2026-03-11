#!/bin/bash
set -e
export PAGER=cat

echo "🚀 Initialize Database..."

# Default to standard PG env vars if Docker-specific ones are present
export PGUSER="${PGUSER:-$DB_USER}"
export PGDATABASE="${PGDATABASE:-$DB_NAME}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
# Avoid "//path" when running in Docker (SCRIPT_DIR=/docker-entrypoint-initdb.d → BACKEND_DIR=/)
BACKEND_DIR="${BACKEND_DIR%/}"

# 1. Run Setup SQL (Extensions & Schemas)
echo "🔧 Running Setup (Extensions & Schemas)..."
SETUP_SQL="$BACKEND_DIR/src/database/setup.sql"
# Also check absolute path for Docker
if [ ! -f "$SETUP_SQL" ] && [ -f "/src/database/setup.sql" ]; then
    SETUP_SQL="/src/database/setup.sql"
fi

if [ -f "$SETUP_SQL" ]; then
    echo "   Loading: setup.sql"
    psql -v ON_ERROR_STOP=1 -f "$SETUP_SQL"
else
    echo "⚠️  Setup SQL not found at $SETUP_SQL or /src/database/setup.sql!"
fi

# 2. Functions (Always run / Replace)
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

# 3. User Permissions
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

echo ""
echo "✅ Database Initialization Complete!"
echo "📝 Note: Migrations will be deployed when backend starts or run manually:"
echo "   npm run db:deploy"