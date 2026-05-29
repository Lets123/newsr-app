# Inventory Mobile (React Native)

This is the real React Native project for the Android app. Use this folder for Metro, Android builds, and APK generation.

## Two Ways to Test

### Option 1: Web Version (Test on Phone via Browser)
**Best for quick testing without building APK**

1. Open a terminal in the root directory:
   ```bash
   cd /home/yuuta/Downloads/newsr-app
   ```
2. Start the web dev server:
   ```bash
   npm run dev:network
   ```
   Or use the convenience script:
   ```bash
   ./scripts/dev-web.sh
   ```
3. On your phone, open a browser and navigate to `http://YOUR_COMPUTER_IP:5173`
   - Find your computer IP: `ifconfig | grep inet` (Linux/Mac) or `ipconfig` (Windows)
   - Make sure your phone and computer are on the same network

### Option 2: Native Android App (Real React Native)
**Best for actual mobile testing and final release APK**

#### Live Development (with Metro bundler):
1. Open a terminal here:
   ```bash
   cd /home/yuuta/Downloads/newsr-app/mobile-rn
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Metro in its own terminal:
   ```bash
   npm start
   ```
   Or use the convenience script:
   ```bash
   ./scripts/start-metro.sh
   ```
4. In a second terminal, run the Android app:
   ```bash
   npm run android
   ```
   Or use the convenience script:
   ```bash
   ./scripts/dev-native.sh
   ```

#### Physical Device Setup:
If using a physical Android device, run this before launching the app:
```bash
adb reverse tcp:8081 tcp:8081
```

## Quick Start (Native)

1. Open a terminal here:
   `cd /home/yuuta/Downloads/newsr-app/mobile-rn`
2. Install dependencies:
   `npm install`
3. Start Metro in its own terminal:
   `npm start`
4. In a second terminal, run the Android app:
   `npm run android`

If you are using a physical Android device, also run:
`adb reverse tcp:8081 tcp:8081`

## Standalone APK

To build an APK that works without Metro:

1. Ensure `JAVA_HOME` and `ANDROID_HOME` are set.
2. Run:
   `./build-android.sh`

This now creates a release APK with the JavaScript bundle included:
`/home/yuuta/Downloads/newsr-app/mobile-rn/android/app/build/outputs/apk/release/app-release.apk`

To build a debug APK instead:
`./build-android.sh debug`

## Red Screen: "Unable to load script"

That error usually means one of these:

- You opened a debug APK without Metro running.
- Metro was started from the wrong folder.
- A physical device is not forwarding port `8081`.

For live development, make sure all three are true:

1. You are inside `mobile-rn/`.
2. `npm start` is running.
3. On a physical device, `adb reverse tcp:8081 tcp:8081` succeeds before opening the app.

For a phone-installable APK, use the release build from `./build-android.sh`.
