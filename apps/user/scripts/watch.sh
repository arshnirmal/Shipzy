#!/bin/bash

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}👀 Watching for changes...${NC}"

flutter packages pub run build_runner watch --delete-conflicting-outputs
