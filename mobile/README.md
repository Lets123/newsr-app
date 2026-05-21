ss -tlnp | grep 5173 || sudo ss -tlnp | grep 5173
# or
sudo lsof -iTCP -sTCP:LISTEN -P -n | grep 5173# from /home/yuuta/Downloads/newsr-app
chmod +x scripts/run-dev.sh scripts/run-localtunnel.sh || true
PORT=5173 nohup npm run dev -- --host 0.0.0.0 --port $PORT > vite.log 2>&1 &
sleep 2
# run localtunnel in foreground so you see the public URL
npx --yes localtunnel --port $PORT# from /home/yuuta/Downloads/newsr-app
chmod +x scripts/run-dev.sh scripts/run-localtunnel.sh || true
PORT=5173 nohup npm run dev -- --host 0.0.0.0 --port $PORT > vite.log 2>&1 &
sleep 2
# run localtunnel in foreground so you see the public URL
npx --yes localtunnel --port $PORT# from /home/yuuta/Downloads/newsr-app
chmod +x scripts/run-dev.sh scripts/run-localtunnel.sh || true
PORT=5173 nohup npm run dev -- --host 0.0.0.0 --port $PORT > vite.log 2>&1 &
sleep 2
# run localtunnel in foreground so you see the public URL
npx --yes localtunnel --port $PORT# Inventory Mobile (React Native)

This folder contains an early JS-only shell for the inventory app UI.

The actual runnable React Native project lives in:
`/home/yuuta/Downloads/newsr-app/mobile-rn`

## Features

- Select image from gallery
- Capture image from camera
- Add SKU, product name, cost price, selling price, stock
- Optional auto-calculation of selling price from markup percent
- FlatList inventory display with image, pricing, and margin

## Run

Run the app from `mobile-rn/`, not from this folder.

1. Open a terminal in:
   `cd /home/yuuta/Downloads/newsr-app/mobile-rn`
2. Start Metro:
   `npm start`
3. In a second terminal, launch Android:
   `npm run android`

If you want an installable APK that works without Metro, use:
`/home/yuuta/Downloads/newsr-app/mobile-rn/build-android.sh`

## Quick: open web app on your phone

The project root contains a Vite web app. To run locally and open on a phone
on the same Wi‑Fi network, use the helper scripts in `scripts/`:

1. Start the dev server (bind to LAN):

```bash
chmod +x ../scripts/run-dev.sh
./scripts/run-dev.sh
# Vite prints a Network URL (e.g. http://192.168.1.64:5173). Open that on your phone.
```

2. For a production-like preview:

```bash
chmod +x ../scripts/run-preview.sh
./scripts/run-preview.sh
```

3. If you need a public URL (fallback) use ngrok:

```bash
chmod +x ../scripts/expose-ngrok.sh
PORT=5173 ./scripts/expose-ngrok.sh
```

4. Quick public URL (fast, no signup) using localtunnel:

```bash
chmod +x ../scripts/run-localtunnel.sh
./scripts/run-localtunnel.sh
# localtunnel prints a URL like https://abcdef.loca.lt — open that on your phone
```

Troubleshooting:
- Ensure both devices are on the same Wi‑Fi.
- If the phone cannot reach the Network URL, run `sudo ufw allow 5173` or use `--port` to pick an open port.
- Vite will also show the `localhost` URL; use the `Network` one for other devices.

