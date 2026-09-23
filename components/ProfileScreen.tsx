'use client';

import { useState } from 'react';
import DecorShapes from '@/components/DecorShapes';
import ScreenHeader from '@/components/ScreenHeader';
import type { User as UserType } from '@/hooks/useAuth';

interface ProfileScreenProps {
  user: UserType;
  onSave: (fields: { nome: string; telefone: string }) => Promise<void>;
  onBack?: () => void;
}

export default function ProfileScreen({ user, onSave, onBack }: ProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nome: user.nome || '',
    telefone: user.telefone || '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen active auth-screen">
      <ScreenHeader title="OBOM" onBack={onBack} />
      <DecorShapes variant="auth" />

      <p className="subtitle">
        Nome e telemóvel (PT) para associar cada envio às evidências recolhidas
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          placeholder="Nome completo"
          value={form.nome}
          onChange={(e) => update('nome', e.target.value)}
          required
        />
        <input
          className="form-input"
          type="tel"
          placeholder="Telemóvel (ex.: 912 345 678)"
          value={form.telefone}
          onChange={(e) => update('telefone', e.target.value)}
          required
          autoComplete="tel"
        />

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Continuar'}
        </button>
      </form>
    </section>
  );
}
