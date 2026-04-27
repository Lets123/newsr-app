#!/usr/bin/env bash
set -euo pipefail

# Collects network and server diagnostics useful for troubleshooting Vite accessibility from other devices.
OUT_DIR="diagnostics"
OUT_FILE="$OUT_DIR/diagnostics-$(date +"%Y%m%d-%H%M%S").txt"
mkdir -p "$OUT_DIR"

echo "Collecting diagnostics to $OUT_FILE"
{
  echo "=== date ==="
  date
  echo
  echo "=== current directory ==="
  pwd
  echo
  echo "=== Vite / node processes ==="
  ps aux | grep -E 'vite|node' | grep -v grep || true
  echo
  echo "=== Listening TCP ports (ss) ==="
  ss -tlnp 2>/dev/null || true
  echo
  echo "=== lsof listen on 5173 ==="
  sudo lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep 5173 || true
  echo
  echo "=== curl localhost:5173 ==="
  curl -I http://localhost:5173 2>/dev/null || true
  echo
  echo "=== machine primary IP (hostname -I) ==="
  hostname -I 2>/dev/null || true
  echo
  echo "=== curl machineIP:5173 ==="
  IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
  if [ -n "$IP" ]; then
    curl -I "http://$IP:5173" 2>/dev/null || true
  else
    echo "No IP detected"
  fi
  echo
  echo "=== ip addr ==="
  ip addr show 2>/dev/null || true
  echo
  echo "=== ip route ==="
  ip route 2>/dev/null || true
  echo
  echo "=== ufw status ==="
  sudo ufw status verbose 2>/dev/null || true
  echo
  echo "=== test curl from local host to network URL ==="
  if [ -n "$IP" ]; then
    curl -I "http://$IP:5173" 2>/dev/null || true
  fi
  echo
  echo "=== end ==="
} > "$OUT_FILE"

echo "Diagnostics saved to $OUT_FILE"
echo
echo "Preview (first 200 lines):"
head -n 200 "$OUT_FILE" || true

echo
echo "If you want, run:"
echo "  cat $OUT_FILE"
echo "and paste the contents here, or attach the file."
