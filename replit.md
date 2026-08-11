# KANDALA CONNECT

WhatsApp Bot QR & Pairing Code Generator.

## Stack
- Next.js 14, React 18, TypeScript
- @whiskeysockets/baileys for WhatsApp Web API
- Tailwind CSS
- QRCode library for QR image generation

## How to run
```
npm install
npm run dev
```
App starts on port 5000.

## Project structure
- `pages/` — Next.js pages and API routes
- `pages/api/start-session.ts` — Starts a Baileys WhatsApp session (QR or pairing)
- `pages/api/session-status.ts` — Polls session status + returns QR / pairing code
- `pages/api/close-session.ts` — Closes and cleans up a session
- `lib/sessions.ts` — In-memory session store
- `components/` — Logo, TabBar, StatusBadge UI components
- `styles/globals.css` — Global styles + Tailwind

## User preferences
- Brand name: KANDALA CONNECT 🔥
- Logo: https://files.catbox.moe/zptjhv.jpg
- Color scheme: dark (#0A0A0A bg) with orange (#FF6B00) accent
