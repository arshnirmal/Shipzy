#!/bin/bash

# ============================================
# Stop Shipzy Development Environment
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Shipzy Development Environment...${NC}"

docker compose -f docker-compose.dev.yml down

echo -e "${GREEN}✅ All services stopped${NC}"
echo -e "${YELLOW}💡 Data is preserved in volumes. Use './scripts/dev.sh' to restart.${NC}"

