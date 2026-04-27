#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-5173}"

echo "Building production assets..."
npm run build

echo "Starting preview server bound to network at port $PORT..."
npm run preview -- --host 0.0.0.0 --port "$PORT"
