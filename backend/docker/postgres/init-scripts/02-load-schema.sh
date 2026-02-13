#!/bin/bash
# ============================================
# Load database schemas
# This script loads the modular database schemas
# ============================================

set -e

echo "🏗️  Creating database schema (split files)..."

# Load all SQL files from /tmp/schemas in lexicographic order
for f in /tmp/schemas/*.sql; do
  echo "-- Running $f --"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "✅ Database schema created successfully"
echo ""

