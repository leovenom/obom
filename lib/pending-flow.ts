import type { Capture } from './types';

const STORAGE_KEY = 'obom_pending_flow';

export interface PendingFlowState {
  pendingSend: boolean;
  captureType: 'photo' | 'video';
  dataUrl?: string;
  videoBase64?: string;
  videoMime?: string;
  metadata: Capture['metadata'];
  plates: string[];
}

export async function savePendingFlow(capture: Capture, pendingSend = true): Promise<void> {
  const state: PendingFlowState = {
    pendingSend,
    captureType: capture.type,
    metadata: capture.metadata,
    plates: capture.plates,
  };

  if (capture.type === 'photo' && capture.dataUrl) {
    state.dataUrl = capture.dataUrl;
  } else if (capture.type === 'video' && capture.blob) {
    state.videoBase64 = await blobToBase64(capture.blob);
    state.videoMime = capture.blob.type || 'video/webm';
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadPendingFlow(): PendingFlowState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingFlowState;
  } catch {
    return null;
  }
}

export async function restoreCaptureFromPending(
  state: PendingFlowState
): Promise<{ capture: Capture; previewUrl: string } | null> {
  if (state.captureType === 'photo' && state.dataUrl) {
    return {
      capture: {
        type: 'photo',
        dataUrl: state.dataUrl,
        metadata: state.metadata,
        plates: state.plates,
      },
      previewUrl: state.dataUrl,
    };
  }

  if (state.captureType === 'video' && state.videoBase64) {
    const blob = base64ToBlob(state.videoBase64, state.videoMime || 'video/webm');
    const previewUrl = URL.createObjectURL(blob);
    return {
      capture: {
        type: 'video',
        blob,
        metadata: state.metadata,
        plates: state.plates,
      },
      previewUrl,
    };
  }

  return null;
}

export function clearPendingFlow(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
