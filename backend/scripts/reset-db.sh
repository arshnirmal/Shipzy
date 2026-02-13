#!/bin/bash

# ============================================
# Reset Database (CAUTION: Deletes all data)
# ============================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo -e "${RED}║         ⚠️  DATABASE RESET ⚠️          ║${NC}"
echo -e "${RED}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}This will permanently delete ALL data:${NC}"
echo -e "  • All users"
echo -e "  • All orders"
echo -e "  • All tracking data"
echo -e "  • Everything!"
echo ""
read -p "Type 'DELETE' to confirm: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo -e "${YELLOW}❌ Aborted${NC}"
    exit 0
fi

echo -e "${YELLOW}🛑 Stopping services...${NC}"
docker compose -f docker-compose.dev.yml down

echo -e "${YELLOW}🗑️  Removing database volume...${NC}"
docker volume rm shipzy-postgres-data-dev || true

echo -e "${YELLOW}🚀 Starting fresh database...${NC}"
docker compose -f docker-compose.dev.yml up -d postgres

echo -e "${YELLOW}⏳ Waiting for database initialization...${NC}"
sleep 20



echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker compose -f docker-compose.dev.yml up -d

echo -e "${GREEN}✅ Database reset complete!${NC}"
echo -e "${GREEN}Fresh database is ready with schema and functions installed.${NC}"

