export type IncidentType =
  | 'verificacao'
  | 'transito'
  | 'acidente'
  | 'estacionamento'
  | 'outro';

export type Screen = 'permissions' | 'camera' | 'preview' | 'auth' | 'profile' | 'success';

export type CaptureMode = 'photo' | 'video';

export type LocationSource = 'gps' | 'ip' | 'manual';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeoData {
  position: GeoPosition | null;
  address: string | null;
  source?: LocationSource;
}

export interface CaptureMetadata {
  datetime: string;
  timestamp: string;
  timezone: string;
  coordinates: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address: string | null;
  locationSource?: LocationSource;
  incidentType: IncidentType;
  duration?: string;
  durationSeconds?: number;
  plates?: string[];
}

export interface Capture {
  type: CaptureMode;
  dataUrl?: string;
  blob?: Blob;
  metadata: CaptureMetadata;
  plates: string[];
}

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  verificacao: 'Verificação de placa',
  transito: 'Trânsito / Congestionamento',
  acidente: 'Acidente / Ocorrência',
  estacionamento: 'Estacionamento irregular',
  outro: 'Outro',
};

export const INCIDENT_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: 'transito', label: INCIDENT_LABELS.transito },
  { value: 'acidente', label: INCIDENT_LABELS.acidente },
  { value: 'estacionamento', label: INCIDENT_LABELS.estacionamento },
  { value: 'outro', label: INCIDENT_LABELS.outro },
];
