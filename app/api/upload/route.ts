import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUser } from '@/lib/auth';
import { findUserById } from '@/lib/db';
import { registerCapture } from '@/lib/capturas-registry';
import { buildAuthorityReport, generateProtocolo } from '@/lib/commission';
import type { CaptureMetadata } from '@/lib/types';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Faça login para enviar capturas' }, { status: 401 });
  }

  const fullUser = findUserById(sessionUser.id);
  if (!fullUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  ensureUploadsDir();

  const formData = await request.formData();
  const media = formData.get('media') as File | null;
  const metadataRaw = formData.get('metadata') as string | null;

  if (!media) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  let metadata: CaptureMetadata;
  try {
    metadata = metadataRaw ? JSON.parse(metadataRaw) : {};
  } catch {
    return NextResponse.json({ error: 'Metadados inválidos' }, { status: 400 });
  }

  const ext = media.name.includes('.') ? media.name.slice(media.name.lastIndexOf('.')) : '.jpg';
  const filename = `captura-${Date.now()}${ext}`;
  const buffer = Buffer.from(await media.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

  const protocolo = generateProtocolo();
  const mediaType = media.type.startsWith('video') ? 'video' : 'foto';
  const baseUrl = request.nextUrl.origin;

  const authorityReport = buildAuthorityReport({
    protocolo,
    user: fullUser,
    metadata,
    filename,
    mimetype: media.type,
    size: media.size,
    mediaType,
    baseUrl,
  });

  const record = registerCapture({
    id: filename,
    protocolo,
    filename,
    originalName: media.name,
    mimetype: media.type,
    size: media.size,
    mediaType,
    uploadedAt: new Date().toISOString(),
    userId: fullUser.id,
    userEmail: fullUser.email,
    userNome: fullUser.nome,
    metadata,
    relatorioAutoridade: authorityReport,
  });

  return NextResponse.json({
    success: true,
    record: {
      id: record.id,
      protocolo: record.protocolo,
      filename: record.filename,
      uploadedAt: record.uploadedAt,
    },
  });
}
