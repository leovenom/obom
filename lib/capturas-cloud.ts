import { sql } from '@vercel/postgres';
import type { AuthorityReport } from '@/lib/commission';
import type { CaptureMetadata } from '@/lib/types';
import type { CaptureRecord, CaptureSummary, UserCaptureGroup } from '@/lib/capturas-types';
import { ensureCloudSchema } from '@/lib/persistence/schema';

function rowToRecord(row: Record<string, unknown>): CaptureRecord {
  return {
    id: row.id as string,
    protocolo: row.protocolo as string,
    filename: row.filename as string,
    blobPath: (row.blob_path as string) || undefined,
    originalName: row.original_name as string,
    mimetype: row.mimetype as string,
    size: Number(row.size),
    mediaType: row.media_type as 'foto' | 'video',
    uploadedAt: new Date(row.uploaded_at as string).toISOString(),
    userId: row.user_id as string,
    userEmail: row.user_email as string,
    userNome: row.user_nome as string,
    metadata: row.metadata as CaptureMetadata,
    relatorioAutoridade: row.relatorio_autoridade as AuthorityReport,
  };
}

export async function cloudRegisterCapture(record: CaptureRecord): Promise<CaptureRecord> {
  await ensureCloudSchema();
  await sql`
    INSERT INTO obom_captures (
      id, protocolo, filename, blob_path, original_name, mimetype, size, media_type,
      uploaded_at, user_id, user_email, user_nome, metadata, relatorio_autoridade
    ) VALUES (
      ${record.id},
      ${record.protocolo},
      ${record.filename},
      ${record.blobPath ?? null},
      ${record.originalName},
      ${record.mimetype},
      ${record.size},
      ${record.mediaType},
      ${record.uploadedAt},
      ${record.userId},
      ${record.userEmail},
      ${record.userNome},
      ${JSON.stringify(record.metadata)},
      ${JSON.stringify(record.relatorioAutoridade)}
    )
  `;
  return record;
}

export async function cloudGetAllCapturas(): Promise<CaptureRecord[]> {
  await ensureCloudSchema();
  const { rows } = await sql`
    SELECT * FROM obom_captures ORDER BY uploaded_at DESC LIMIT 2000
  `;
  return rows.map(rowToRecord);
}

export async function cloudGetCaptureById(id: string): Promise<CaptureRecord | null> {
  await ensureCloudSchema();
  const { rows } = await sql`
    SELECT * FROM obom_captures
    WHERE id = ${id} OR filename = ${id} OR protocolo = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function cloudGetCapturasByUser(userId: string): Promise<CaptureSummary[]> {
  const records = await cloudGetAllCapturas();
  return records
    .filter((r) => r.userId === userId)
    .map(({ filename, protocolo, uploadedAt, mediaType, metadata }) => ({
      filename,
      protocolo,
      uploadedAt,
      mediaType,
      metadata,
    }));
}

export async function cloudGetCapturasGroupedByUser(): Promise<UserCaptureGroup[]> {
  const groups = new Map<string, UserCaptureGroup>();

  for (const record of await cloudGetAllCapturas()) {
    let group = groups.get(record.userId);
    if (!group) {
      group = {
        userId: record.userId,
        userNome: record.userNome,
        userEmail: record.userEmail,
        totalCapturas: 0,
        capturas: [],
      };
      groups.set(record.userId, group);
    }
    group.capturas.push(record);
    group.totalCapturas += 1;
  }

  for (const group of groups.values()) {
    group.capturas.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  return Array.from(groups.values()).sort((a, b) => {
    const latestA = a.capturas[0]?.uploadedAt ?? '';
    const latestB = b.capturas[0]?.uploadedAt ?? '';
    return latestB.localeCompare(latestA);
  });
}
