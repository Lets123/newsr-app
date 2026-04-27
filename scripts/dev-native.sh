#!/bin/bash
# Start React Native development

cd "$(dirname "$0")/../mobile-rn"

echo "📱 Starting React Native development..."
echo ""
echo "Make sure you have:"
echo "  1. Android emulator running OR physical device connected"
echo "  2. Run this in a separate terminal if needed:"
echo "     adb reverse tcp:8081 tcp:8081"
echo ""

npm run android
