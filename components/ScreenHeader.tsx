'use client';

import { ArrowLeft } from 'lucide-react';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export default function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header__row">
        {onBack ? (
          <button type="button" className="btn-back" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={20} strokeWidth={2} />
            <span>Voltar</span>
          </button>
        ) : (
          <span className="screen-header__spacer" />
        )}
        <h2 className="screen-header__title">{title}</h2>
        <span className="screen-header__spacer" />
      </div>
    </header>
  );
}
