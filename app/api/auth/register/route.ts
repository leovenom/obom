import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createSession,
  createUser,
  findUserByEmail,
  sanitizeUser,
} from '@/lib/db';
import { generateId, generateToken, hashPassword, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, nome, cpf, telefone, chavePix, endereco } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
  }

  const user = {
    id: generateId(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    nome: nome?.trim() || '',
    cpf: cpf?.trim() || '',
    telefone: telefone?.trim() || '',
    chavePix: chavePix?.trim() || '',
    endereco: endereco?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await createUser(user);

  const token = generateToken();
  await createSession(user.id, token);

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
