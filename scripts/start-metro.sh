#!/bin/bash
# Start Metro bundler for React Native development

cd "$(dirname "$0")/../mobile-rn"

echo "🔧 Starting Metro bundler..."
echo "Keep this running in a separate terminal while developing Android app"
echo ""

npm start
