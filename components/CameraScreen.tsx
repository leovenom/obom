'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import { isAbortError } from '@/lib/browser';
import type { CaptureMode, IncidentType } from '@/lib/types';
import { INCIDENT_OPTIONS } from '@/lib/types';

export interface CameraHandle {
  getVideo: () => HTMLVideoElement | null;
  getCanvas: () => HTMLCanvasElement | null;
}

interface CameraScreenProps {
  incidentType: IncidentType;
  captureMode: CaptureMode;
  maxDuration: number;
  isRecording: boolean;
  recordingTime: string;
  locationLabel: string;
  facingMode: 'environment' | 'user';
  onIncidentChange: (type: IncidentType) => void;
  onModeChange: (mode: CaptureMode) => void;
  onDurationChange: (sec: number) => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onInitCamera: (video: HTMLVideoElement) => Promise<void>;
  onBack?: () => void;
  mountKey?: number;
  livePlate?: string | null;
  aiAvailable?: boolean;
  plateScanning?: boolean;
  isCapturing?: boolean;
}

const CameraScreen = forwardRef<CameraHandle, CameraScreenProps>(function CameraScreen(
  {
    incidentType,
    captureMode,
    maxDuration,
    isRecording,
    recordingTime,
    locationLabel,
    facingMode,
    onIncidentChange,
    onModeChange,
    onDurationChange,
    onCapture,
    onSwitchCamera,
    onInitCamera,
    onBack,
    mountKey = 0,
    livePlate = null,
    aiAvailable = false,
    plateScanning = false,
    isCapturing = false,
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
    getCanvas: () => canvasRef.current,
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    onInitCamera(video).catch((err) => {
      if (cancelled || isAbortError(err)) return;
      console.error('Câmera:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [facingMode, onInitCamera, mountKey]);

  return (
    <section className="screen active camera-screen">
      <ScreenHeader title="Capturar" onBack={onBack} />
      <div className="camera-header">
        <div className="status-bar">
          <span suppressHydrationWarning>{currentTime || '--:--'}</span>
          <span className="status-location" suppressHydrationWarning>
            {locationLabel}
          </span>
        </div>
        <select
          className="incident-select"
          value={incidentType}
          onChange={(e) => onIncidentChange(e.target.value as IncidentType)}
          aria-label="Tipo de ocorrência"
        >
          {INCIDENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} hidden />

        {(aiAvailable || livePlate || plateScanning) && (
          <div className="plate-live-badge">
            {livePlate ? (
              <span className="plate-live-badge__value">{livePlate}</span>
            ) : (
              <span className="plate-live-badge__scanning">
                {plateScanning ? 'A ler matrícula...' : aiAvailable ? 'IA ativa' : 'OCR ativo'}
              </span>
            )}
          </div>
        )}

        {isRecording && (
          <div className="recording-indicator">
            <span className="rec-dot" />
            <span>{recordingTime}</span>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${captureMode === 'photo' ? 'active' : ''}`}
            onClick={() => onModeChange('photo')}
          >
            Foto
          </button>
          <button
            className={`mode-btn ${captureMode === 'video' ? 'active' : ''}`}
            onClick={() => onModeChange('video')}
          >
            Vídeo
          </button>
        </div>

        {captureMode === 'video' && (
          <div className="duration-control">
            <label>
              Duração máx: <span>{maxDuration}s</span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={maxDuration}
              onChange={(e) => onDurationChange(parseInt(e.target.value, 10))}
              aria-label="Duração máxima do vídeo"
            />
          </div>
        )}

        <div className="capture-row">
          <button
            className="btn-icon"
            onClick={onSwitchCamera}
            title="Trocar câmera"
            aria-label="Trocar câmera"
          >
            <RefreshCw size={20} strokeWidth={2.25} />
          </button>
          <button
            className={`btn-capture ${isRecording ? 'recording' : ''} ${isCapturing ? 'busy' : ''}`}
            onClick={onCapture}
            disabled={isCapturing}
            title="Capturar"
            aria-label={isRecording ? 'Parar gravação' : 'Capturar'}
          />
          <button className="btn-icon" title="Flash" disabled aria-label="Flash">
            <Zap size={20} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </section>
  );
});

export default CameraScreen;
