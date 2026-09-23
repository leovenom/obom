import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isProfileComplete, sanitizeUser, updateUser } from '@/lib/db';
import { isValidPtPhone, normalizePtPhone } from '@/lib/phone-pt';

export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { nome, telefone } = body;

  const telefoneNorm = telefone ? normalizePtPhone(String(telefone)) : '';
  if (!nome?.trim() || !telefoneNorm || !isValidPtPhone(telefoneNorm)) {
    return NextResponse.json(
      { error: 'Indique nome completo e telemóvel português válido (9 dígitos, começa por 9)' },
      { status: 400 }
    );
  }

  const updated = updateUser(sessionUser.id, {
    nome: nome.trim(),
    telefone: telefoneNorm,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    user: sanitizeUser(updated),
    profileComplete: isProfileComplete(updated),
  });
}
