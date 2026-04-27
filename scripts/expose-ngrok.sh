#!/usr/bin/env bash
set -euo pipefail

# Expose a local port via ngrok using npx (no global install required).
# Usage: PORT=5173 ./scripts/expose-ngrok.sh

PORT="${PORT:-5173}"

echo "Starting ngrok tunnel for http://localhost:$PORT"

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required. Install Node.js/npm or run ngrok manually." >&2
  exit 1
fi

echo "Note: this will prompt for ngrok authtoken setup if required."
npx ngrok http "$PORT"
