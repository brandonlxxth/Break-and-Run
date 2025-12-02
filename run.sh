#!/bin/bash

# Script to run the Pool Scoreboard app in Android emulator

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Android Emulator...${NC}"

# Start emulator in background (if not already running)
EMULATOR_NAME="Pixel_9_Pro"
EMULATOR_PATH="$ANDROID_HOME/emulator/emulator"

# Check if emulator is already running
if adb devices | grep -q "emulator"; then
    echo -e "${YELLOW}Emulator is already running${NC}"
else
    echo "Starting emulator: $EMULATOR_NAME"
    $EMULATOR_PATH -avd $EMULATOR_NAME &
    EMULATOR_PID=$!
    
    echo "Waiting for emulator to boot..."
    # Wait for emulator to be ready
    adb wait-for-device
    echo "Waiting for boot to complete..."
    while [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" != "1" ]; do
        sleep 2
    done
    echo -e "${GREEN}Emulator is ready!${NC}"
fi

echo -e "${GREEN}Building and installing app (debug mode)...${NC}"

# Build and install the debug APK initially
./gradlew installDebug

echo -e "${GREEN}Launching app...${NC}"

# Launch the app
adb shell am start -n com.brandonlxxth.breakandrun/.MainActivity

echo -e "${GREEN}App launched! Starting continuous build mode...${NC}"
echo -e "${YELLOW}Watching for file changes. Press Ctrl+C to stop.${NC}"
echo ""

# Run in continuous mode - will rebuild and reinstall on file changes
./gradlew --continuous installDebug

