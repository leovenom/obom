import { NextRequest, NextResponse } from 'next/server';
import { registerPlateDetections } from '@/lib/plate-registry';

export async function POST(request: NextRequest) {
  let body: { plates?: string[]; origem?: 'captura' | 'tempo_real'; protocolo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const plates = body.plates ?? [];
  if (plates.length === 0) {
    return NextResponse.json({ records: [] });
  }

  const records = registerPlateDetections(plates, {
    origem: body.origem ?? 'captura',
    protocolo: body.protocolo,
  });

  return NextResponse.json({ records });
}
