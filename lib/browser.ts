import type { GeoData, GeoPosition } from './types';

export type LocationErrorCode =
  | 'unsupported'
  | 'insecure'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export interface LocationError {
  code: LocationErrorCode;
  message: string;
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export interface ForwardGeocodeResult {
  address: string;
  latitude?: number;
  longitude?: number;
}

/** Fallback gratuito por IP (~cidade). Não exige permissão do browser. */
export async function fetchIpGeolocation(): Promise<GeoData | null> {
  try {
    const res = await fetch('/api/geolocation/ip');
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;

    return {
      position: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: typeof data.accuracy === 'number' ? data.accuracy : 5000,
      },
      address: data.address || formatCoords(data.latitude, data.longitude),
      source: 'ip',
    };
  } catch {
    return null;
  }
}

export async function forwardGeocode(query: string): Promise<ForwardGeocodeResult> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error('Endereço vazio');

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return { address: trimmed };
    const data = await res.json();
    return {
      address: data.address || trimmed,
      latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
      longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
    };
  } catch {
    return { address: trimmed };
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) return formatCoords(lat, lng);
    const data = await res.json();
    return data.address || formatCoords(lat, lng);
  } catch {
    return formatCoords(lat, lng);
  }
}

/** play()/fetch() cancelados ao trocar câmera ou sair do ecrã — não é falha real. */
export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** Melhor esforço para abrir Ajustes do sistema (iOS/Android). Retorna o destino usado. */
export function getLocationSettingsTarget(): string | null {
  if (isAndroidDevice()) {
    return 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
  }
  if (isIOSDevice()) {
    // Safari não permite deep link direto à permissão de GPS; abre o app Ajustes.
    return 'app-settings:';
  }
  return null;
}

export function openLocationSettings(): boolean {
  const target = getLocationSettingsTarget();
  if (!target || typeof window === 'undefined') return false;
  window.location.href = target;
  return true;
}

export function getLocationDeniedHelp(): string {
  if (isIOSDevice()) {
    return 'Toque em "Abrir Ajustes" abaixo. Depois: Privacidade → Serviços de Localização → Safari → "Ao usar o App". Volte aqui e toque em Tentar novamente.';
  }
  if (isAndroidDevice()) {
    return 'Toque em "Abrir Ajustes" e permita a localização para o navegador.';
  }
  return 'Permita a localização no ícone do cadeado/endereço na barra do navegador e tente novamente.';
}

function mapGeoError(err: GeolocationPositionError | Error): LocationError {
  if (err instanceof GeolocationPositionError) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return {
          code: 'denied',
          message: getLocationDeniedHelp(),
        };
      case err.POSITION_UNAVAILABLE:
        return {
          code: 'unavailable',
          message: 'Ative a localização do celular e tente novamente.',
        };
      case err.TIMEOUT:
        return {
          code: 'timeout',
          message: 'Tempo esgotado ao obter a localização. Verifique se a geolocalização está ativa.',
        };
      default:
        return { code: 'unknown', message: 'Não foi possível obter a localização.' };
    }
  }
  return { code: 'unknown', message: err.message || 'Erro de localização.' };
}

export const INSECURE_CONTEXT_MESSAGE =
  'Câmera e geolocalização exigem HTTPS no iPhone. No Mac, rode npm run dev:mobile e acesse https://SEU-IP:3001 no Safari (aceite o certificado em "Mostrar detalhes").';

export function checkSecureContext(): LocationError | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) {
    return { code: 'insecure', message: INSECURE_CONTEXT_MESSAGE };
  }
  return null;
}

export function checkCameraSupport(): LocationError | null {
  if (typeof window === 'undefined') return null;
  const insecure = checkSecureContext();
  if (insecure) return insecure;
  if (!navigator.mediaDevices?.getUserMedia) {
    return { code: 'unsupported', message: 'Este navegador não suporta câmera.' };
  }
  return null;
}

export function checkLocationSupport(): LocationError | null {
  if (typeof window === 'undefined') return null;
  if (!navigator.geolocation) {
    return { code: 'unsupported', message: 'Este navegador não suporta geolocalização.' };
  }
  const insecure = checkSecureContext();
  if (insecure) return insecure;
  return null;
}

export async function requestLocation(timeoutMs = 20000): Promise<GeoPosition> {
  const supportError = checkLocationSupport();
  if (supportError) throw supportError;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(mapGeoError(err)),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 }
    );
  });
}

export function watchLocation(
  onUpdate: (geo: GeoData) => void,
  onError?: (error: LocationError) => void
): number | null {
  const supportError = checkLocationSupport();
  if (supportError) {
    onError?.(supportError);
    return null;
  }

  return navigator.geolocation.watchPosition(
    async (pos) => {
      const position: GeoPosition = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      // Mostra coordenadas imediatamente; endereço vem depois
      onUpdate({ position, address: formatCoords(position.latitude, position.longitude) });
      const address = await reverseGeocode(position.latitude, position.longitude);
      onUpdate({ position, address });
    },
    (err) => onError?.(mapGeoError(err)),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
}

export async function getGeoWithAddress(position: GeoPosition): Promise<GeoData> {
  const coords = formatCoords(position.latitude, position.longitude);
  const address = await reverseGeocode(position.latitude, position.longitude);
  return { position, address: address || coords };
}

export async function requestCameraPermission(): Promise<boolean> {
  const result = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  result.getTracks().forEach((t) => t.stop());
  return true;
}
