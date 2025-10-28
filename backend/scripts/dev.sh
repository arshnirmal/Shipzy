#!/bin/bash

# ============================================
# Shipzy Development Environment Starter
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🚀 Shipzy Development Environment   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env from the template${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate required variables
echo -e "${YELLOW}🔍 Validating configuration...${NC}"

if [ "$NGROK_AUTHTOKEN" = "your_ngrok_authtoken_here" ]; then
    echo -e "${RED}❌ ngrok authtoken not configured!${NC}"
    echo -e "${YELLOW}Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
    exit 1
fi

if [ "$FIREBASE_PROJECT_ID" = "your-firebase-project-id" ]; then
    echo -e "${YELLOW}ℹ️  Note: Firebase credentials in .env are kept for backwards compatibility${NC}"
    echo -e "${YELLOW}Backend now uses the service account key file directly${NC}"
fi

# Start services
echo -e "${GREEN}🐳 Starting Docker containers...${NC}"
docker compose -f docker-compose.dev.yml --env-file .env up -d --build

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database initialization...${NC}"
sleep 20

# Create shipzy_user and grant permissions
echo -e "${YELLOW}🔧 Setting up database user...${NC}"
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d shipzy_dev -c "CREATE USER shipzy_user WITH PASSWORD 'password123'; GRANT ALL PRIVILEGES ON DATABASE shipzy_dev TO shipzy_user; ALTER USER shipzy_user CREATEDB;" 2>/dev/null || echo "User may already exist"

# Grant schema permissions
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d shipzy_dev -c "GRANT CREATE ON SCHEMA public TO shipzy_user; GRANT USAGE ON SCHEMA users, logistics, orders, payments, tracking, notifications TO shipzy_user;"

echo -e "${GREEN}✅ Database setup complete!${NC}"

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
echo -n "   "
for i in {1..30}; do
    echo -n "."
    sleep 1
    
    # Check if backend is healthy
    if curl -sf http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
        echo ""
        break
    fi
done

# Check service status
echo -e "\n${GREEN}📊 Service Status:${NC}"
docker compose -f docker-compose.dev.yml ps

# Display access URLs
echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ✅ Environment Ready!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}📍 Access URLs:${NC}"
echo -e "  Local Backend:   ${YELLOW}http://localhost:${BACKEND_PORT}${NC}"
echo -e "  Health Check:    ${YELLOW}http://localhost:${BACKEND_PORT}/health${NC}"
echo -e "  API Docs:        ${YELLOW}http://localhost:${BACKEND_PORT}/api/v1${NC}"
echo -e "  ngrok Dashboard: ${YELLOW}http://localhost:4040${NC}"
echo -e "  Public URL:      ${YELLOW}https://${NGROK_DOMAIN}${NC}"

echo -e "\n${GREEN}💾 Database:${NC}"
echo -e "  Host:     ${YELLOW}localhost:5432${NC}"
echo -e "  Database: ${YELLOW}${POSTGRES_DB}${NC}"
echo -e "  User:     ${YELLOW}${POSTGRES_USER}${NC}"
echo -e "  Password: ${YELLOW}${POSTGRES_PASSWORD}${NC}"
echo -e "  Connect:  ${YELLOW}psql -h localhost -U ${POSTGRES_USER} -d ${POSTGRES_DB}${NC}"

echo -e "\n${GREEN}🔍 Useful Commands:${NC}"
echo -e "  View logs:        ${YELLOW}./scripts/logs.sh backend${NC}"
echo -e "  Database shell:   ${YELLOW}./scripts/db-shell.sh${NC}"
echo -e "  Stop services:    ${YELLOW}./scripts/stop.sh${NC}"
echo -e "  Reset database:   ${YELLOW}./scripts/reset-db.sh${NC}"

echo -e "\n${GREEN}🧪 Test API:${NC}"
echo -e "  ${YELLOW}curl http://localhost:${BACKEND_PORT}/health${NC}"
echo -e "  ${YELLOW}curl https://${NGROK_DOMAIN}/health${NC}"

echo ""

