'use client';

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  LogOut,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { INCIDENT_LABELS } from '@/lib/types';
import type { CaptureRecord, UserCaptureGroup } from '@/lib/capturas-types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CaptureDetail({ record }: { record: CaptureRecord }) {
  const [showJson, setShowJson] = useState(false);
  const plates = record.metadata.plates ?? [];
  const mediaUrl = `/api/capturas/${record.filename}`;

  return (
    <div className="dashboard-item__body">
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h3>Utilizador</h3>
          <dl className="dashboard-dl">
            <dt>ID utilizador</dt>
            <dd className="dashboard-mono">{record.userId}</dd>
            <dt>Nome</dt>
            <dd>{record.userNome}</dd>
            <dt>E-mail</dt>
            <dd>{record.userEmail}</dd>
            {record.relatorioAutoridade.denunciante.endereco ? (
              <>
                <dt>Endereço</dt>
                <dd>{record.relatorioAutoridade.denunciante.endereco}</dd>
              </>
            ) : null}
          </dl>
        </section>

        <section className="dashboard-card">
          <h3>Ocorrência</h3>
          <dl className="dashboard-dl">
            <dt>ID envio</dt>
            <dd className="dashboard-mono">{record.id}</dd>
            <dt>Protocolo</dt>
            <dd className="dashboard-mono">{record.protocolo}</dd>
            <dt>Tipo</dt>
            <dd>
              {INCIDENT_LABELS[record.metadata.incidentType] || record.metadata.incidentType}
            </dd>
            <dt>Data/Hora</dt>
            <dd>{record.metadata.datetime}</dd>
            <dt>Local</dt>
            <dd>{record.metadata.address || record.metadata.coordinates || '—'}</dd>
            <dt>Coordenadas</dt>
            <dd>{record.metadata.coordinates || '—'}</dd>
            <dt>Placas</dt>
            <dd>{plates.length > 0 ? plates.join(', ') : '—'}</dd>
            {record.metadata.duration && (
              <>
                <dt>Duração</dt>
                <dd>{record.metadata.duration}</dd>
              </>
            )}
          </dl>
        </section>

      </div>

      <section className="dashboard-card dashboard-card--media">
        <h3>Mídia</h3>
        <p className="dashboard-media-meta">
          {record.originalName} · {formatBytes(record.size)}
        </p>
        {record.mediaType === 'video' ? (
          <video src={mediaUrl} controls playsInline className="dashboard-media" />
        ) : (
          <img src={mediaUrl} alt={record.protocolo} className="dashboard-media" />
        )}
      </section>

      <div className="dashboard-actions">
        <a className="btn btn-outline" href={mediaUrl} download={record.filename}>
          <Download size={16} strokeWidth={2.25} />
          Baixar mídia
        </a>
        <a className="btn btn-outline" href={`/api/admin/capturas/${record.id}?download=1`}>
          <Download size={16} strokeWidth={2.25} />
          Baixar JSON
        </a>
      </div>

      <button
        type="button"
        className="btn btn-outline dashboard-json-toggle"
        onClick={() => setShowJson((open) => !open)}
      >
        {showJson ? 'Fechar JSON' : 'Ver JSON completo'}
      </button>
      {showJson && (
        <pre className="dashboard-json-pre">{JSON.stringify(record.relatorioAutoridade, null, 2)}</pre>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [records, setRecords] = useState<CaptureRecord[]>([]);
  const [users, setUsers] = useState<UserCaptureGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'users' | 'all'>('users');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedCaptureId, setExpandedCaptureId] = useState<string | null>(null);

  const toggleUser = (userId: string) => {
    setExpandedUserId((current) => (current === userId ? null : userId));
  };

  const toggleCapture = (captureId: string) => {
    setExpandedCaptureId((current) => (current === captureId ? null : captureId));
  };

  const checkSession = useCallback(async () => {
    const res = await fetch('/api/admin/session');
    const data = await res.json();
    setAuthenticated(data.authenticated === true);
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/capturas');
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setRecords(data.records ?? []);
      setUsers(data.users ?? []);
    } catch {
      setRecords([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated) loadRecords();
  }, [authenticated, loadRecords]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || 'Senha incorreta');
      return;
    }
    setPassword('');
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setRecords([]);
    setUsers([]);
    setExpandedUserId(null);
    setExpandedCaptureId(null);
  };

  const stats = {
    total: records.length,
    users: users.length,
    fotos: records.filter((r) => r.mediaType === 'foto').length,
    videos: records.filter((r) => r.mediaType === 'video').length,
  };

  if (authenticated === null) {
    return (
      <div className="app-root dashboard-page">
        <p className="dashboard-empty">Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="app-root dashboard-page dashboard-page--login">
        <div className="dashboard-login">
          <Shield size={40} strokeWidth={1.75} className="dashboard-login__icon" />
          <h1>Dashboard OBOM</h1>
          <p className="dashboard-login__sub">Acesso restrito à plataforma</p>
          <form onSubmit={handleLogin} className="dashboard-login__form">
            <input
              type="password"
              className="form-input"
              placeholder="Senha de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {loginError && <p className="dashboard-login__error">{loginError}</p>}
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
          </form>
          <Link href="/" className="btn-text dashboard-login__back">
            ← Voltar ao app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root dashboard-page">
      <header className="dashboard-header">
        <Link href="/" className="btn-back">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>App</span>
        </Link>
        <h1>Dashboard</h1>
        <div className="dashboard-header__actions">
          <button type="button" className="btn-icon" onClick={loadRecords} aria-label="Atualizar">
            <RefreshCw size={18} strokeWidth={2.25} />
          </button>
          <button type="button" className="btn-icon" onClick={handleLogout} aria-label="Sair">
            <LogOut size={18} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div className="dashboard-stats dashboard-stats--4">
        <div className="dashboard-stat">
          <span className="dashboard-stat__value">{stats.total}</span>
          <span className="dashboard-stat__label">Envios</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat__value">{stats.users}</span>
          <span className="dashboard-stat__label">Utilizadores</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat__value">{stats.fotos}</span>
          <span className="dashboard-stat__label">Fotos</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat__value">{stats.videos}</span>
          <span className="dashboard-stat__label">Vídeos</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab ${viewMode === 'users' ? 'active' : ''}`}
          onClick={() => setViewMode('users')}
        >
          Por utilizador
        </button>
        <button
          type="button"
          className={`dashboard-tab ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          Todos os envios
        </button>
      </div>

      {loading ? (
        <p className="dashboard-empty">Carregando registros...</p>
      ) : records.length === 0 ? (
        <p className="dashboard-empty">
          Nenhuma captura recebida ainda. Envie uma pelo app (login → captura → enviar).
        </p>
      ) : viewMode === 'users' ? (
        <ul className="dashboard-list">
          {users.map((group) => {
            const userExpanded = expandedUserId === group.userId;

            return (
              <li key={group.userId} className="dashboard-user">
                <button
                  type="button"
                  className={`dashboard-user__head${userExpanded ? ' is-expanded' : ''}`}
                  aria-expanded={userExpanded}
                  onClick={() => toggleUser(group.userId)}
                >
                  <User size={18} className="dashboard-user__icon" />
                  <div className="dashboard-user__main">
                    <strong>{group.userNome || 'Sem nome'}</strong>
                    <span>{group.userEmail}</span>
                    <span className="dashboard-mono dashboard-user__id">ID: {group.userId}</span>
                  </div>
                  <span className="dashboard-user__count">{group.totalCapturas} envio(s)</span>
                </button>

                {userExpanded && (
                  <ul className="dashboard-user__captures">
                    {group.capturas.map((record) => {
                      const captureExpanded = expandedCaptureId === record.id;

                      return (
                        <li key={record.id} className="dashboard-item dashboard-item--nested">
                          <button
                            type="button"
                            className={`dashboard-item__head${captureExpanded ? ' is-expanded' : ''}`}
                            aria-expanded={captureExpanded}
                            onClick={(e: MouseEvent) => {
                              e.stopPropagation();
                              toggleCapture(record.id);
                            }}
                          >
                            <div className="dashboard-item__head-main">
                              <span className="dashboard-item__protocol">{record.protocolo}</span>
                              <span className="dashboard-item__type">
                                {record.mediaType === 'video' ? 'Vídeo' : 'Foto'}
                              </span>
                            </div>
                            <div className="dashboard-item__head-sub">
                              <span className="dashboard-mono">ID: {record.id}</span>
                              <span>{formatDate(record.uploadedAt)}</span>
                            </div>
                          </button>
                          {captureExpanded && <CaptureDetail record={record} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="dashboard-list">
          {records.map((record) => {
            const expanded = expandedCaptureId === record.id;

            return (
              <li key={record.id} className="dashboard-item">
                <button
                  type="button"
                  className={`dashboard-item__head${expanded ? ' is-expanded' : ''}`}
                  aria-expanded={expanded}
                  onClick={() => toggleCapture(record.id)}
                >
                  <div className="dashboard-item__head-main">
                    <span className="dashboard-item__protocol">{record.protocolo}</span>
                    <span className="dashboard-item__type">
                      {record.mediaType === 'video' ? 'Vídeo' : 'Foto'}
                    </span>
                  </div>
                  <div className="dashboard-item__head-sub">
                    <span>{record.userNome}</span>
                    <span className="dashboard-mono">ID: {record.id}</span>
                    <span>{formatDate(record.uploadedAt)}</span>
                  </div>
                </button>
                {expanded && <CaptureDetail record={record} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
