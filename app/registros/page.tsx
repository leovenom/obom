'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
interface PlateRecord {
  id: string;
  placa: string;
  data_hora: string;
  status: 'Liberado' | 'Negado';
  origem?: 'captura' | 'tempo_real';
  protocolo?: string;
}

export default function RegistrosPage() {
  const [records, setRecords] = useState<PlateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, healthRes] = await Promise.all([
        fetch('/api/plates'),
        fetch('/api/plates/health'),
      ]);
      const recordsData = await recordsRes.json();
      const healthData = await healthRes.json();
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setAiStatus(healthData.available ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="app-root registros-page">
      <header className="registros-header">
        <Link href="/" className="btn-back">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>Voltar</span>
        </Link>
        <h1>Registros de placas</h1>
        <button type="button" className="btn-icon" onClick={load} aria-label="Atualizar">
          <RefreshCw size={18} strokeWidth={2.25} />
        </button>
      </header>

      <div className="registros-status">
        <span className={`registros-pill registros-pill--${aiStatus}`}>
          IA {aiStatus === 'online' ? 'fast-alpr ativa' : aiStatus === 'loading' ? '...' : 'offline — rode npm run plates:setup && npm run plates:dev'}
        </span>
      </div>

      {loading ? (
        <p className="registros-empty">Carregando...</p>
      ) : records.length === 0 ? (
        <p className="registros-empty">Nenhuma placa registrada ainda.</p>
      ) : (
        <ul className="registros-list">
          {records.map((r) => (
            <li key={r.id} className="registros-item">
              <div className="registros-item__main">
                <span className="registros-item__plate">{r.placa}</span>
                <span
                  className={`registros-item__status registros-item__status--${r.status.toLowerCase()}`}
                >
                  {r.status}
                </span>
              </div>
              <div className="registros-item__meta">
                <span>{new Date(r.data_hora).toLocaleString('pt-BR')}</span>
                {r.origem && <span>{r.origem === 'tempo_real' ? 'Tempo real' : 'Captura'}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
