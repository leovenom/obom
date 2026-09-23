import fs from 'fs';
import path from 'path';

export interface PlateRecord {
  id: string;
  placa: string;
  data_hora: string;
  status: 'Liberado' | 'Negado';
  origem?: 'captura' | 'tempo_real';
  protocolo?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DETECTADAS_FILE = path.join(DATA_DIR, 'placas_detectadas.json');
const LIBERADAS_FILE = path.join(DATA_DIR, 'placas_liberadas.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(file: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function writeJson<T>(file: string, data: T) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getAuthorizedPlates(): string[] {
  const raw = readJson<string[]>(LIBERADAS_FILE, []);
  return raw.map((p) => p.toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

export function isPlateAuthorized(plate: string): boolean {
  const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return getAuthorizedPlates().includes(normalized);
}

export function getPlateRecords(): PlateRecord[] {
  return readJson<PlateRecord[]>(DETECTADAS_FILE, []);
}

export function registerPlateDetections(
  plates: string[],
  extra: Pick<PlateRecord, 'origem' | 'protocolo'> = {}
): PlateRecord[] {
  if (plates.length === 0) return [];

  const records = getPlateRecords();
  const created: PlateRecord[] = [];
  const now = new Date().toISOString();

  for (const plate of plates) {
    const normalized = plate.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const entry: PlateRecord = {
      id: `${Date.now()}-${normalized}`,
      placa: normalized,
      data_hora: now,
      status: isPlateAuthorized(normalized) ? 'Liberado' : 'Negado',
      ...extra,
    };
    records.unshift(entry);
    created.push(entry);
  }

  writeJson(DETECTADAS_FILE, records.slice(0, 500));
  return created;
}
