// In-memory session store for WhatsApp connections
const sessions = new Map();

function createSession(id, phone) {
  const session = { id, status: 'pending', phone, createdAt: Date.now() };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

function updateSession(id, update) {
  const session = sessions.get(id);
  if (!session) return undefined;
  const updated = { ...session, ...update };
  sessions.set(id, updated);
  return updated;
}

function deleteSession(id) {
  const session = sessions.get(id);
  if (session?.socket) {
    try { session.socket.end(undefined); } catch (_) {}
  }
  sessions.delete(id);
}

// Auto-cleanup sessions older than 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      deleteSession(id);
    }
  }
}, 2 * 60 * 1000);

module.exports = { createSession, getSession, updateSession, deleteSession };
