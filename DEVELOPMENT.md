# Development Guide: Web vs Native

This project supports both web and native React Native development. Choose the approach that works best for your testing needs.

## Quick Choice Guide

| Need | Use | Command |
|------|-----|---------|
| Quick testing on phone browser | Web | `npm run dev:network` or `./scripts/dev-web.sh` |
| Testing native Android features | Native | `npm start` + `npm run android` or `./scripts/dev-native.sh` |
| Build production APK | Native | `./build-android.sh` in `mobile-rn/` |

---

## 🌐 Web Development (Browser on Phone)

**Best for:** Rapid iteration, no APK build needed, instant reloading

### Start the Web Server:

From the root directory:
```bash
npm run dev:network
```

Or use the convenience script:
```bash
./scripts/dev-web.sh
```

### Access on Your Phone:

1. **Find your computer's IP address:**
   ```bash
   # Linux/Mac:
   ifconfig | grep inet
   
   # Windows:
   ipconfig
   ```

2. **On your phone** (same network), open a browser and go to:
   ```
   http://YOUR_COMPUTER_IP:5173
   ```

3. **Changes are hot-reloaded** automatically!

---

## 📱 Native React Native Development

**Best for:** Testing native Android functionality, final production builds

### Prerequisites:
- Android SDK installed
- Emulator running OR physical device connected via USB

### Setup:

1. Navigate to the mobile-rn folder:
   ```bash
   cd mobile-rn
   npm install
   ```

### Development Workflow:

**Terminal 1 - Start Metro (the bundler):**
```bash
npm start
```
Or:
```bash
./scripts/start-metro.sh
```

**Terminal 2 - Deploy to Android:**
```bash
npm run android
```
Or:
```bash
./scripts/dev-native.sh
```

### Physical Device Setup:

If using a physical Android device connected via USB, run once before opening the app:
```bash
adb reverse tcp:8081 tcp:8081
```

### Troubleshooting:

**Red Screen "Unable to load script":**
- Ensure Metro is running (`npm start`)
- Check you're in the `mobile-rn/` folder
- For physical device: run `adb reverse tcp:8081 tcp:8081`

---

## 📦 Building Production APK

From the `mobile-rn/` folder:

```bash
./build-android.sh
```

APK location: `mobile-rn/android/app/build/outputs/apk/release/app-release.apk`

For debug APK:
```bash
./build-android.sh debug
```

---

## Project Structure

```
.
├── src/                 # Web app (React + Vite)
├── mobile-rn/           # React Native Android app
│   ├── src/
│   ├── android/         # Android native files
│   ├── ios/             # iOS files (if needed)
│   └── package.json
└── scripts/             # Convenience scripts
    ├── dev-web.sh       # Start web server for phone
    ├── dev-native.sh    # Run native Android app
    └── start-metro.sh   # Start Metro bundler
```

---

## Common Workflows

### Quick Test Loop (Web)
```bash
npm run dev:network
# Make changes in src/
# Auto-reload on phone browser
```

### Native Testing
```bash
cd mobile-rn
npm start
# In another terminal:
npm run android
# Make changes in mobile-rn/src/
# Metro hot-reloads
```

### Prepare for Release
```bash
cd mobile-rn
./build-android.sh
# Share or deploy app-release.apk
```
