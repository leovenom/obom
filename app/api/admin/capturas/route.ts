import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getAllCapturas,
  getCapturasGroupedByUser,
  syncLegacyUploads,
} from '@/lib/capturas-registry';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const imported = await syncLegacyUploads();
  const records = await getAllCapturas();
  const users = await getCapturasGroupedByUser();

  return NextResponse.json({
    total: records.length,
    usersTotal: users.length,
    imported,
    records,
    users,
  });
}
