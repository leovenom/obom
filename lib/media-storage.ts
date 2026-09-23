import fs from 'fs';
import { get, put } from '@vercel/blob';
import { useCloudPersistence } from '@/lib/persistence/config';
import { UPLOADS_DIR, isSafeCaptureFilename, mimeFromFilename } from '@/lib/upload-files';

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function writeCaptureMedia(
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ blobPath?: string }> {
  if (!isSafeCaptureFilename(filename)) {
    throw new Error('Nome de ficheiro inválido');
  }

  if (useCloudPersistence()) {
    const blobPath = `captures/${filename}`;
    await put(blobPath, buffer, {
      access: 'private',
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { blobPath };
  }

  ensureUploadsDir();
  fs.writeFileSync(`${UPLOADS_DIR}/${filename}`, buffer);
  return {};
}

export async function readCaptureMedia(
  filename: string,
  blobPath?: string | null
): Promise<{ buffer: Buffer; mime: string } | null> {
  if (!isSafeCaptureFilename(filename)) return null;

  if (useCloudPersistence() && blobPath) {
    try {
      const result = await get(blobPath, {
        access: 'private',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (!result || result.statusCode !== 200 || !result.stream) return null;
      const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
      const mime = result.blob.contentType || mimeFromFilename(filename);
      return { buffer, mime };
    } catch {
      return null;
    }
  }

  const filePath = `${UPLOADS_DIR}/${filename}`;
  if (!fs.existsSync(filePath)) return null;

  return {
    buffer: fs.readFileSync(filePath),
    mime: mimeFromFilename(filename),
  };
}
