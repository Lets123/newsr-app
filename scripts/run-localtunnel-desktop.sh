#!/usr/bin/env bash
set -euo pipefail

# Launch localtunnel in a visible terminal window so you can click instead of typing.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if command -v gnome-terminal >/dev/null 2>&1; then
  gnome-terminal -- bash -c "./scripts/run-localtunnel.sh; echo; read -n1 -r -p 'Press any key to close...'")
  exit 0
fi

if command -v xterm >/dev/null 2>&1; then
  xterm -e bash -ic "./scripts/run-localtunnel.sh; echo; read -n1 -r -p 'Press any key to close...'" &
  exit 0
fi

echo "No supported terminal emulator (gnome-terminal or xterm) found. Run ./scripts/run-localtunnel.sh manually."
