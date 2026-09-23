import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isProfileComplete, sanitizeUser, updateUser } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { nome, cpf, telefone, chavePix, endereco } = body;

  const updated = updateUser(sessionUser.id, {
    nome: nome?.trim(),
    cpf: cpf?.trim(),
    telefone: telefone?.trim(),
    chavePix: chavePix?.trim(),
    endereco: endereco?.trim(),
  });

  if (!updated) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    user: sanitizeUser(updated),
    profileComplete: isProfileComplete(updated),
  });
}
