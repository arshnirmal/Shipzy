#!/bin/sh
set -e
export PAGER=cat

echo "🚀 Initialize Database..."

# Database Configuration - use environment variables directly
export PGUSER="${POSTGRES_USER:-$DB_USER}"
export PGDATABASE="${POSTGRES_DB:-$DB_NAME}"
export PGPASSWORD="${POSTGRES_PASSWORD:-$DB_PASSWORD}"

# Inside Docker init, use Unix socket (default) unless explicitly set to TCP
if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
    export PGHOST="$DB_HOST"
    export PGPORT="${DB_PORT}"
else
    # Use Unix socket for Docker init (default behavior)
    unset PGHOST
    unset PGPORT
fi

# Validate required environment variables
if [ -z "$PGDATABASE" ] || [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ]; then
    echo "❌ ERROR: Required database environment variables are not set:"
    echo "   PGDATABASE: ${PGDATABASE:-'<empty>'}"
    echo "   PGUSER: ${PGUSER:-'<empty>'}"
    echo "   PGPASSWORD: ${PGPASSWORD:-'<empty>'}"
    exit 1
fi

echo "📍 Database Configuration:"
if [ -n "$PGHOST" ]; then
    echo "   Host: $PGHOST"
    echo "   Port: $PGPORT"
else
    echo "   Host: Unix Socket (default)"
fi
echo "   Database: $PGDATABASE"
echo "   User: $PGUSER"

SCRIPT_DIR="$( cd "$( dirname "$0" )" &> /dev/null && pwd )"
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

# 2. Drizzle migrations (tables, enums, etc.) — required before SQL functions
#    that reference schema types (e.g. public.user_role). Matches db-deploy.ts order.
echo "📦 Applying schema (Drizzle migrations)..."
MIGRATIONS_DIR="$BACKEND_DIR/src/database/migrations"
if [ ! -d "$MIGRATIONS_DIR" ] && [ -d "/src/database/migrations" ]; then
    MIGRATIONS_DIR="/src/database/migrations"
fi

if [ -d "$MIGRATIONS_DIR" ]; then
    echo "   Migrations directory: $MIGRATIONS_DIR"
    psql -v ON_ERROR_STOP=1 <<-EOSQL
	CREATE TABLE IF NOT EXISTS _deployment_log (
	    id SERIAL PRIMARY KEY,
	    filename VARCHAR(255) UNIQUE NOT NULL,
	    hash VARCHAR(64),
	    executed_at TIMESTAMPTZ DEFAULT NOW()
	);
EOSQL
    psql -v ON_ERROR_STOP=1 -c "INSERT INTO _deployment_log (filename) VALUES ('setup.sql') ON CONFLICT (filename) DO NOTHING;"

    for m in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
        [ -f "$m" ] || continue
        base=$(basename "$m")
        applied=$(psql -tAc "SELECT COUNT(*)::int FROM _deployment_log WHERE filename = '$base'")
        if [ "$applied" != "0" ]; then
            echo "   ⏭️  Skipping (already applied): $base"
            continue
        fi
        echo "   Applying: $base"
        psql -v ON_ERROR_STOP=1 -f "$m"
        psql -v ON_ERROR_STOP=1 -c "INSERT INTO _deployment_log (filename) VALUES ('$base');"
    done
else
    echo "⚠️  Migrations directory not found at $MIGRATIONS_DIR or /src/database/migrations!"
fi

# 3. Functions (Always run / Replace)
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
# Create user if not exists using configured password
psql -v ON_ERROR_STOP=0 -c "CREATE USER $PGUSER WITH PASSWORD '$PGPASSWORD';" 2>/dev/null || echo "   User '$PGUSER' may already exist."

# Grant privileges
psql -v ON_ERROR_STOP=1 <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE "$PGDATABASE" TO $PGUSER;
    ALTER USER $PGUSER CREATEDB;
    GRANT CREATE ON SCHEMA public TO $PGUSER;
    -- Try to grant usage on common schemas if they exist
    DO \$\$
    BEGIN
        EXECUTE 'GRANT USAGE ON SCHEMA users, logistics, orders, payments, tracking, notifications TO $PGUSER';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Some schemas might not exist yet, skipping grant for them';
    END
    \$\$;
EOSQL

echo ""
echo "✅ Database Initialization Complete!"
echo "📝 Note: Run db:deploy after init to refresh functions, apply any new migrations, and load master-data:"
echo "   pnpm run db:deploy"