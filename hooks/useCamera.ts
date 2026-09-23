'use client';

import { useCallback, useRef, useState } from 'react';
import { checkCameraSupport, isAbortError, type LocationError } from '@/lib/browser';

export function useCamera() {
  const initGenRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<LocationError | null>(null);

  const requestPermission = useCallback(async () => {
    const supportError = checkCameraSupport();
    if (supportError) {
      setCameraError(supportError);
      setCameraGranted(false);
      return false;
    }

    try {
      const result = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      result.getTracks().forEach((t) => t.stop());
      setCameraGranted(true);
      setCameraError(null);
      return true;
    } catch {
      setCameraGranted(false);
      setCameraError({
        code: 'denied',
        message: 'Permita a câmera nas configurações do Safari.',
      });
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    initGenRef.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const initCamera = useCallback(
    async (videoEl: HTMLVideoElement) => {
      const gen = ++initGenRef.current;
      const supportError = checkCameraSupport();
      if (supportError) throw supportError;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });

      if (gen !== initGenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }

      streamRef.current = stream;
      videoEl.srcObject = stream;

      try {
        await videoEl.play();
      } catch (err) {
        if (gen !== initGenRef.current || isAbortError(err)) return null;
        throw err;
      }

      if (gen !== initGenRef.current) return null;
      return stream;
    },
    [facingMode]
  );

  const switchCamera = useCallback(async (videoEl: HTMLVideoElement) => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    // Re-init happens via effect in component when facingMode changes
    return videoEl;
  }, []);

  const capturePhoto = useCallback((videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) => {
    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    canvasEl.width = w;
    canvasEl.height = h;
    const ctx = canvasEl.getContext('2d')!;
    ctx.drawImage(videoEl, 0, 0, w, h);
    return canvasEl.toDataURL('image/jpeg', 0.92);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      const mimeType = 'video/webm';
      if (!recorder || recorder.state === 'inactive') {
        resolve(new Blob(recordedChunksRef.current, { type: mimeType }));
        return;
      }
      recorder.addEventListener(
        'stop',
        () => resolve(new Blob(recordedChunksRef.current, { type: mimeType })),
        { once: true }
      );
      recorder.stop();
    });
  }, []);

  const startRecording = useCallback(
    (maxDurationSec: number, onTick: (elapsed: number) => void): Promise<Blob> => {
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(streamRef.current!, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      return new Promise((resolve, reject) => {
        let elapsed = 0;
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          clearInterval(interval);
          resolve(new Blob(recordedChunksRef.current, { type: mimeType }));
        };

        const interval = setInterval(() => {
          elapsed++;
          onTick(elapsed);
          if (elapsed >= maxDurationSec && recorder.state === 'recording') {
            recorder.stop();
          }
        }, 1000);

        recorder.onstop = finish;

        recorder.onerror = (e) => {
          if (settled) return;
          settled = true;
          clearInterval(interval);
          reject(e.error || e);
        };

        recorder.start(1000);
      });
    },
    []
  );

  return {
    cameraGranted,
    cameraError,
    facingMode,
    requestPermission,
    initCamera,
    switchCamera,
    stopCamera,
    capturePhoto,
    startRecording,
    stopRecording,
  };
}
