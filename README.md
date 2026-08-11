# 🔥 KANDALA ULTRA - WhatsApp Pairing Link Generator

A powerful WhatsApp session pairing tool that generates unique pair links in the format `KANDALA-ULTRA:~[ID]` for seamless WhatsApp bot integration.

## Features

✨ **Pair Link Generation**
- Generates unique pair links: `KANDALA-ULTRA:~[timestamp]-[random]`
- Accessible via `/api/pair-link` endpoint
- Perfect for sharing and session management

✅ **QR Code & Pairing Modes**
- QR code scanning mode
- Phone number pairing code mode
- Real-time session status tracking

🔐 **Session Management**
- Secure WhatsApp session creation
- Automatic credential storage
- Session status monitoring

📱 **Auto-Messaging**
- Sends pair link to WhatsApp inbox
- Sends session ID to device
- Support links and notifications

## Quick Start

### Installation

```bash
git clone https://github.com/andrewkandala732-cyber/KANDALA-ULTRA-PAIR-
cd KANDALA-ULTRA-PAIR-
npm install
```

### Running Locally

```bash
npm run dev
# Server starts on http://localhost:5000
```

### Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Build command: `npm install`
4. Start command: `node server.js`
5. Deploy!

Access after deployment: `https://andrew-kandala-pair.onrender.com`

## API Endpoints

### Get Pair Link
```
GET /api/pair-link
```

Response:
```json
{
  "pairLink": "KANDALA-ULTRA:~1724000000000-a1b2c3d4",
  "url": "https://andrew-kandala-pair.onrender.com/?link=KANDALA-ULTRA:~1724000000000-a1b2c3d4",
  "timestamp": "2026-08-11T12:00:00.000Z"
}
```

### Start Session
```
POST /api/start-session
Content-Type: application/json

{
  "phone": "254712345678",
  "mode": "pairing"
}
```

### Get Session Status
```
GET /api/session-status?id=<sessionId>
```

### Close Session
```
POST /api/close-session
Content-Type: application/json

{
  "id": "<sessionId>"
}
```

## Usage

1. **Get a pair link:**
   ```bash
   curl https://andrew-kandala-pair.onrender.com/api/pair-link
   ```

2. **Share the pair link:** `KANDALA-ULTRA:~[ID]`

3. **Use in your bot:**
   ```javascript
   const pairLink = "KANDALA-ULTRA:~1724000000000-a1b2c3d4";
   ```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **Baileys** - WhatsApp Web client
- **QRCode** - QR generation
- **Pino** - Logging

## Support

📞 **WhatsApp:** [https://wa.me/message/HUOKEISLPBL5L1](https://wa.me/message/HUOKEISLPBL5L1)

💻 **GitHub:** [https://github.com/andrewkandala732-cyber](https://github.com/andrewkandala732-cyber)

## License

MIT License - Open for personal and commercial use

---

**Powered by KANDALA ULTRA 🔥**
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
