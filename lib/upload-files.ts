import fs from 'fs';
import path from 'path';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const SAFE_FILENAME = /^captura-\d+\.(jpg|jpeg|png|webm|mp4)$/i;

/** Valida basename de captura (sem path traversal). */
export function isSafeCaptureFilename(filename: string): boolean {
  const base = path.basename(filename);
  return base === filename && SAFE_FILENAME.test(base);
}

/** Nome de ficheiro seguro (sem path traversal). */
export function resolveUploadPath(filename: string): string | null {
  const base = path.basename(filename);
  if (!isSafeCaptureFilename(filename)) return null;

  const filePath = path.resolve(UPLOADS_DIR, base);
  const uploadsRoot = path.resolve(UPLOADS_DIR);
  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return null;

  return filePath;
}

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
};

export function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/** @deprecated Use readCaptureMedia from lib/media-storage */
export function readUploadFile(filename: string): { buffer: Buffer; mime: string } | null {
  const filePath = resolveUploadPath(filename);
  if (!filePath || !fs.existsSync(filePath)) return null;

  return {
    buffer: fs.readFileSync(filePath),
    mime: mimeFromFilename(filename),
  };
}
