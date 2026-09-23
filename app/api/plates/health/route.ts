import { NextResponse } from 'next/server';

const PLATE_AI_URL = process.env.PLATE_AI_URL || 'http://127.0.0.1:5050';

export async function GET() {
  try {
    const res = await fetch(`${PLATE_AI_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return NextResponse.json({
      available: res.ok && data.ok === true,
      model: data.model ?? false,
      engine: data.engine ?? 'fast-alpr',
    });
  } catch {
    return NextResponse.json({
      available: false,
      model: false,
      engine: 'fast-alpr',
    });
  }
}
