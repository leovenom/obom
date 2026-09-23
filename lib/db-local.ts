import fs from 'fs';
import path from 'path';
import type { StoredSession, StoredUser } from '@/lib/db-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(file: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function writeJson<T>(file: string, data: T) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function localGetUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_FILE, []);
}

function localSaveUsers(users: StoredUser[]) {
  writeJson(USERS_FILE, users);
}

export function localFindUserByEmail(email: string): StoredUser | undefined {
  return localGetUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function localFindUserByGoogleId(googleId: string): StoredUser | undefined {
  return localGetUsers().find((u) => u.googleId === googleId);
}

export function localFindUserById(id: string): StoredUser | undefined {
  return localGetUsers().find((u) => u.id === id);
}

export function localCreateUser(user: StoredUser) {
  const users = localGetUsers();
  users.push(user);
  localSaveUsers(users);
}

export function localUpdateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
  const users = localGetUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  localSaveUsers(users);
  return users[idx];
}

function localGetSessions(): StoredSession[] {
  return readJson<StoredSession[]>(SESSIONS_FILE, []);
}

function localSaveSessions(sessions: StoredSession[]) {
  writeJson(SESSIONS_FILE, sessions);
}

export function localCreateSession(userId: string, token: string, daysValid = 30) {
  const sessions = localGetSessions().filter(
    (s) => s.userId !== userId || new Date(s.expiresAt) > new Date()
  );
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);
  sessions.push({ token, userId, expiresAt: expiresAt.toISOString() });
  localSaveSessions(sessions);
}

export function localFindSession(token: string): StoredSession | undefined {
  const session = localGetSessions().find((s) => s.token === token);
  if (!session) return undefined;
  if (new Date(session.expiresAt) < new Date()) {
    localDeleteSession(token);
    return undefined;
  }
  return session;
}

export function localDeleteSession(token: string) {
  localSaveSessions(localGetSessions().filter((s) => s.token !== token));
}
