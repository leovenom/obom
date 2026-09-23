import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signOut } from '@/auth';
import { deleteSession } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  try {
    await signOut({ redirect: false });
  } catch {
    // NextAuth pode não estar configurado
  }

  return NextResponse.json({ success: true });
}
