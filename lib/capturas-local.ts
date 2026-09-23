import fs from 'fs';
import path from 'path';
import type { CaptureRecord, CaptureSummary, UserCaptureGroup } from '@/lib/capturas-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const REGISTROS_FILE = path.join(DATA_DIR, 'capturas', 'registros.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureDataDir() {
  const dir = path.dirname(REGISTROS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readRecords(): CaptureRecord[] {
  ensureDataDir();
  if (!fs.existsSync(REGISTROS_FILE)) {
    fs.writeFileSync(REGISTROS_FILE, '[]');
    return [];
  }
  return JSON.parse(fs.readFileSync(REGISTROS_FILE, 'utf8')) as CaptureRecord[];
}

function writeRecords(records: CaptureRecord[]) {
  ensureDataDir();
  fs.writeFileSync(REGISTROS_FILE, JSON.stringify(records, null, 2));
}

export function localRegisterCapture(record: CaptureRecord): CaptureRecord {
  const records = readRecords();
  records.unshift(record);
  writeRecords(records.slice(0, 2000));
  return record;
}

export function localGetCapturasByUser(userId: string): CaptureSummary[] {
  return readRecords()
    .filter((r) => r.userId === userId)
    .map(({ filename, protocolo, uploadedAt, mediaType, metadata }) => ({
      filename,
      protocolo,
      uploadedAt,
      mediaType,
      metadata,
    }));
}

export function localGetAllCapturas(): CaptureRecord[] {
  return readRecords();
}

export function localGetCaptureById(id: string): CaptureRecord | null {
  return readRecords().find((r) => r.id === id || r.filename === id || r.protocolo === id) ?? null;
}

export function localSyncLegacyUploads(): number {
  if (!fs.existsSync(UPLOADS_DIR)) return 0;

  const records = readRecords();
  const existingIds = new Set(records.map((r) => r.id));
  let imported = 0;

  for (const file of fs.readdirSync(UPLOADS_DIR)) {
    if (!file.endsWith('.json') || file.includes('.autoridade.')) continue;

    try {
      const raw = fs.readFileSync(path.join(UPLOADS_DIR, file), 'utf8');
      const record = JSON.parse(raw) as CaptureRecord;
      if (!record?.id || !record?.protocolo || existingIds.has(record.id)) continue;
      records.unshift(record);
      existingIds.add(record.id);
      imported += 1;
    } catch {
      // ignore
    }
  }

  if (imported > 0) {
    writeRecords(records.slice(0, 2000));
  }

  return imported;
}

export function localGetCapturasGroupedByUser(): UserCaptureGroup[] {
  const groups = new Map<string, UserCaptureGroup>();

  for (const record of readRecords()) {
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
