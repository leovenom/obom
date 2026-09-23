import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getSessionUser } from '@/lib/auth';
import { getCaptureById } from '@/lib/capturas-registry';
import { readUploadFile } from '@/lib/upload-files';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  const record = getCaptureById(filename);
  if (!record) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const [user, isAdmin] = await Promise.all([getSessionUser(), isAdminAuthenticated()]);
  const isOwner = user?.id === record.userId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const file = readUploadFile(filename);
  if (!file) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, no-store',
    },
  });
}
