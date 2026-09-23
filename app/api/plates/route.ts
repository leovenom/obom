import { NextResponse } from 'next/server';
import { getPlateRecords } from '@/lib/plate-registry';

export async function GET() {
  const records = getPlateRecords();
  return NextResponse.json(records);
}
