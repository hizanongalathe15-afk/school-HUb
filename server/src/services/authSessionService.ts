import crypto from 'crypto';
import { readSetting, writeSetting } from './settingStore.js';

export interface AuthDeviceSession {
  id: string;
  userAgent: string;
  ip: string;
  email?: string;
  accountName?: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string;
}

export interface AuthSessionMeta {
  userId: string;
  loginCount: number;
  sessions: AuthDeviceSession[];
}

function key(userId: string) {
  return `auth_sessions:${userId}`;
}

export function createSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

export const authSessionService = {
  async recordLogin(userId: string, input: { sessionId: string; userAgent?: string; ip?: string }) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const now = new Date().toISOString();
    meta.loginCount += 1;
    meta.sessions.unshift({
      id: input.sessionId,
      userAgent: input.userAgent || 'Unknown device',
      ip: input.ip || 'Unknown IP',
      createdAt: now,
      lastSeenAt: now
    });
    meta.sessions = meta.sessions.slice(0, 20);
    return writeSetting(key(userId), 'auth-sessions', meta);
  },

  async enrichUserSessions(userId: string, input: { email?: string; accountName?: string }) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    meta.sessions = meta.sessions.map((session) => ({
      ...session,
      email: session.email || input.email,
      accountName: session.accountName || input.accountName
    }));
    return writeSetting(key(userId), 'auth-sessions', meta);
  },

  async touch(userId: string, sessionId?: string) {
    if (!sessionId) return;
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const session = meta.sessions.find((item) => item.id === sessionId);
    if (session && !session.revokedAt) {
      session.lastSeenAt = new Date().toISOString();
      await writeSetting(key(userId), 'auth-sessions', meta);
    }
  },

  async isRevoked(userId: string, sessionId?: string) {
    if (!sessionId) return false;
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    return Boolean(meta.sessions.find((item) => item.id === sessionId)?.revokedAt);
  },

  async get(userId: string) {
    return readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
  },

  async revokeOthers(userId: string, currentSessionId?: string) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const now = new Date().toISOString();
    meta.sessions = meta.sessions.map((session) =>
      session.id === currentSessionId ? session : { ...session, revokedAt: session.revokedAt || now }
    );
    return writeSetting(key(userId), 'auth-sessions', meta);
  },

  async revokeSelected(userId: string, ids: string[], currentSessionId?: string) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const now = new Date().toISOString();
    const selected = new Set(ids.filter((id) => id !== currentSessionId));
    meta.sessions = meta.sessions.map((session) =>
      selected.has(session.id) ? { ...session, revokedAt: session.revokedAt || now } : session
    );
    return writeSetting(key(userId), 'auth-sessions', meta);
  },

  async revokeInactive(userId: string, currentSessionId?: string, inactiveMinutes = 30) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const now = new Date();
    const revokedAt = now.toISOString();
    const cutoff = now.getTime() - inactiveMinutes * 60 * 1000;
    meta.sessions = meta.sessions.map((session) => {
      if (session.id === currentSessionId || session.revokedAt) return session;
      const lastSeen = new Date(session.lastSeenAt || session.createdAt).getTime();
      return lastSeen < cutoff ? { ...session, revokedAt } : session;
    });
    return writeSetting(key(userId), 'auth-sessions', meta);
  },

  async revokeAll(userId: string, currentSessionId?: string) {
    const meta = await readSetting<AuthSessionMeta>(key(userId), { userId, loginCount: 0, sessions: [] });
    const now = new Date().toISOString();
    meta.sessions = meta.sessions.map((session) =>
      session.id === currentSessionId ? session : { ...session, revokedAt: session.revokedAt || now }
    );
    return writeSetting(key(userId), 'auth-sessions', meta);
  }
};
