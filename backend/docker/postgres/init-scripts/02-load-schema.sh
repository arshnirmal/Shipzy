#!/bin/bash
# ============================================
# Load schema.sql
# This script loads the main database schema
# ============================================

set -e

echo "🏗️  Creating database schema..."

# Load the schema file
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "/docker-entrypoint-initdb.d/02-schema.sql"

echo "✅ Database schema created successfully"
echo ""
