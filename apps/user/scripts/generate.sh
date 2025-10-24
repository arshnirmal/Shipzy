#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Running code generation...${NC}"

# Clean old generated files
echo -e "${BLUE}🧹 Cleaning old files...${NC}"
flutter packages pub run build_runner clean

# Run code generation
echo -e "${BLUE}⚙️  Generating code...${NC}"
flutter packages pub run build_runner build --delete-conflicting-outputs

echo -e "${GREEN}✅ Code generation complete!${NC}"
