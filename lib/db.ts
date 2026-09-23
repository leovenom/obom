import fs from 'fs';
import path from 'path';
import { isValidPtPhone } from '@/lib/phone-pt';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  googleId?: string;
  nome: string;
  cpf: string;
  telefone: string;
  chavePix: string;
  endereco: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  expiresAt: string;
}

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

export function getUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_FILE, []);
}

export function saveUsers(users: StoredUser[]) {
  writeJson(USERS_FILE, users);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByGoogleId(googleId: string): StoredUser | undefined {
  return getUsers().find((u) => u.googleId === googleId);
}

export function findUserById(id: string): StoredUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function createUser(user: StoredUser) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(id: string, updates: Partial<StoredUser>) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[idx];
}

export function getSessions(): StoredSession[] {
  return readJson<StoredSession[]>(SESSIONS_FILE, []);
}

export function saveSessions(sessions: StoredSession[]) {
  writeJson(SESSIONS_FILE, sessions);
}

export function createSession(userId: string, token: string, daysValid = 30) {
  const sessions = getSessions().filter((s) => s.userId !== userId || new Date(s.expiresAt) > new Date());
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);
  sessions.push({ token, userId, expiresAt: expiresAt.toISOString() });
  saveSessions(sessions);
}

export function findSession(token: string): StoredSession | undefined {
  const session = getSessions().find((s) => s.token === token);
  if (!session) return undefined;
  if (new Date(session.expiresAt) < new Date()) {
    deleteSession(token);
    return undefined;
  }
  return session;
}

export function deleteSession(token: string) {
  saveSessions(getSessions().filter((s) => s.token !== token));
}

export function sanitizeUser(user: StoredUser) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function isProfileComplete(user: StoredUser): boolean {
  return !!(user.nome?.trim() && user.telefone && isValidPtPhone(user.telefone));
}
