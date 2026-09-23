import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, findUserByEmail, sanitizeUser } from '@/lib/db';
import { generateToken, verifyPassword, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: 'Use "Entrar com Google" para esta conta' },
      { status: 401 }
    );
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 });
  }

  const token = generateToken();
  createSession(user.id, token);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return NextResponse.json({ user: sanitizeUser(user) });
}
