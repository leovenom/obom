import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getCaptureById } from '@/lib/capturas-registry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const record = getCaptureById(id);
  if (!record) {
    return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get('download') === '1';
  if (download) {
    return new NextResponse(JSON.stringify(record.relatorioAutoridade, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${record.protocolo}.json"`,
      },
    });
  }

  return NextResponse.json(record);
}
