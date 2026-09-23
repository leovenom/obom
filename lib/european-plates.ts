/** Matrículas europeias — padrões nacionais comuns + heurística genérica (exclui Mercosul). */

export type PlateSlot = 'L' | 'D';

export interface PlatePatternDef {
  id: string;
  slots: PlateSlot[];
  /** Agrupamento visual (ex.: [2,3,2] → AB 123 CD) */
  groups: number[];
}

/** Padrões fixos por país / família UE (sem bandeira lateral). */
export const EUROPEAN_PLATE_PATTERNS: PlatePatternDef[] = [
  { id: 'eu-ll-dd-ll', slots: ['L', 'L', 'D', 'D', 'L', 'L'], groups: [2, 2, 2] }, // PT, LU, SK…
  { id: 'pt-old', slots: ['D', 'D', 'L', 'L', 'D', 'D'], groups: [2, 2, 2] },
  { id: 'fr-it', slots: ['L', 'L', 'D', 'D', 'D', 'L', 'L'], groups: [2, 3, 2] }, // FR, IT, ES (novo)
  { id: 'es', slots: ['D', 'D', 'D', 'D', 'L', 'L', 'L'], groups: [4, 3] },
  { id: 'uk', slots: ['L', 'L', 'D', 'D', 'L', 'L', 'L'], groups: [2, 2, 3] },
  { id: 'pl-6', slots: ['L', 'L', 'D', 'D', 'D', 'D'], groups: [2, 4] },
  { id: 'pl-7', slots: ['L', 'L', 'D', 'D', 'D', 'D', 'D'], groups: [2, 5] },
  { id: 'nl-6a', slots: ['D', 'D', 'L', 'L', 'L', 'D'], groups: [2, 3, 1] },
  { id: 'nl-6b', slots: ['L', 'L', 'D', 'D', 'D', 'L'], groups: [2, 3, 1] },
  { id: 'be', slots: ['D', 'D', 'D', 'L', 'L', 'L'], groups: [3, 3] },
  { id: 'cz', slots: ['L', 'D', 'D', 'D', 'D', 'D', 'D'], groups: [1, 3, 3] },
  { id: 'de-7', slots: ['L', 'L', 'L', 'D', 'D', 'D', 'D'], groups: [3, 4] }, // simplificado
  { id: 'de-6', slots: ['L', 'L', 'D', 'D', 'D', 'D'], groups: [2, 4] },
  { id: 'ie-7', slots: ['D', 'D', 'L', 'D', 'D', 'D', 'D'], groups: [2, 1, 4] }, // 12-D-12345 compact
  { id: 'se-6', slots: ['L', 'L', 'L', 'D', 'D', 'D'], groups: [3, 3] },
  { id: 'hu-6', slots: ['L', 'L', 'L', 'D', 'D', 'D'], groups: [3, 3] },
  { id: 'ro-7', slots: ['L', 'L', 'D', 'D', 'L', 'L', 'L'], groups: [2, 2, 3] },
  { id: 'gr-6', slots: ['L', 'L', 'L', 'D', 'D', 'D'], groups: [3, 3] }, // latinizado OCR
  { id: 'at-7', slots: ['L', 'L', 'D', 'D', 'D', 'L', 'L'], groups: [2, 3, 2] },
  { id: 'dk-7', slots: ['L', 'L', 'D', 'D', 'D', 'D', 'D'], groups: [2, 5] },
  { id: 'fi-6', slots: ['L', 'L', 'L', 'D', 'D', 'D'], groups: [3, 3] },
  { id: 'no-6', slots: ['L', 'L', 'D', 'D', 'D', 'D'], groups: [2, 4] },
];

const LETTER_FIX: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

const DIGIT_FIX: Record<string, string> = {
  O: '0',
  Q: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  S: '5',
  G: '6',
  B: '8',
};

export function cleanPlateAlphanumeric(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Mercosul (Brasil) — rejeitar na validação europeia. */
export function isMercosulPlate(s: string): boolean {
  return s.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(s);
}

function matchesSlots(s: string, slots: PlateSlot[]): boolean {
  if (s.length !== slots.length) return false;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === 'L' && !/[A-Z]/.test(s[i])) return false;
    if (slots[i] === 'D' && !/[0-9]/.test(s[i])) return false;
  }
  return true;
}

function applySlotFixes(chars: string[], slots: PlateSlot[]): void {
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === 'L' && /\d/.test(chars[i])) {
      chars[i] = LETTER_FIX[chars[i]] ?? chars[i];
    }
    if (slots[i] === 'D' && /[A-Z]/.test(chars[i])) {
      chars[i] = DIGIT_FIX[chars[i]] ?? chars[i];
    }
  }
}

export function formatWithGroups(s: string, groups: number[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const g of groups) {
    parts.push(s.slice(i, i + g));
    i += g;
  }
  if (i < s.length) parts.push(s.slice(i));
  return parts.filter(Boolean).join(' ');
}

export function matchEuropeanPattern(s: string): PlatePatternDef | null {
  for (const p of EUROPEAN_PLATE_PATTERNS) {
    if (matchesSlots(s, p.slots)) return p;
  }
  return null;
}

export function isGenericEuropeanPlate(s: string): boolean {
  if (s.length < 5 || s.length > 8) return false;
  if (isMercosulPlate(s)) return false;
  if (matchEuropeanPattern(s)) return true;

  const letters = (s.match(/[A-Z]/g) ?? []).length;
  const digits = (s.match(/[0-9]/g) ?? []).length;
  if (letters < 2 || digits < 2) return false;
  if (!/^[A-Z0-9]+$/.test(s)) return false;
  if (letters === s.length || digits === s.length) return false;
  return true;
}

export function isValidEuropeanPlate(raw: string): boolean {
  const s = cleanPlateAlphanumeric(raw);
  if (!s) return false;
  if (isMercosulPlate(s)) return false;
  return matchEuropeanPattern(s) !== null || isGenericEuropeanPlate(s);
}

export function formatEuropeanPlate(raw: string): string {
  const s = cleanPlateAlphanumeric(raw);
  const matched = matchEuropeanPattern(s);
  if (matched) return formatWithGroups(s, matched.groups);
  if (isGenericEuropeanPlate(s)) {
    if (s.length <= 6) return formatWithGroups(s, [2, s.length - 2]);
    return formatWithGroups(s, [2, 3, s.length - 5]);
  }
  return s;
}

function countCorrections(a: string, b: string): number {
  let n = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) n++;
  }
  return n + Math.abs(a.length - b.length);
}

/** Corrige OCR tentando cada padrão com o mesmo comprimento. */
export function fixEuropeanPlateOcr(raw: string, maxCorrections = 2): string | null {
  const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper.length < 5 || upper.length > 8) return null;
  if (isMercosulPlate(upper)) return null;

  for (const pattern of EUROPEAN_PLATE_PATTERNS) {
    if (pattern.slots.length !== upper.length) continue;
    const chars = upper.split('');
    applySlotFixes(chars, pattern.slots);
    const candidate = chars.join('');
    if (matchesSlots(candidate, pattern.slots)) {
      const corrections = countCorrections(upper, candidate);
      if (corrections <= maxCorrections) return candidate;
    }
  }

  if (isGenericEuropeanPlate(upper)) return upper;
  return null;
}

export function normalizeEuropeanPlateInput(input: string): string | null {
  const cleaned = cleanPlateAlphanumeric(input);
  if (cleaned.length < 5 || cleaned.length > 8) return null;
  if (isValidEuropeanPlate(cleaned)) return formatEuropeanPlate(cleaned);
  const fixed = fixEuropeanPlateOcr(cleaned, 2);
  if (fixed && isValidEuropeanPlate(fixed)) return formatEuropeanPlate(fixed);
  return null;
}
