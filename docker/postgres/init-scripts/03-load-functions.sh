#!/bin/bash
# ============================================
# Load all SQL function files
# This script runs all .sql files in the functions directory
# ============================================

set -e

echo "⚙️  Installing stored functions..."

# Load all function files in order
for file in /docker-entrypoint-initdb.d/functions/*.sql; do
    if [ -f "$file" ]; then
        echo "   Loading $(basename $file)..."
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
    fi
done

echo "✅ All stored functions installed successfully"
echo ""

