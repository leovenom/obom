import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getSessionUser } from '@/lib/auth';
import { getCaptureById } from '@/lib/capturas-registry';
import { readCaptureMedia } from '@/lib/media-storage';
import { isSafeCaptureFilename } from '@/lib/upload-files';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!isSafeCaptureFilename(filename)) {
    return NextResponse.json({ error: 'Nome de ficheiro inválido' }, { status: 400 });
  }

  const [user, isAdmin] = await Promise.all([getSessionUser(), isAdminAuthenticated()]);
  if (!user && !isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const record = await getCaptureById(filename);
  if (!record) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const isOwner = user?.id === record.userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const file = await readCaptureMedia(filename, record.blobPath);
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
