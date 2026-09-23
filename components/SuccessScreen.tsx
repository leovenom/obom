'use client';

import { CheckCircle2, Plus } from 'lucide-react';
import DecorShapes from '@/components/DecorShapes';
import IconCircle from '@/components/IconCircle';
import ScreenHeader from '@/components/ScreenHeader';

interface SuccessScreenProps {
  message: string;
  protocolo?: string;
  onBack?: () => void;
  onNewCapture: () => void;
}

export default function SuccessScreen({
  message,
  protocolo,
  onBack,
  onNewCapture,
}: SuccessScreenProps) {
  return (
    <section className="screen active success-screen">
      <ScreenHeader title="Enviado" onBack={onBack} />
      <DecorShapes variant="hero" />

      <div className="success-content">
        <IconCircle icon={CheckCircle2} variant="success" size="lg" />
        <h2>Enviado com sucesso!</h2>
        <p className="success-message">{message}</p>

        {protocolo && (
          <div className="info-card info-card--primary success-card">
            <h3>Protocolo</h3>
            <p className="protocolo">{protocolo}</p>
          </div>
        )}

        <button className="btn btn-primary" onClick={onNewCapture}>
          <Plus size={18} strokeWidth={2.5} />
          Nova captura
        </button>
      </div>
    </section>
  );
}
