import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getCapturasByUser } from '@/lib/capturas-registry';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  return NextResponse.json(getCapturasByUser(user.id));
}
