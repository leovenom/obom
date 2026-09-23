'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Plus, Send, X } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import { normalizePlateInput } from '@/lib/plates';
import type { Capture, CaptureMetadata } from '@/lib/types';
import { INCIDENT_LABELS } from '@/lib/types';

interface PreviewScreenProps {
  capture: Capture;
  previewUrl: string;
  platesLoading: boolean;
  sending: boolean;
  locationUpdating?: boolean;
  onBack: () => void;
  onRetake: () => void;
  onSend: () => void;
  onAddPlate?: (plate: string) => void;
  onRemovePlate?: (plate: string) => void;
  onSetManualLocation?: (input: string) => Promise<void>;
  onRetryGpsLocation?: () => Promise<void>;
}

function locationLabel(metadata: CaptureMetadata): string {
  return metadata.address || 'Indisponível';
}

function MetadataList({ metadata }: { metadata: CaptureMetadata }) {
  const items: [string, string | undefined][] = [
    ['Data/Hora', metadata.datetime],
    ['Fuso horário', metadata.timezone],
    ['Local', locationLabel(metadata)],
    ['Tipo', INCIDENT_LABELS[metadata.incidentType] || metadata.incidentType],
  ];
  if (metadata.duration) items.push(['Duração', metadata.duration]);

  return (
    <dl className="metadata-list">
      {items.map(([dt, dd]) => (
        <div key={dt} style={{ display: 'contents' }}>
          <dt>{dt}</dt>
          <dd>{dd || '-'}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PreviewScreen({
  capture,
  previewUrl,
  platesLoading,
  sending,
  locationUpdating = false,
  onBack,
  onRetake,
  onSend,
  onAddPlate,
  onRemovePlate,
  onSetManualLocation,
  onRetryGpsLocation,
}: PreviewScreenProps) {
  const [manualPlate, setManualPlate] = useState('');
  const [plateError, setPlateError] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [locationError, setLocationError] = useState('');

  const hasLocation = Boolean(capture.metadata.address || capture.metadata.coordinates);

  useEffect(() => {
    if (!manualLocation && capture.metadata.address && capture.metadata.locationSource === 'manual') {
      setManualLocation(capture.metadata.address);
    }
  }, [capture.metadata.address, capture.metadata.locationSource, manualLocation]);

  const handleAddPlate = () => {
    const plate = normalizePlateInput(manualPlate);
    if (!plate) {
      setPlateError('Matrícula europeia inválida. Ex.: AB 12 CD, AB 123 CD, 1234 BCD');
      return;
    }
    setPlateError('');
    setManualPlate('');
    onAddPlate?.(plate);
  };

  const handleApplyLocation = async () => {
    const value = manualLocation.trim();
    if (!value) {
      setLocationError('Digite um endereço ou coordenadas (ex: 38.7223, -9.1393)');
      return;
    }
    if (!onSetManualLocation) return;

    setLocationError('');
    try {
      await onSetManualLocation(value);
    } catch {
      setLocationError('Não foi possível aplicar o local. Tente coordenadas ou outro endereço.');
    }
  };

  const handleRetryGps = async () => {
    if (!onRetryGpsLocation) return;
    setLocationError('');
    try {
      await onRetryGpsLocation();
    } catch {
      setLocationError('Geolocalização indisponível. Adicione o local manualmente.');
    }
  };

  return (
    <section className="screen active preview-screen">
      <ScreenHeader title="Revisar captura" onBack={onBack} />

      <div className="preview-media">
        {capture.type === 'photo' ? (
          <img src={previewUrl} alt="Preview da captura" />
        ) : (
          <video src={previewUrl} controls playsInline />
        )}
      </div>

      <div className="preview-info">
        <div className="info-card info-card--muted">
          <h3>Metadados</h3>
          <MetadataList metadata={capture.metadata} />
          {(onSetManualLocation || onRetryGpsLocation) && (
            <div className="location-manual">
              {!hasLocation && (
                <p className="location-manual__hint">
                  Geolocalização indisponível — adicione o local manualmente ou tente obter a localização automática.
                </p>
              )}
              {onSetManualLocation && (
                <>
                  <input
                    className="form-input location-manual__input"
                    placeholder="Endereço ou coordenadas (ex: Av. da Liberdade, Lisboa)"
                    value={manualLocation}
                    onChange={(e) => {
                      setManualLocation(e.target.value);
                      setLocationError('');
                    }}
                    aria-label="Local manual"
                    disabled={locationUpdating}
                  />
                  <div className="location-manual__actions">
                    <button
                      type="button"
                      className="btn btn-outline location-manual__btn"
                      onClick={handleApplyLocation}
                      disabled={locationUpdating || sending}
                    >
                      <MapPin size={16} strokeWidth={2.25} />
                      {locationUpdating ? 'Aplicando...' : 'Aplicar local'}
                    </button>
                    {onRetryGpsLocation && (
                      <button
                        type="button"
                        className="btn btn-secondary location-manual__btn"
                        onClick={handleRetryGps}
                        disabled={locationUpdating || sending}
                      >
                        <Navigation size={16} strokeWidth={2.25} />
                        Usar geolocalização
                      </button>
                    )}
                  </div>
                </>
              )}
              {locationError && <p className="location-manual__error">{locationError}</p>}
            </div>
          )}
        </div>

        <div className="info-card info-card--primary">
          <h3>Matrículas detectadas</h3>
          <div className="plates-list">
            {platesLoading ? (
              <span className="loading">
                {capture.type === 'video' ? 'Analisando vídeo...' : 'Analisando foto...'}
              </span>
            ) : capture.plates.length === 0 ? (
              <span className="none">Nenhuma matrícula detectada — adicione manualmente abaixo</span>
            ) : (
              capture.plates.map((p) => (
                <span key={p} className="plate-tag">
                  {p}
                  {onRemovePlate && (
                    <button
                      type="button"
                      className="plate-tag__remove"
                      onClick={() => onRemovePlate(p)}
                      aria-label={`Remover placa ${p}`}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          {!platesLoading && onAddPlate && (
            <div className="plate-manual-add">
              <input
                className="form-input plate-manual-add__input"
                placeholder="Matrícula UE (ex.: AB 12 CD, AB 123 CD)"
                value={manualPlate}
                onChange={(e) => {
                  setManualPlate(e.target.value.toUpperCase());
                  setPlateError('');
                }}
                maxLength={8}
                aria-label="Placa manual"
              />
              <button
                type="button"
                className="btn btn-outline plate-manual-add__btn"
                onClick={handleAddPlate}
              >
                <Plus size={16} strokeWidth={2.5} />
                Adicionar
              </button>
              {plateError && <p className="plate-manual-add__error">{plateError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="preview-actions">
        <button className="btn btn-secondary" onClick={onRetake}>
          Nova captura
        </button>
        <button className="btn btn-primary" disabled={sending || platesLoading} onClick={onSend}>
          {sending ? 'Enviando...' : (
            <>
              <Send size={18} strokeWidth={2.5} />
              Enviar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
