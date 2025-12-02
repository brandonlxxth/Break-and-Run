#!/bin/bash

# Script to build the Pool Scoreboard app (for testing build stability)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Pool Scoreboard app...${NC}"

# Clean build (optional - comment out if you want incremental builds)
# echo "Cleaning previous build..."
# ./gradlew clean

# Build the debug APK
echo "Building debug APK..."
if ./gradlew assembleDebug; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    echo "APK location: app/build/outputs/apk/debug/app-debug.apk"
    exit 0
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi


