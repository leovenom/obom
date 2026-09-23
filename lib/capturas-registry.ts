import { useCloudPersistence } from '@/lib/persistence/config';
import * as local from '@/lib/capturas-local';
import * as cloud from '@/lib/capturas-cloud';
import type { CaptureRecord, CaptureSummary, UserCaptureGroup } from '@/lib/capturas-types';

export type { CaptureRecord, CaptureSummary, UserCaptureGroup } from '@/lib/capturas-types';

export async function registerCapture(record: CaptureRecord): Promise<CaptureRecord> {
  if (useCloudPersistence()) return cloud.cloudRegisterCapture(record);
  return local.localRegisterCapture(record);
}

export async function getCapturasByUser(userId: string): Promise<CaptureSummary[]> {
  if (useCloudPersistence()) return cloud.cloudGetCapturasByUser(userId);
  return local.localGetCapturasByUser(userId);
}

export async function getAllCapturas(): Promise<CaptureRecord[]> {
  if (useCloudPersistence()) return cloud.cloudGetAllCapturas();
  return local.localGetAllCapturas();
}

export async function getCaptureById(id: string): Promise<CaptureRecord | null> {
  if (useCloudPersistence()) return cloud.cloudGetCaptureById(id);
  return local.localGetCaptureById(id);
}

export async function syncLegacyUploads(): Promise<number> {
  if (useCloudPersistence()) return 0;
  return local.localSyncLegacyUploads();
}

export async function getCapturasGroupedByUser(): Promise<UserCaptureGroup[]> {
  if (useCloudPersistence()) return cloud.cloudGetCapturasGroupedByUser();
  return local.localGetCapturasGroupedByUser();
}
