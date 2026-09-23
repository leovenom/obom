import type { AuthorityReport } from '@/lib/commission';
import type { CaptureMetadata } from '@/lib/types';

export interface CaptureRecord {
  id: string;
  protocolo: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  mediaType: 'foto' | 'video';
  uploadedAt: string;
  userId: string;
  userEmail: string;
  userNome: string;
  metadata: CaptureMetadata;
  relatorioAutoridade: AuthorityReport;
}

export interface CaptureSummary {
  filename: string;
  protocolo: string;
  uploadedAt: string;
  mediaType: string;
  metadata: CaptureMetadata;
}

export interface UserCaptureGroup {
  userId: string;
  userNome: string;
  userEmail: string;
  totalCapturas: number;
  capturas: CaptureRecord[];
}
