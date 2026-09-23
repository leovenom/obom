import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { findSession, findUserById, sanitizeUser } from './db';

const SESSION_COOKIE = 'obom_session';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashVerify = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashVerify, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateId(): string {
  return randomBytes(8).toString('hex');
}

export async function getSessionUser() {
  try {
    const { auth } = await import('@/auth');
    const oauthSession = await auth();
    if (oauthSession?.user?.id) {
      const user = findUserById(oauthSession.user.id);
      if (user) return sanitizeUser(user);
    }
  } catch {
    // NextAuth não configurado ou indisponível
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = findSession(token);
  if (!session) return null;

  const user = findUserById(session.userId);
  if (!user) return null;

  return sanitizeUser(user);
}

export { SESSION_COOKIE };
