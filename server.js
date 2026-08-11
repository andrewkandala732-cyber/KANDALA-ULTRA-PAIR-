const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const pino = require('pino');
const crypto = require('crypto');
const zlib = require('zlib');
const { createSession, getSession, updateSession, deleteSession } = require('./lib/sessions');

const app = express();
const PORT = process.env.PORT || 5000;
const logger = pino({ level: 'silent' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Generate Pair Link ──────────────────────────────────────────────────────
function generatePairLink() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `KANDALA-ULTRA:~${timestamp}-${random}`;
}

// ── Build FULL pairing payload ID (includes creds + auth files), compressed then base64
function buildFullPairingId(authDir) {
  const payload = {
    creds: null,
    files: {},
    created: Date.now(),
  };

  try {
    if (fs.existsSync(authDir)) {
      const entries = fs.readdirSync(authDir);
      for (const name of entries) {
        const p = path.join(authDir, name);
        const stat = fs.statSync(p);
        if (stat.isFile()) {
          // store file contents as base64
          payload.files[name] = fs.readFileSync(p).toString('base64');
        } else if (stat.isDirectory()) {
          // read nested directory (e.g. keys/*)
          const nested = {};
          const sub = fs.readdirSync(p);
          for (const fn of sub) {
            const fp = path.join(p, fn);
            if (fs.statSync(fp).isFile()) {
              nested[fn] = fs.readFileSync(fp).toString('base64');
            }
          }
          payload.files[name] = nested;
        }
      }
    }
  } catch (err) {
    // non-fatal: continue with whatever we could read
    console.warn('buildFullPairingId read error', err && err.message);
  }

  // include parsed creds.json if available
  try {
    const credsFile = path.join(authDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      const raw = fs.readFileSync(credsFile, 'utf8');
      try { payload.creds = JSON.parse(raw); } catch (_) { payload.creds = raw; }
    }
  } catch (e) {
    // ignore
  }

  const json = JSON.stringify(payload);
  const compressed = zlib.deflateSync(Buffer.from(json, 'utf8'));
  return `KANDALA-ULTRA:~${compressed.toString('base64')}`;
}

// ── GET /api/pair-link ──────────────────────────────────────────────────────
app.get('/api/pair-link', (req, res) => {
  const pairLink = generatePairLink();
  res.json({
    pairLink,
    url: `https://andrew-kandala-pair.onrender.com/?link=${pairLink}`,
    timestamp: new Date().toISOString()
  });
});

// ── POST /api/start-session ──────────────────────────────────────────────────
app.post('/api/start-session', async (req, res) => {
  const { phone, mode } = req.body;
  if (mode === 'pairing' && !phone) {
    return res.status(400).json({ error: 'Phone number required for pairing mode' });
  }
  const sessionId = uuidv4();
  createSession(sessionId, phone);
  startWhatsAppSession(sessionId, phone, mode);
  return res.json({ sessionId });
});

// ── GET /api/session-status ──────────────────────────────────────────────────
app.get('/api/session-status', (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Session ID required' });
  const session = getSession(id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const { socket, ...safe } = session;
  // Truncate waSession preview for status checks (full copy via /api/get-session)
  return res.json(safe);
});

// ── POST /api/close-session ──────────────────────────────────────────────────
app.post('/api/close-session', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Session ID required' });
  deleteSession(id);
  return res.json({ ok: true });
});

// ── Catch-all: serve index.html ──────────────────────────────────────────────
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const pairLink = generatePairLink();
  console.log(`🔥 KANDALA ULTRA running on port ${PORT}`);
  console.log(`📱 Pair Link: ${pairLink}`);
  console.log(`🌐 Access at: https://andrew-kandala-pair.onrender.com/?link=${pairLink}`);
});

// ── WhatsApp session worker ──────────────────────────────────────────────────
async function startWhatsAppSession(sessionId, phone, mode) {
  try {
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
      makeCacheableSignalKeyStore,
      Browsers,
    } = require('@whiskeysockets/baileys');

    const authDir = path.join('/tmp', 'wa-sessions', sessionId);
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[${sessionId.slice(0,8)}] Starting ${mode} session, WA version: ${version}`);

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      // ✅ Valid browser fingerprint WhatsApp accepts
      browser: Browsers.ubuntu('Chrome'),
      // ✅ Skip full history sync — faster pairing
      syncFullHistory: false,
      // ✅ Keepalive prevents dropped connections during QR scan
      keepAliveIntervalMs: 10_000,
      // ✅ Don't try to mark initial sync complete (avoids race)
      markOnlineOnConnect: false,
    });

    updateSession(sessionId, { socket: sock });

    // ── Pairing code mode ──────────────────────────────────────────────────
    if (mode === 'pairing' && phone) {
      // Wait until the socket is actually ready (not-registered state)
      const requestCode = async () => {
        try {
          // creds.registered must be false to request a pairing code
          if (sock.authState.creds.registered) {
            console.log(`[${sessionId.slice(0,8)}] Already registered, skip pairing code`);
            return;
          }
          const cleaned = phone.replace(/\D/g, '');
          if (!cleaned || cleaned.length < 7) {
            updateSession(sessionId, { status: 'failed' });
            return;
          }
          console.log(`[${sessionId.slice(0,8)}] Requesting pairing code for +${cleaned}`);
          const code = await sock.requestPairingCode(cleaned);
          console.log(`[${sessionId.slice(0,8)}] Got pairing code: ${code}`);
          updateSession(sessionId, { status: 'pairing_ready', pairingCode: code });
        } catch (err) {
          console.error(`[${sessionId.slice(0,8)}] Pairing code error:`, err.message);
          updateSession(sessionId, { status: 'failed' });
        }
      };

      // Give the socket 5 seconds to reach WhatsApp servers before requesting
      setTimeout(requestCode, 5000);
    }

    // ── Connection updates ─────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR received — generate image
      if (qr && mode === 'qr') {
        try {
          console.log(`[${sessionId.slice(0,8)}] QR received, generating image`);
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
          });
          updateSession(sessionId, { status: 'qr_ready', qrDataUrl });
        } catch (err) {
          console.error(`[${sessionId.slice(0,8)}] QR generation error:`, err.message);
        }
      }

      if (connection === 'open') {
        console.log(`[${sessionId.slice(0,8)}] ✅ Connected!`);
        await saveCreds();

        // ── Generate PAIR_LINK & send to WhatsApp inbox ─────────────────
        try {
          // Wait for saveCreds to flush all files to disk
          await new Promise(r => setTimeout(r, 2000));

          const credsFile = path.join(authDir, 'creds.json');
          if (!fs.existsSync(credsFile)) {
            console.warn(`[${sessionId.slice(0,8)}] creds.json not found yet`);
            updateSession(sessionId, { status: 'connected' });
            return;
          }

          const credsRaw = fs.readFileSync(credsFile, 'utf8');
          const pairLink = generatePairLink();
          const pairingId = buildFullPairingId(authDir);
          console.log(`[${sessionId.slice(0,8)}] PAIR_LINK generated: ${pairLink}`);
          console.log(`[${sessionId.slice(0,8)}] PAIRING_ID generated (${pairingId.length} chars)`);

          // Store in session for UI display
          updateSession(sessionId, { status: 'connected', pairLink, pairingId });

          // ── Send messages to own WhatsApp inbox ─────────────────────────
          try {
            const ownJid = sock.user?.id;
            if (ownJid) {
              // Normalise JID: "254712345678:6@s.whatsapp.net" → "254712345678@s.whatsapp.net"
              const jid = ownJid.replace(/:\d+/, '');

              // ── Message 1: Connected notification ──────────────────────
              await sock.sendMessage(jid, {
                text:
                  `╔══════════════════════════════╗\n` +
                  `║  🔥 *KANDALA ULTRA PAIR* 🔥  ║\n` +
                  `╚══════════════════════════════╝\n\n` +
                  `✅ *Device Linked Successfully!*\n\n` +
                  `Your WhatsApp bot is now connected and ready to use.\n\n` +
                  `📌 Your *PAIR_LINK* and *SESSION_ID* will be sent in the next messages.\n` +
                  `Copy them and add them to your \`.env\` file.\n\n` +
                  `_Usishare na mtu yeyote! 🔒_`,
              });

              // Small delay between messages
              await new Promise(r => setTimeout(r, 1000));

              // ── Message 2: Pair Link (easy to copy) ──
              await sock.sendMessage(jid, {
                text: `🔗 *PAIR_LINK:*\n\n${pairLink}`
              });

              // Small delay
              await new Promise(r => setTimeout(r, 800));

              // ── Message 3: Formatted PAIRING_ID (very long compressed base64) ─
              await sock.sendMessage(jid, {
                text: `🔐 *SESSION_ID:*\n\n${pairingId}`
              });

              // Small delay
              await new Promise(r => setTimeout(r, 800));

              // ── Message 4: Owner / support links ───────────────────────
              await sock.sendMessage(jid, {
                text:
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `👑 *Owner / Support*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `📞 WhatsApp: https://wa.me/message/HUOKEISLPBL5L1\n` +
                  `💻 GitHub: https://github.com/andrewkandala732-cyber\n\n` +
                  `_Powered by KANDALA ULTRA 🔥_`,
              });

              console.log(`[${sessionId.slice(0,8)}] All messages sent to ${jid}`);
            }
          } catch (sendErr) {
            console.error(`[${sessionId.slice(0,8)}] Failed to send messages:`, sendErr.message);
          }
        } catch (err) {
          console.error(`[${sessionId.slice(0,8)}] PAIR_LINK/SESSION_ID error:`, err.message);
          updateSession(sessionId, { status: 'connected' });
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`[${sessionId.slice(0,8)}] Connection closed, code: ${statusCode}`);

        const session = getSession(sessionId);
        if (!session) return; // already cleaned up

        // Only mark as permanently failed/closed for fatal codes
        // (loggedOut=401, badSession=500, forbidden=403)
        const fatalCodes = [
          DisconnectReason.loggedOut,
          DisconnectReason.badSession,
          DisconnectReason.forbidden,
        ];

        if (fatalCodes.includes(statusCode)) {
          console.log(`[${sessionId.slice(0,8)}] Fatal disconnect, marking failed`);
          updateSession(sessionId, { status: 'failed' });
          try { fs.rmSync(authDir, { recursive: true }); } catch (_) {}
        } else if (session.status !== 'connected') {
          // Only mark closed if we never successfully connected
          // Non-fatal codes: session expired, restart needed, etc.
          if (statusCode === DisconnectReason.restartRequired) {
            // Restart the socket once
            console.log(`[${sessionId.slice(0,8)}] Restart required — reconnecting`);
            startWhatsAppSession(sessionId, phone, mode);
          } else {
            updateSession(sessionId, { status: 'failed' });
            try { fs.rmSync(authDir, { recursive: true }); } catch (_) {}
          }
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    console.error(`[${sessionId.slice(0,8)}] Session start error:`, err.message);
    updateSession(sessionId, { status: 'failed' });
  }
}
