#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5173}"

echo "Starting localtunnel for http://localhost:$PORT"

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required. Install Node.js/npm." >&2
  exit 1
fi

# Try to start localtunnel; prints the public URL when ready
npx localtunnel --port "$PORT"
