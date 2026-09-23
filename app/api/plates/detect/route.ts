import { NextRequest, NextResponse } from 'next/server';
import { registerPlateDetections } from '@/lib/plate-registry';

const PLATE_AI_URL = process.env.PLATE_AI_URL || 'http://127.0.0.1:5050';

export async function POST(request: NextRequest) {
  let body: { image?: string; register?: boolean; origem?: 'captura' | 'tempo_real' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { image, register = false, origem = 'captura' } = body;
  if (!image) {
    return NextResponse.json({ error: 'Campo image obrigatório' }, { status: 400 });
  }

  try {
    const res = await fetch(`${PLATE_AI_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { plates: [], source: 'unavailable', fallback: true, error: data.error },
        { status: 200 }
      );
    }

    const plates: string[] = data.plates ?? [];

    if (register && plates.length > 0) {
      registerPlateDetections(plates, { origem });
    }

    return NextResponse.json({
      plates,
      source: 'ai',
      engine: data.engine ?? 'fast-alpr',
      timestamp: data.timestamp,
    });
  } catch {
    return NextResponse.json({ plates: [], source: 'unavailable', fallback: true });
  }
}
