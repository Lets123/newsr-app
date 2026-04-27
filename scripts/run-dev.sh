#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-5173}"

echo "Installing dependencies..."
npm install

echo "Starting Vite on network (host 0.0.0.0) at port $PORT..."
npm run dev -- --host 0.0.0.0 --port "$PORT"
