'use client';

import { signIn } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AuthScreen from '@/components/AuthScreen';
import ProfileScreen from '@/components/ProfileScreen';
import PermissionsScreen from '@/components/PermissionsScreen';
import CameraScreen, { type CameraHandle } from '@/components/CameraScreen';
import PreviewScreen from '@/components/PreviewScreen';
import SuccessScreen from '@/components/SuccessScreen';
import Toast from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useCamera } from '@/hooks/useCamera';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlateScanner } from '@/hooks/usePlateScanner';
import { fetchIpGeolocation, forwardGeocode, getGeoWithAddress } from '@/lib/browser';
import {
  applyOverlay,
  buildMetadata,
  dataUrlToBlob,
  formatDuration,
} from '@/lib/overlay';
import { formatCoordinates, parseCoordinateInput } from '@/lib/location';
import { detectPlatesFromPhoto, detectPlatesFromVideo } from '@/lib/plates';
import type { CaptureMetadata, LocationSource } from '@/lib/types';
import {
  clearPendingFlow,
  loadPendingFlow,
  restoreCaptureFromPending,
  savePendingFlow,
} from '@/lib/pending-flow';
import type { Capture, CaptureMode, IncidentType, Screen } from '@/lib/types';

export default function HomePage() {
  const {
    user,
    profileComplete,
    loading: authLoading,
    login,
    register,
    updateProfile,
    logout,
    refresh,
  } = useAuth();

  const [screen, setScreen] = useState<Screen>('permissions');
  const [incidentType, setIncidentType] = useState<IncidentType>('transito');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [maxDuration, setMaxDuration] = useState(30);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [currentCapture, setCurrentCapture] = useState<Capture | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [platesLoading, setPlatesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [successData, setSuccessData] = useState<{
    message: string;
    protocolo?: string;
  }>({ message: '' });
  const [toast, setToast] = useState<{ message: string; type: 'error' | '' } | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);

  const cameraRef = useRef<CameraHandle>(null);
  const recordingStartedAt = useRef<number | null>(null);
  const pendingSendRef = useRef(false);
  const photoRawRef = useRef('');
  const livePlateRef = useRef<string | null>(null);

  const getCameraVideo = useCallback(
    () => cameraRef.current?.getVideo() ?? null,
    []
  );
  const getCameraCanvas = useCallback(
    () => cameraRef.current?.getCanvas() ?? null,
    []
  );

  const { livePlate, aiAvailable, scanning: plateScanning, resetLivePlate } =
    usePlateScanner({
      enabled: screen === 'camera' && !isRecording,
      getVideo: getCameraVideo,
      getCanvas: getCameraCanvas,
    });

  livePlateRef.current = livePlate;

  const {
    cameraGranted,
    cameraError,
    facingMode,
    requestPermission,
    initCamera,
    switchCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    stopCamera,
  } = useCamera();

  const {
    geo,
    locationGranted,
    locationError,
    locationLoading,
    requestLocationPermission,
    ensureLocation,
    ensureLocationForCapture,
    retryLocation,
  } = useGeolocation();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (screen !== 'camera') {
      stopCamera();
    }
  }, [screen, stopCamera]);


  const locationLabel = (() => {
    if (locationError?.code === 'insecure' && !geo.position) return '📍 HTTPS necessário';
    if (locationLoading && !geo.position) return '📍 Obtendo localização...';
    if (locationError && !geo.position) return '📍 Geolocalização indisponível';
    if (geo.address) return '📍 ' + geo.address;
    if (geo.position) {
      return `📍 ${geo.position.latitude.toFixed(4)}, ${geo.position.longitude.toFixed(4)}`;
    }
    return '📍 Obtendo...';
  })();

  const showToast = useCallback((message: string, type: 'error' | '' = '') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const performUpload = useCallback(async () => {
    if (!currentCapture) return;

    setSending(true);
    try {
      let blob: Blob;
      let filename: string;

      if (currentCapture.type === 'photo' && currentCapture.dataUrl) {
        blob = dataUrlToBlob(currentCapture.dataUrl);
        filename = `foto-${Date.now()}.jpg`;
      } else if (currentCapture.blob) {
        blob = currentCapture.blob;
        filename = `video-${Date.now()}.webm`;
      } else {
        throw new Error('Captura inválida');
      }

      const formData = new FormData();
      formData.append('media', blob, filename);
      formData.append('metadata', JSON.stringify(currentCapture.metadata));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha no envio');
      }

      const result = await res.json();
      setSuccessData({
        message:
          'Evidência enviada. O protocolo ajuda a agregar ocorrências para as autoridades competentes.',
        protocolo: result.record.protocolo,
      });
      setScreen('success');
    } catch (err) {
      showToast('Erro no envio: ' + (err as Error).message, 'error');
    } finally {
      setSending(false);
    }
  }, [currentCapture, showToast]);

  const continueAfterAuth = useCallback(async () => {
    await refresh();
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!data.user) return;

    if (!data.profileComplete) {
      setScreen('profile');
      return;
    }

    if (pendingSendRef.current) {
      pendingSendRef.current = false;
      await performUpload();
    }
  }, [refresh, performUpload]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      await continueAfterAuth();
    },
    [login, continueAfterAuth]
  );

  const handleRegister = useCallback(
    async (fields: { email: string; password: string }) => {
      await register(fields);
      await continueAfterAuth();
    },
    [register, continueAfterAuth]
  );

  const handleGoogleLogin = useCallback(async () => {
    if (!currentCapture) {
      throw new Error('Nenhuma captura para enviar');
    }
    pendingSendRef.current = true;
    await savePendingFlow(currentCapture, true);
    await signIn('google', { callbackUrl: '/?oauth=1' });
  }, [currentCapture]);

  useEffect(() => {
    if (authLoading) return;

    async function resumePendingFlow() {
      const pending = loadPendingFlow();
      if (!pending) return;

      const restored = await restoreCaptureFromPending(pending);
      if (restored) {
        setCurrentCapture(restored.capture);
        setPreviewUrl(restored.previewUrl);
      }

      if (!pending.pendingSend) {
        clearPendingFlow();
        return;
      }

      pendingSendRef.current = true;
      window.history.replaceState({}, '', '/');

      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.user) {
        setScreen('auth');
        return;
      }

      await refresh();
      clearPendingFlow();

      if (!data.profileComplete) {
        setScreen('profile');
        return;
      }

      setScreen('preview');
      pendingSendRef.current = true;
      await continueAfterAuth();
    }

    resumePendingFlow();
  }, [authLoading, refresh, continueAfterAuth]);

  const handleProfileSave = useCallback(
    async (fields: { nome: string; telefone: string }) => {
      await updateProfile(fields);
      pendingSendRef.current = true;
      await continueAfterAuth();
    },
    [updateProfile, continueAfterAuth]
  );

  const handleStart = useCallback(async () => {
    await requestLocationPermission();
    setCameraKey((k) => k + 1);
    setScreen('camera');
  }, [requestLocationPermission]);

  const handleBackToPermissions = useCallback(() => {
    stopCamera();
    setScreen('permissions');
  }, [stopCamera]);

  const handleInitCamera = useCallback(
    async (video: HTMLVideoElement) => {
      await initCamera(video);
    },
    [initCamera]
  );

  const handleSwitchCamera = useCallback(async () => {
    const video = cameraRef.current?.getVideo();
    if (video) await switchCamera(video);
  }, [switchCamera]);

  const processPhoto = useCallback(
    async (rawDataUrl: string, captureGeo = geo) => {
      const metadata = buildMetadata(captureGeo, incidentType);
      photoRawRef.current = rawDataUrl;
      setPreviewUrl(rawDataUrl);
      setCurrentCapture({ type: 'photo', dataUrl: rawDataUrl, metadata, plates: [] });
      setPlatesLoading(true);
      setScreen('preview');

      const preDetected = livePlateRef.current ? [livePlateRef.current] : [];
      resetLivePlate();

      const ocrPlates = await detectPlatesFromPhoto(rawDataUrl, { register: true });
      const plates = [...new Set([...preDetected, ...ocrPlates])];
      metadata.plates = plates;
      const finalDataUrl = await applyOverlay(rawDataUrl, metadata);
      setPreviewUrl(finalDataUrl);
      setCurrentCapture({ type: 'photo', dataUrl: finalDataUrl, metadata, plates });
      setPlatesLoading(false);
    },
    [geo, incidentType, resetLivePlate]
  );

  const processVideo = useCallback(
    async (blob: Blob, durationMs: number | null, captureGeo = geo) => {
      const durationSec = durationMs ? Math.round(durationMs / 1000) : maxDuration;
      const metadata = buildMetadata(captureGeo, incidentType, {
        duration: formatDuration(durationSec),
        durationSeconds: durationSec,
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCurrentCapture({ type: 'video', blob, metadata, plates: [] });
      setPlatesLoading(true);
      setScreen('preview');

      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      await new Promise<void>((resolve) => {
        video.addEventListener('loadeddata', () => resolve(), { once: true });
      });

      const preDetected = livePlateRef.current ? [livePlateRef.current] : [];
      resetLivePlate();

      const ocrPlates = await detectPlatesFromVideo(video, { register: true });
      const plates = [...new Set([...preDetected, ...ocrPlates])];
      metadata.plates = plates;
      setCurrentCapture({ type: 'video', blob, metadata, plates });
      setPlatesLoading(false);
    },
    [geo, incidentType, maxDuration, resetLivePlate]
  );

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;

    const video = cameraRef.current?.getVideo();
    const canvas = cameraRef.current?.getCanvas();

    setIsCapturing(true);
    try {
      if (isRecording) {
        const elapsed = recordingStartedAt.current ? Date.now() - recordingStartedAt.current : null;
        const blob = await stopRecording();
        setIsRecording(false);
        recordingStartedAt.current = null;
        setRecordingTime('00:00');
        const captureGeo = await ensureLocationForCapture();
        await processVideo(blob, elapsed, captureGeo);
        return;
      }

      if (captureMode === 'photo') {
        if (!video || !canvas || !video.videoWidth) {
          showToast('Aguarde a câmera carregar', 'error');
          return;
        }
        const rawDataUrl = capturePhoto(video, canvas);
        const captureGeo = await ensureLocationForCapture();
        await processPhoto(rawDataUrl, captureGeo);
        return;
      }

      setIsRecording(true);
      recordingStartedAt.current = Date.now();
      void ensureLocationForCapture();

      try {
        const blob = await startRecording(maxDuration, (elapsed) => {
          setRecordingTime(formatDuration(elapsed));
        });
        const elapsed = recordingStartedAt.current ? Date.now() - recordingStartedAt.current : null;
        const captureGeo = await ensureLocationForCapture();
        await processVideo(blob, elapsed, captureGeo);
      } catch (err) {
        showToast('Erro na gravação: ' + (err as Error).message, 'error');
      } finally {
        setIsRecording(false);
        recordingStartedAt.current = null;
        setRecordingTime('00:00');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [
    isCapturing,
    isRecording,
    captureMode,
    capturePhoto,
    startRecording,
    stopRecording,
    maxDuration,
    processPhoto,
    processVideo,
    ensureLocationForCapture,
    showToast,
  ]);

  const handleBackToCamera = useCallback(() => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setCurrentCapture(null);
    setPreviewUrl('');
    photoRawRef.current = '';
    pendingSendRef.current = false;
    setCameraKey((k) => k + 1);
    setScreen('camera');
  }, [previewUrl]);

  const handleBackToPreview = useCallback(() => {
    pendingSendRef.current = false;
    setScreen('preview');
  }, []);

  const applyCaptureMetadata = useCallback(
    async (metadata: CaptureMetadata) => {
      if (!currentCapture) return;

      if (currentCapture.type === 'photo' && photoRawRef.current) {
        const finalDataUrl = await applyOverlay(photoRawRef.current, metadata);
        setPreviewUrl(finalDataUrl);
        setCurrentCapture({ ...currentCapture, dataUrl: finalDataUrl, metadata, plates: metadata.plates ?? currentCapture.plates });
        return;
      }

      setCurrentCapture({ ...currentCapture, metadata, plates: metadata.plates ?? currentCapture.plates });
    },
    [currentCapture]
  );

  const updateCapturePlates = useCallback(
    async (plates: string[]) => {
      if (!currentCapture) return;
      await applyCaptureMetadata({ ...currentCapture.metadata, plates });
    },
    [currentCapture, applyCaptureMetadata]
  );

  const updateCaptureLocation = useCallback(
    async (fields: {
      address: string | null;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      locationSource: LocationSource;
    }) => {
      if (!currentCapture) return;

      const hasCoords =
        typeof fields.latitude === 'number' && typeof fields.longitude === 'number';

      await applyCaptureMetadata({
        ...currentCapture.metadata,
        address: fields.address,
        latitude: fields.latitude,
        longitude: fields.longitude,
        accuracy: fields.accuracy,
        coordinates: hasCoords
          ? formatCoordinates(fields.latitude!, fields.longitude!)
          : null,
        locationSource: fields.locationSource,
      });
    },
    [currentCapture, applyCaptureMetadata]
  );

  const handleSetManualLocation = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) throw new Error('Local vazio');

      setLocationUpdating(true);
      try {
        const coords = parseCoordinateInput(trimmed);
        if (coords) {
          const geo = await getGeoWithAddress({ ...coords, accuracy: 0 });
          await updateCaptureLocation({
            address: geo.address || formatCoordinates(coords.latitude, coords.longitude),
            latitude: coords.latitude,
            longitude: coords.longitude,
            locationSource: 'manual',
          });
          return;
        }

        const geocoded = await forwardGeocode(trimmed);
        await updateCaptureLocation({
          address: geocoded.address || trimmed,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          locationSource: 'manual',
        });
      } finally {
        setLocationUpdating(false);
      }
    },
    [updateCaptureLocation]
  );

  const handleRetryGpsLocation = useCallback(async () => {
    setLocationUpdating(true);
    try {
      let data = await ensureLocation();
      if (!data.position) {
        const ipData = await fetchIpGeolocation();
        if (ipData?.position) data = ipData;
      }

      if (!data.position) {
        showToast('Não foi possível obter a localização. Adicione o local manualmente.', 'error');
        throw new Error('Geolocalização indisponível');
      }

      await updateCaptureLocation({
        address: data.address,
        latitude: data.position.latitude,
        longitude: data.position.longitude,
        accuracy: data.position.accuracy,
        locationSource: data.source === 'ip' ? 'ip' : 'gps',
      });
    } finally {
      setLocationUpdating(false);
    }
  }, [ensureLocation, updateCaptureLocation, showToast]);

  const handleAddPlate = useCallback(
    async (plate: string) => {
      if (!currentCapture) return;
      const plates = [...new Set([...currentCapture.plates, plate])];
      await updateCapturePlates(plates);
    },
    [currentCapture, updateCapturePlates]
  );

  const handleRemovePlate = useCallback(
    async (plate: string) => {
      if (!currentCapture) return;
      const plates = currentCapture.plates.filter((p) => p !== plate);
      await updateCapturePlates(plates);
    },
    [currentCapture, updateCapturePlates]
  );

  const handleSend = useCallback(async () => {
    if (!currentCapture || platesLoading) return;

    if (!user) {
      pendingSendRef.current = true;
      setScreen('auth');
      return;
    }

    if (!profileComplete) {
      pendingSendRef.current = true;
      setScreen('profile');
      return;
    }

    await performUpload();
  }, [currentCapture, platesLoading, user, profileComplete, performUpload]);

  const handleNewCapture = useCallback(() => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setCurrentCapture(null);
    setPreviewUrl('');
    photoRawRef.current = '';
    pendingSendRef.current = false;
    setCameraKey((k) => k + 1);
    setScreen('camera');
  }, [previewUrl]);

  if (authLoading) {
    return (
      <div className="app-root loading-screen">
        <div className="spinner" role="status" aria-label="Carregando" />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      {screen === 'permissions' && (
        <PermissionsScreen
          cameraGranted={cameraGranted}
          cameraError={cameraError?.message}
          locationGranted={locationGranted}
          locationError={locationError?.message}
          locationErrorCode={locationError?.code}
          locationLoading={locationLoading}
          locationPreview={geo.address}
          onRequestLocation={requestLocationPermission}
          onRetryLocation={retryLocation}
          onStart={handleStart}
          userName={user?.nome}
          onLogout={user ? logout : undefined}
        />
      )}

      {screen === 'camera' && (
        <CameraScreen
          key={cameraKey}
          ref={cameraRef}
          mountKey={cameraKey}
          incidentType={incidentType}
          captureMode={captureMode}
          maxDuration={maxDuration}
          isRecording={isRecording}
          recordingTime={recordingTime}
          locationLabel={locationLabel}
          facingMode={facingMode}
          onIncidentChange={setIncidentType}
          onModeChange={setCaptureMode}
          onDurationChange={setMaxDuration}
          onCapture={handleCapture}
          onSwitchCamera={handleSwitchCamera}
          onInitCamera={handleInitCamera}
          onBack={handleBackToPermissions}
          livePlate={livePlate}
          aiAvailable={aiAvailable}
          plateScanning={plateScanning}
          isCapturing={isCapturing}
        />
      )}

      {screen === 'preview' && currentCapture && (
        <PreviewScreen
          capture={currentCapture}
          previewUrl={previewUrl}
          platesLoading={platesLoading}
          sending={sending}
          locationUpdating={locationUpdating}
          onBack={handleBackToCamera}
          onRetake={handleBackToCamera}
          onSend={handleSend}
          onAddPlate={handleAddPlate}
          onRemovePlate={handleRemovePlate}
          onSetManualLocation={handleSetManualLocation}
          onRetryGpsLocation={handleRetryGpsLocation}
        />
      )}

      {screen === 'auth' && (
        <AuthScreen
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
          onBack={handleBackToPreview}
        />
      )}

      {screen === 'profile' && user && (
        <ProfileScreen
          user={user}
          onSave={handleProfileSave}
          onBack={handleBackToPreview}
        />
      )}

      {screen === 'success' && (
        <SuccessScreen
          message={successData.message}
          protocolo={successData.protocolo}
          onBack={handleNewCapture}
          onNewCapture={handleNewCapture}
        />
      )}

      <Toast message={toast?.message ?? ''} type={toast?.type} visible={!!toast} />
    </div>
  );
}
