#!/bin/bash

# ============================================
# View Service Logs
# Usage: ./scripts/logs.sh [service]
# Services: backend, postgres, ngrok
# ============================================

SERVICE=${1:-backend}

echo "📋 Viewing logs for: $SERVICE"
echo "Press Ctrl+C to exit"
echo ""

docker compose -f docker-compose.dev.yml logs -f --tail=100 $SERVICE

