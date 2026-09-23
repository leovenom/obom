'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, MapPin } from 'lucide-react';
import DecorShapes from '@/components/DecorShapes';
import IconCircle from '@/components/IconCircle';
import {
  getLocationSettingsTarget,
  isAndroidDevice,
  isIOSDevice,
  openLocationSettings,
} from '@/lib/browser';

interface PermissionsScreenProps {
  cameraGranted: boolean | null;
  cameraError?: string;
  locationGranted: boolean | null;
  locationError?: string;
  locationErrorCode?: string;
  locationLoading?: boolean;
  locationPreview?: string | null;
  onRetryLocation?: () => void;
  onRequestLocation?: () => void;
  onStart: () => void;
  userName?: string;
  onLogout?: () => void;
}

function statusText(granted: boolean | null, loading?: boolean) {
  if (loading && granted === null) return 'Obtendo geolocalização...';
  if (granted === null) return 'Aguardando...';
  return granted ? 'Autorizado ✓' : 'Negado ✗';
}

function statusClass(granted: boolean | null) {
  if (granted === null) return '';
  return granted ? 'granted' : 'denied';
}

export default function PermissionsScreen({
  cameraGranted,
  cameraError,
  locationGranted,
  locationError,
  locationErrorCode,
  locationLoading,
  locationPreview,
  onRetryLocation,
  onRequestLocation,
  onStart,
  userName,
  onLogout,
}: PermissionsScreenProps) {
  const canStart = cameraGranted === true;
  const [localhostUrl, setLocalhostUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [needsHttps, setNeedsHttps] = useState(false);
  const settingsTarget = getLocationSettingsTarget();
  const showSettingsButton =
    locationGranted !== true && !needsHttps && (isIOSDevice() || isAndroidDevice());
  const showLocationRequest =
    locationGranted !== true && !needsHttps && onRequestLocation && locationErrorCode !== 'denied';

  useEffect(() => {
    setNeedsHttps(!window.isSecureContext);
    const { hostname, port, protocol } = window.location;
    const p = port || '3001';
    setLocalhostUrl(`https://localhost:${p}`);

    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalHost) {
      setMobileUrl('');
    } else if (protocol === 'http:') {
      setMobileUrl(`https://${hostname}${port ? `:${port}` : ''}`);
    } else {
      setMobileUrl(window.location.origin);
    }
  }, []);

  const insecureMessage =
    cameraError || locationError || 'Câmera e geolocalização exigem HTTPS no iPhone.';

  const locationDescription = (() => {
    if (locationPreview) return locationPreview;
    if (locationGranted === true) return 'Local será registrado automaticamente';
    return 'Permita para registrar onde ocorreu';
  })();

  return (
    <section className="screen active permissions-screen">
      <DecorShapes variant="hero" />

      <div className="brand-mark">
        <h1>OBOM</h1>
      </div>

      {userName && <p className="user-greeting">Olá, {userName.split(' ')[0]}</p>}

      {needsHttps && (
        <div className="location-error-box https-warning-box">
          <p>
            <strong>HTTPS necessário</strong>
          </p>
          <p>{insecureMessage}</p>
          <ol className="https-steps">
            <li>
              No Mac: pare o servidor e rode <code>npm run dev:mobile</code>
            </li>
            <li>
              No Mac:{' '}
              <a className="mobile-url-link" href={localhostUrl}>
                {localhostUrl || 'https://localhost:3001'}
              </a>
            </li>
            {mobileUrl ? (
              <li>
                No iPhone (Safari, mesma Wi-Fi):{' '}
                <a className="mobile-url-link" href={mobileUrl}>
                  {mobileUrl}
                </a>
              </li>
            ) : (
              <li>No iPhone: use o IP do Mac (ex: <code>https://192.168.x.x:3001</code>)</li>
            )}
            <li>Aceite o certificado: &quot;Mostrar detalhes&quot; → &quot;visitar este site&quot;</li>
          </ol>
        </div>
      )}

      {cameraError && !needsHttps && (
        <div className="location-error-box">
          <p>
            <strong>Câmera bloqueada</strong>
          </p>
          <p>{cameraError}</p>
        </div>
      )}

      <p className="subtitle">Registre ocorrências</p>

      <div className="permission-list">
        <div className="permission-item">
          <IconCircle icon={Camera} variant="primary" />
          <div>
            <strong>Câmera</strong>
            <span className={`perm-status ${statusClass(cameraGranted)}`}>
              {statusText(cameraGranted)}
            </span>
          </div>
        </div>

        <div className="permission-item">
          <IconCircle icon={MapPin} variant="secondary" />
          <div>
            <strong>Localização</strong>
            <span className={`perm-status ${statusClass(locationGranted)}`}>
              {statusText(locationGranted, locationLoading)}
            </span>
            <span className="permission-item__desc">{locationDescription}</span>
          </div>
        </div>
      </div>

      {showLocationRequest && (
        <button
          type="button"
          className="btn btn-secondary location-permission-btn"
          onClick={onRequestLocation}
          disabled={locationLoading}
        >
          {locationLoading ? 'Obtendo localização...' : 'Permitir geolocalização'}
        </button>
      )}

      {locationError && !needsHttps && (
        <div className="location-error-box">
          <p>
            <strong>Geolocalização indisponível</strong>
          </p>
          <p>{locationError}</p>
          {locationErrorCode === 'denied' && isIOSDevice() && (
            <ol className="https-steps">
              <li>
                Toque em <strong>Abrir Ajustes</strong> abaixo
              </li>
              <li>
                <strong>Privacidade e Segurança</strong> → <strong>Serviços de Localização</strong>
              </li>
              <li>
                Em <strong>Safari</strong>, escolha &quot;Ao usar o App&quot;
              </li>
              <li>
                Volte ao Safari e toque em <strong>Tentar novamente</strong>
              </li>
            </ol>
          )}
          <div className="location-error-actions">
            {showSettingsButton &&
              (settingsTarget ? (
                <a
                  className="btn btn-primary location-permission-btn"
                  href={settingsTarget}
                  onClick={(e) => {
                    e.preventDefault();
                    openLocationSettings();
                  }}
                >
                  Abrir Ajustes
                </a>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary location-permission-btn"
                  onClick={() => openLocationSettings()}
                >
                  Abrir Ajustes
                </button>
              ))}
            {onRetryLocation && (
              <button
                type="button"
                className="btn btn-secondary location-permission-btn"
                onClick={onRetryLocation}
              >
                Tentar novamente
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-lg"
        disabled={!canStart}
        onClick={onStart}
      >
        {canStart ? 'Iniciar captura' : 'Aguardando câmera...'}
      </button>

      <p className="hint">
        {canStart
          ? locationGranted === true
            ? 'Tudo pronto. Toque para abrir a câmera.'
            : 'Pode adicionar o local manualmente na revisão, se precisar.'
          : 'Permita o acesso à câmera para continuar.'}
      </p>

      <Link href="/registros" className="btn-text">
        Ver registros de placas
      </Link>

      {onLogout && (
        <button type="button" className="btn-text" onClick={onLogout}>
          Sair da conta
        </button>
      )}
    </section>
  );
}
