// In-memory session store for WhatsApp connections
// Maps sessionId -> { qr, pairingCode, status, socket }

export type SessionStatus = 'pending' | 'qr_ready' | 'pairing_ready' | 'connected' | 'failed' | 'closed';

export interface Session {
  id: string;
  status: SessionStatus;
  qrDataUrl?: string;
  pairingCode?: string;
  phone?: string;
  createdAt: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket?: any;
}

const sessions = new Map<string, Session>();

export function createSession(id: string, phone?: string): Session {
  const session: Session = {
    id,
    status: 'pending',
    phone,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, update: Partial<Session>): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  const updated = { ...session, ...update };
  sessions.set(id, updated);
  return updated;
}

export function deleteSession(id: string) {
  const session = sessions.get(id);
  if (session?.socket) {
    try {
      session.socket.end(undefined);
    } catch (_) {}
  }
  sessions.delete(id);
}

// Clean up sessions older than 10 minutes
export function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      deleteSession(id);
    }
  }
}
