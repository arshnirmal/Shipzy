#!/bin/bash
# Wait for database to be ready and deploy migrations
# This runs after the backend container starts

set -e

echo "⏳ Waiting for database to be ready..."

# Wait for postgres to be ready (max 60 seconds)
MAX_WAIT=60
WAITED=0
until PGPASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD}}" psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-${POSTGRES_USER}}" -d "${DB_NAME:-${POSTGRES_DB}}" -c '\q' 2>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ Database not ready after ${MAX_WAIT}s, giving up"
    exit 1
  fi
  echo "   Database not ready, waiting... (${WAITED}s/${MAX_WAIT}s)"
  sleep 2
  WAITED=$((WAITED + 2))
done

echo "✅ Database is ready!"

# Deploy migrations using Node.js script (more reliable)
if command -v npm &> /dev/null; then
    echo "📦 Deploying migrations..."
    npm run db:deploy || {
        echo "⚠️  Migrations deployment failed or no migrations found."
        echo "   This is OK if you haven't generated migrations yet."
        echo "   Run: npm run db:generate && npm run db:deploy"
    }
else
    # Fallback to bash script if npm not available
    if [ -f "/scripts/db-init-migrations.sh" ]; then
        echo "📦 Deploying migrations (bash fallback)..."
        bash /scripts/db-init-migrations.sh || {
            echo "⚠️  Migrations deployment failed or no migrations found."
        }
    fi
fi

echo "✅ Database setup complete!"
