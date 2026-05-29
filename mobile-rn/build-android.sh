#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-release}"

case "$BUILD_TYPE" in
  release)
    GRADLE_TASK="assembleRelease"
    APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
    ;;
  debug)
    GRADLE_TASK="assembleDebug"
    APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
    ;;
  *)
    echo "Unknown build type: $BUILD_TYPE"
    echo "Usage: ./build-android.sh [release|debug]"
    exit 1
    ;;
esac

if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JAVA_HOME is not set."
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "ANDROID_HOME is not set."
  exit 1
fi

cd "$ROOT_DIR"
npm install
cd android
./gradlew "$GRADLE_TASK"

echo ""
echo "APK generated:"
echo "$APK_PATH"

if [[ "$BUILD_TYPE" == "debug" ]]; then
  echo ""
  echo "Debug APK note:"
  echo "Start Metro with 'npm start' before opening the app, then run 'adb reverse tcp:8081 tcp:8081'."
fi

if command -v adb >/dev/null 2>&1; then
  if adb get-state >/dev/null 2>&1; then
    adb install -r "$APK_PATH"
    echo "Installed on connected Android device/emulator."
  else
    echo "No active adb device. Connect phone/emulator, then run:"
    echo "adb install -r \"$APK_PATH\""
  fi
else
  echo "adb not found. Install Android platform-tools, then run:"
  echo "adb install -r \"$APK_PATH\""
fi
