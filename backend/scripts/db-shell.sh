#!/bin/bash

# ============================================
# Open PostgreSQL Shell
# ============================================

# Load environment
export $(cat .env.dev | grep -v '^#' | xargs)

echo "🗄️  Opening PostgreSQL shell..."
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo ""

docker exec -it shipzy-postgres-dev psql -U $POSTGRES_USER -d $POSTGRES_DB

