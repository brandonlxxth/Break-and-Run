#!/bin/bash

# Script to automatically increment version code and build release bundle
# Usage: ./increment-version.sh [--build]

set -e

BUILD_FILE="app/build.gradle.kts"
BUILD_AFTER=false

# Check if --build flag is provided
if [[ "$1" == "--build" ]]; then
    BUILD_AFTER=true
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Incrementing version code...${NC}"

# Extract current version code
CURRENT_VERSION=$(grep -E "versionCode\s*=" "$BUILD_FILE" | grep -oE "[0-9]+" | head -1)

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${YELLOW}Error: Could not find versionCode in $BUILD_FILE${NC}"
    exit 1
fi

# Increment version code
NEW_VERSION=$((CURRENT_VERSION + 1))

echo -e "${YELLOW}Current version code: $CURRENT_VERSION${NC}"
echo -e "${GREEN}New version code: $NEW_VERSION${NC}"

# Update version code in build.gradle.kts
# Use sed to replace the versionCode line
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/versionCode = $CURRENT_VERSION/versionCode = $NEW_VERSION/" "$BUILD_FILE"
else
    # Linux
    sed -i "s/versionCode = $CURRENT_VERSION/versionCode = $NEW_VERSION/" "$BUILD_FILE"
fi

echo -e "${GREEN}✓ Version code updated to $NEW_VERSION${NC}"

# Optionally build the release bundle
if [ "$BUILD_AFTER" = true ]; then
    echo -e "${BLUE}Building release bundle...${NC}"
    ./gradlew bundleRelease
    echo -e "${GREEN}✓ Release bundle built successfully!${NC}"
    echo -e "${YELLOW}Location: app/build/outputs/bundle/release/app-release.aab${NC}"
else
    echo -e "${YELLOW}Tip: Run with --build flag to automatically build after incrementing${NC}"
    echo -e "${YELLOW}Example: ./increment-version.sh --build${NC}"
fi




