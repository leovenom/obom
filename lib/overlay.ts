import type { GeoData } from './types';
import type { CaptureMetadata, IncidentType } from './types';

export function applyOverlay(imageDataUrl: string, metadata: CaptureMetadata): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      const lines = buildOverlayLines(metadata);
      if (lines.length > 0) {
        const padding = Math.max(16, img.width * 0.02);
        const fontSize = Math.max(18, img.width * 0.025);
        const lineHeight = fontSize * 1.4;
        const boxHeight = lines.length * lineHeight + padding * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, img.height - boxHeight, img.width, boxHeight);

        ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';

        lines.forEach((line, i) => {
          ctx.fillText(line, padding, img.height - boxHeight + padding + i * lineHeight);
        });
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

function buildOverlayLines(metadata: CaptureMetadata): string[] {
  const lines: string[] = [];
  if (metadata.duration) lines.push(`⏱ Duração: ${metadata.duration}`);
  if (metadata.plates && metadata.plates.length > 0) {
    lines.push(`🚗 Matrículas: ${metadata.plates.join(' | ')}`);
  }
  return lines;
}

export function buildMetadata(
  geo: GeoData,
  incidentType: IncidentType,
  extra: Partial<CaptureMetadata> = {}
): CaptureMetadata {
  const now = new Date();
  return {
    datetime: now.toLocaleString('pt-BR', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    coordinates: geo.position
      ? `${geo.position.latitude.toFixed(6)}, ${geo.position.longitude.toFixed(6)}`
      : null,
    latitude: geo.position?.latitude,
    longitude: geo.position?.longitude,
    accuracy: geo.position?.accuracy,
    address: geo.address,
    locationSource: geo.source ?? (geo.position ? 'gps' : undefined),
    incidentType,
    ...extra,
  };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export async function extractVideoFrame(videoEl: HTMLVideoElement): Promise<string | null> {
  try {
    return await new Promise<string>((resolve) => {
      const capture = () => {
        const c = document.createElement('canvas');
        c.width = videoEl.videoWidth || 640;
        c.height = videoEl.videoHeight || 480;
        c.getContext('2d')!.drawImage(videoEl, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };

      const seek = () => {
        videoEl.currentTime = 0;
        videoEl.addEventListener('seeked', capture, { once: true });
      };

      if (videoEl.readyState >= 2) seek();
      else videoEl.addEventListener('loadeddata', seek, { once: true });
    });
  } catch {
    return null;
  }
}
