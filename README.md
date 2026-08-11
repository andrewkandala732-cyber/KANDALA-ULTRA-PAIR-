# KANDALA CONNECT 🔥

> WhatsApp Bot Pairing — Generate QR Codes & Pairing Codes instantly.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/andrewkandala732-cyber/ANDREW-KANDALA-PAIR)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/andrewkandala732-cyber/ANDREW-KANDALA-PAIR)

---

## Stack
- **Express.js** — Web server
- **@whiskeysockets/baileys** — WhatsApp Web API
- **QRCode** — QR image generation

## Running Locally / on Replit

```bash
npm install
npm start       # starts on port 5000
```

## Features
- 📷 **QR Code mode** — Scan with WhatsApp Linked Devices
- 🔢 **Pairing Code mode** — Enter phone number, get an 8-digit code
- 🔥 KANDALA CONNECT brand identity
- Auto-polling for real-time status updates
- Session management with auto-cleanup

## Deployment

### Heroku
Click the **Deploy to Heroku** button above, or manually:
```bash
heroku create
git push heroku main
```

### Render
Click the **Deploy to Render** button above. Render will auto-detect the `render.yaml` config.

### Vercel / other Node hosts
```bash
npm install
node server.js
```
Set the `PORT` environment variable if needed (defaults to `5000`).
