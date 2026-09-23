import {
  cleanPlateAlphanumeric,
  fixEuropeanPlateOcr,
  formatEuropeanPlate,
  isValidEuropeanPlate,
  matchEuropeanPattern,
  normalizeEuropeanPlateInput,
} from '@/lib/european-plates';

const MIN_WORD_CONFIDENCE = 58;
const MIN_FIXED_CONFIDENCE = 68;
const MIN_ACCEPT_SCORE = 75;
const MIN_GENERIC_CONFIDENCE = 68;
const MAX_AUTO_PLATES = 1;
const PLATE_MIN_LEN = 5;
const PLATE_MAX_LEN = 8;

export function isValidPlate(str: string): boolean {
  return isValidEuropeanPlate(str);
}

export function formatPlate(str: string): string {
  return formatEuropeanPlate(str);
}

export function normalizePlateInput(input: string): string | null {
  return normalizeEuropeanPlateInput(input);
}

function countCorrections(raw: string, fixed: string): number {
  let n = 0;
  const len = Math.min(raw.length, fixed.length);
  for (let i = 0; i < len; i++) {
    if (raw[i] !== fixed[i]) n++;
  }
  return n + Math.abs(raw.length - fixed.length);
}

function pushOcrLengths(
  merged: string,
  confidence: number,
  push: (raw: string, conf: number) => void
): void {
  if (merged.length >= PLATE_MIN_LEN && merged.length <= PLATE_MAX_LEN) {
    push(merged, confidence);
  }
  for (let len = PLATE_MAX_LEN; len >= PLATE_MIN_LEN; len--) {
    for (let i = 0; i + len <= merged.length; i++) {
      push(merged.slice(i, i + len), confidence);
    }
  }
}

interface PlateCandidate {
  plate: string;
  score: number;
}

function normalizeOcrToken(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

function evaluateToken(raw: string, confidence: number): PlateCandidate | null {
  const cleaned = cleanPlateAlphanumeric(raw);
  if (cleaned.length < PLATE_MIN_LEN || cleaned.length > PLATE_MAX_LEN) return null;

  const tryAccept = (value: string, baseConfidence: number, corrected: boolean): PlateCandidate | null => {
    if (!isValidEuropeanPlate(value)) return null;
    const known = matchEuropeanPattern(value) !== null;
    const minConf = known
      ? corrected
        ? MIN_FIXED_CONFIDENCE
        : MIN_WORD_CONFIDENCE
      : MIN_GENERIC_CONFIDENCE;
    let score = baseConfidence + (baseConfidence >= 75 ? 15 : 0);
    if (!known) score -= 8;
    if (corrected) {
      const corrections = countCorrections(cleaned, value);
      score -= corrections * 12;
    }
    if (baseConfidence < minConf || score < MIN_ACCEPT_SCORE) return null;
    return { plate: formatEuropeanPlate(value), score };
  };

  const direct = tryAccept(cleaned, confidence, false);
  if (direct) return direct;

  const fixed = fixEuropeanPlateOcr(cleaned, 2);
  if (!fixed) return null;
  return tryAccept(fixed, confidence, true);
}

type TesseractWorker = Awaited<
  ReturnType<typeof import('tesseract.js')['createWorker']>
>;

let worker: TesseractWorker | null = null;
let workerInit: Promise<TesseractWorker> | null = null;
let ocrTail: Promise<void> = Promise.resolve();

async function createWorkerInstance(): Promise<TesseractWorker> {
  const { createWorker, PSM } = await import('tesseract.js');
  const instance = await createWorker('eng');
  await instance.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
    user_defined_dpi: '300',
  });
  return instance;
}

async function ensureWorker(): Promise<TesseractWorker> {
  if (worker) return worker;
  if (workerInit) return workerInit;

  workerInit = createWorkerInstance()
    .then((instance) => {
      worker = instance;
      return instance;
    })
    .finally(() => {
      workerInit = null;
    });

  return workerInit;
}

async function resetWorker(): Promise<void> {
  const current = worker;
  worker = null;
  workerInit = null;
  if (!current) return;
  try {
    await current.terminate();
  } catch {
    // Worker já encerrado.
  }
}

function isWorkerError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /postMessage|terminated|Worker/i.test(message);
}

function runOcr<T>(task: (w: TesseractWorker) => Promise<T>): Promise<T> {
  const job = ocrTail.then(async () => {
    const w = await ensureWorker();
    return task(w);
  });

  ocrTail = job.then(
    () => undefined,
    () => undefined
  );

  return job;
}

function extractCandidatesFromText(text: string, confidence: number): PlateCandidate[] {
  const candidates: PlateCandidate[] = [];
  const seen = new Set<string>();

  const push = (raw: string, conf: number) => {
    const match = evaluateToken(raw, conf);
    if (match && !seen.has(match.plate)) {
      seen.add(match.plate);
      candidates.push(match);
    }
  };

  for (const line of text.toUpperCase().split(/\n+/)) {
    const merged = line.replace(/[^A-Z0-9]/g, '');
    pushOcrLengths(merged, confidence, push);

    const tokens = line
      .split(/\s+/)
      .map((part) => part.replace(/[^A-Z0-9]/g, ''))
      .filter(Boolean);

    if (tokens.length >= 2) {
      pushOcrLengths(tokens.join(''), confidence, push);
    }

    for (const part of tokens) {
      pushOcrLengths(part, confidence, push);
    }
  }

  return candidates;
}

async function recognizePlatesOnImage(
  w: TesseractWorker,
  imageSource: string
): Promise<PlateCandidate[]> {
  const result = await w.recognize(imageSource);
  const candidates: PlateCandidate[] = [];
  const seen = new Set<string>();

  for (const word of result.data.words ?? []) {
    const match = evaluateToken(word.text, word.confidence);
    if (match && !seen.has(match.plate)) {
      seen.add(match.plate);
      candidates.push(match);
    }
  }

  for (const extra of extractCandidatesFromText(
    result.data.text,
    MIN_WORD_CONFIDENCE + 10
  )) {
    if (!seen.has(extra.plate)) {
      seen.add(extra.plate);
      candidates.push(extra);
    }
  }

  return candidates;
}

async function detectPlatesWithScores(imageSource: string): Promise<PlateCandidate[]> {
  try {
    return await runOcr((w) => recognizePlatesOnImage(w, imageSource));
  } catch (err) {
    if (!isWorkerError(err)) {
      console.error('Erro OCR:', err);
      return [];
    }

    await resetWorker();

    try {
      return await runOcr((w) => recognizePlatesOnImage(w, imageSource));
    } catch (retryErr) {
      console.error('Erro OCR (retry):', retryErr);
      return [];
    }
  }
}

type RegionOpts = {
  contrast?: boolean;
  scale?: number;
  maxWidth?: number;
};

function renderRegion(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  opts: RegionOpts = {}
): string {
  const { contrast = false, scale = 1, maxWidth = 1280 } = opts;
  const aspect = sh / sw;
  const dw = Math.min(maxWidth, sw * scale);
  const dh = Math.round(dw * aspect);

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  if (contrast) {
    const imageData = ctx.getImageData(0, 0, dw, dh);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const enhanced = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40);
      d[i] = d[i + 1] = d[i + 2] = enhanced;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/** Recortes focados onde a matrícula costuma aparecer. */
function generateImageVariants(img: HTMLImageElement): string[] {
  const w = img.width;
  const h = img.height;

  return [
    renderRegion(img, w * 0.08, h * 0.28, w * 0.84, h * 0.38, { scale: 2.5, contrast: true }),
    renderRegion(img, w * 0.05, h * 0.38, w * 0.9, h * 0.35, { scale: 2.5, contrast: true }),
    renderRegion(img, w * 0.1, h * 0.18, w * 0.8, h * 0.45, { scale: 2, contrast: true }),
    renderRegion(img, w * 0.12, h * 0.15, w * 0.76, h * 0.55, { scale: 3, contrast: true }),
    renderRegion(img, 0, 0, w, h, { scale: 1.5, contrast: true, maxWidth: 1600 }),
  ];
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = dataUrl;
  });
}

function mergeCandidates(all: PlateCandidate[]): string[] {
  const votes = new Map<string, { score: number; hits: number }>();

  for (const c of all) {
    const prev = votes.get(c.plate) ?? { score: 0, hits: 0 };
    prev.score = Math.max(prev.score, c.score);
    prev.hits += 1;
    votes.set(c.plate, prev);
  }

  const ranked = [...votes.entries()]
    .map(([plate, { score, hits }]) => ({
      plate,
      score: score + (hits > 1 ? 15 : 0),
    }))
    .filter(({ score }) => score >= MIN_ACCEPT_SCORE)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, MAX_AUTO_PLATES).map(({ plate }) => plate);
}

async function detectPlatesFromImageVariants(dataUrl: string): Promise<string[]> {
  const img = await loadImage(dataUrl);
  const variants = generateImageVariants(img);
  const allCandidates: PlateCandidate[] = [];

  for (const variant of variants) {
    const candidates = await detectPlatesWithScores(variant);
    allCandidates.push(...candidates);
  }

  return mergeCandidates(allCandidates);
}

async function detectViaAiApi(
  image: string,
  options: { register?: boolean; origem?: 'captura' | 'tempo_real' } = {}
): Promise<string[] | null> {
  try {
    const res = await fetch('/api/plates/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image,
        register: options.register ?? false,
        origem: options.origem ?? 'captura',
      }),
    });
    const data = await res.json();
    if (data.source === 'ai') return data.plates ?? [];
    if (data.fallback) return null;
  } catch {
    return null;
  }
  return null;
}

async function detectPlatesFromPhotoLocal(dataUrl: string): Promise<string[]> {
  try {
    return await detectPlatesFromImageVariants(dataUrl);
  } catch (err) {
    console.error('Erro OCR foto:', err);
    return [];
  }
}

async function registerPlatesClient(
  plates: string[],
  origem: 'captura' | 'tempo_real' = 'captura'
): Promise<void> {
  if (plates.length === 0) return;
  try {
    await fetch('/api/plates/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plates, origem }),
    });
  } catch {
    // Registro é best-effort.
  }
}

/** fast-alpr via API; se não achar matrícula, fallback Tesseract no navegador. */
export async function detectPlatesFromPhoto(
  dataUrl: string,
  options: { register?: boolean } = {}
): Promise<string[]> {
  const ai = await detectViaAiApi(dataUrl, {
    register: options.register,
    origem: 'captura',
  });

  if (ai !== null && ai.length > 0) return ai;

  const plates = await detectPlatesFromPhotoLocal(dataUrl);
  if (options.register && plates.length > 0) {
    await registerPlatesClient(plates, 'captura');
  }
  return plates;
}

function buildVideoSampleTimes(durationSec: number): number[] {
  const maxFrames = 5;
  if (durationSec <= 3) {
    return [durationSec / 2];
  }
  const step = durationSec / (maxFrames - 1);
  return Array.from({ length: maxFrames }, (_, i) =>
    Math.min(Math.max(0, durationSec - 0.05), i * step)
  );
}

async function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1) return;
  await new Promise<void>((resolve) => {
    video.addEventListener('loadedmetadata', () => resolve(), { once: true });
  });
}

async function seekVideoFrame(video: HTMLVideoElement, timeSec: number): Promise<string | null> {
  return new Promise((resolve) => {
    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(null);
      }
    };

    video.addEventListener('seeked', capture, { once: true });
    const maxTime = Math.max(0, (video.duration || 0) - 0.05);
    video.currentTime = Math.min(Math.max(0, timeSec), maxTime);
  });
}

async function detectPlatesFromVideoLocal(video: HTMLVideoElement): Promise<string[]> {
  await waitForVideoMetadata(video);

  const duration =
    video.duration && Number.isFinite(video.duration) ? video.duration : 0;
  const sampleTimes = duration > 0 ? buildVideoSampleTimes(duration) : [0];
  const allCandidates: PlateCandidate[] = [];

  for (const time of sampleTimes) {
    const frame = await seekVideoFrame(video, time);
    if (!frame) continue;

    const img = await loadImage(frame);
    for (const variant of generateImageVariants(img)) {
      const candidates = await detectPlatesWithScores(variant);
      allCandidates.push(...candidates);
    }
  }

  return mergeCandidates(allCandidates);
}

/** YOLO+EasyOCR via API, com fallback Tesseract no vídeo. */
export async function detectPlatesFromVideo(
  video: HTMLVideoElement,
  options: { register?: boolean } = {}
): Promise<string[]> {
  try {
    await waitForVideoMetadata(video);
    const duration =
      video.duration && Number.isFinite(video.duration) ? video.duration : 0;
    const sampleTimes = duration > 0 ? buildVideoSampleTimes(duration) : [0];
    let aiAvailable = false;

    for (const time of sampleTimes) {
      const frame = await seekVideoFrame(video, time);
      if (!frame) continue;
      const ai = await detectViaAiApi(frame, {
        register: options.register,
        origem: 'captura',
      });
      if (ai === null) break;
      aiAvailable = true;
      if (ai.length > 0) return ai;
    }

    const plates = await detectPlatesFromVideoLocal(video);
    if (options.register && plates.length > 0) {
      await registerPlatesClient(plates, 'captura');
    }
    return plates;
  } catch (err) {
    console.error('Erro OCR vídeo:', err);
    return [];
  }
}

async function detectPlatesFromCameraFrameLocal(dataUrl: string): Promise<string[]> {
  try {
    const img = await loadImage(dataUrl);
    const w = img.width;
    const h = img.height;
    const variants = [
      renderRegion(img, w * 0.12, h * 0.15, w * 0.76, h * 0.55, { scale: 2, contrast: true }),
      renderRegion(img, 0, 0, w, h, { scale: 1.2, contrast: true, maxWidth: 960 }),
    ];
    const allCandidates: PlateCandidate[] = [];
    for (const variant of variants) {
      const candidates = await detectPlatesWithScores(variant);
      allCandidates.push(...candidates);
    }
    return mergeCandidates(allCandidates);
  } catch {
    return [];
  }
}

/** Frame da câmera para leitura em tempo real (sem registrar). */
export async function detectPlatesFromCameraFrame(dataUrl: string): Promise<string[]> {
  const ai = await detectViaAiApi(dataUrl, { register: false, origem: 'tempo_real' });
  if (ai !== null && ai.length > 0) return ai;
  return detectPlatesFromCameraFrameLocal(dataUrl);
}

export async function checkPlateAiAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/plates/health');
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}
