import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'obom_admin';
const SESSION_HOURS = 24;

function getSigningSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.AUTH_SECRET || '';
}

export function isAdminPasswordValid(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createAdminSessionToken(): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const secret = getSigningSecret();
  if (!secret || !token.includes('.')) return false;

  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;

  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return payload.role === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  };
}
