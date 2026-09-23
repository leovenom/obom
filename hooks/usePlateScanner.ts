'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbortError } from '@/lib/browser';
import { checkPlateAiAvailable, detectPlatesFromCameraFrame } from '@/lib/plates';

const SCAN_INTERVAL_AI_MS = 1500;
const SCAN_INTERVAL_LOCAL_MS = 3500;
const CLEAR_AFTER_MISSES = 2;

interface UsePlateScannerOptions {
  enabled: boolean;
  getVideo: () => HTMLVideoElement | null;
  getCanvas: () => HTMLCanvasElement | null;
}

export function usePlateScanner({
  enabled,
  getVideo,
  getCanvas,
}: UsePlateScannerOptions) {
  const [livePlate, setLivePlate] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [scanning, setScanning] = useState(false);
  const busyRef = useRef(false);
  const missRef = useRef(0);
  const getVideoRef = useRef(getVideo);
  const getCanvasRef = useRef(getCanvas);

  getVideoRef.current = getVideo;
  getCanvasRef.current = getCanvas;

  const resetLivePlate = useCallback(() => {
    missRef.current = 0;
    setLivePlate(null);
  }, []);

  useEffect(() => {
    checkPlateAiAvailable().then(setAiAvailable);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setScanning(false);
      return;
    }

    let cancelled = false;
    missRef.current = 0;
    const intervalMs = aiAvailable ? SCAN_INTERVAL_AI_MS : SCAN_INTERVAL_LOCAL_MS;

    const tick = async () => {
      if (cancelled || busyRef.current) return;

      const video = getVideoRef.current();
      const canvas = getCanvasRef.current();
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const frame = canvas.toDataURL('image/jpeg', 0.85);

      busyRef.current = true;
      setScanning(true);

      try {
        const plates = await detectPlatesFromCameraFrame(frame);
        if (cancelled) return;

        if (plates.length > 0) {
          missRef.current = 0;
          setLivePlate(plates[0]);
        } else {
          missRef.current += 1;
          if (missRef.current >= CLEAR_AFTER_MISSES) {
            setLivePlate(null);
          }
        }
      } catch (err) {
        if (!isAbortError(err)) console.error('Scan tempo real:', err);
      } finally {
        busyRef.current = false;
        if (!cancelled) setScanning(false);
      }
    };

    const logTickError = (err: unknown) => {
      if (!isAbortError(err)) console.error('Scan tempo real:', err);
    };

    tick().catch(logTickError);

    const interval = window.setInterval(() => {
      tick().catch(logTickError);
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      setScanning(false);
    };
  }, [enabled, aiAvailable]);

  return {
    livePlate,
    aiAvailable,
    scanning,
    resetLivePlate,
  };
}
