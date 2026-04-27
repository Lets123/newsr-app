#!/bin/bash
# Start web development server accessible on phone

cd "$(dirname "$0")/.."

echo "🌐 Starting web dev server..."
echo "📱 Your phone can access this at: http://YOUR_COMPUTER_IP:5173"
echo ""
echo "To find your computer's IP:"
echo "  Linux/Mac: ifconfig | grep inet"
echo "  Windows: ipconfig"
echo ""

npm run dev:network
