#!/bin/bash
# Run migrations after database is initialized
# This can be called manually or from docker-compose

set -e
export PAGER=cat

export PGUSER="${PGUSER:-$POSTGRES_USER}"
export PGDATABASE="${PGDATABASE:-$POSTGRES_DB}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "📦 Deploying Migrations..."

# Check if deployment log table exists
psql -v ON_ERROR_STOP=0 <<-EOSQL
    CREATE TABLE IF NOT EXISTS _deployment_log (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        hash VARCHAR(64),
        executed_at TIMESTAMPTZ DEFAULT NOW()
    );
EOSQL

# Deploy migrations
MIGRATIONS_DIR="$BACKEND_DIR/src/database/migrations"
if [ ! -d "$MIGRATIONS_DIR" ] && [ -d "/src/database/migrations" ]; then
    MIGRATIONS_DIR="/src/database/migrations"
fi

if [ -d "$MIGRATIONS_DIR" ]; then
    # Get list of SQL files, sorted
    MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)
    
    if [ -z "$MIGRATION_FILES" ]; then
        echo "   ⚠️  No migrations found. Run: npm run db:generate"
    else
        for migration_file in $MIGRATION_FILES; do
            filename=$(basename "$migration_file")
            
            # Check if already executed
            EXISTS=$(psql -t -c "SELECT COUNT(*) FROM _deployment_log WHERE filename = '$filename';" 2>/dev/null || echo "0")
            
            if [ "$EXISTS" -eq 0 ]; then
                echo "   Running: $filename"
                # Read migration SQL
                MIGRATION_SQL=$(cat "$migration_file")
                
                # Execute in transaction
                psql -v ON_ERROR_STOP=1 <<-EOSQL
                    BEGIN;
                    $MIGRATION_SQL
                    INSERT INTO _deployment_log (filename) VALUES ('$filename');
                    COMMIT;
EOSQL
                echo "   ✅ Success: $filename"
            else
                echo "   ⏭️  Skipping: $filename (already executed)"
            fi
        done
    fi
else
    echo "   ⚠️  Migrations directory not found. Run: npm run db:generate"
fi

echo "✅ Migrations deployment complete!"
