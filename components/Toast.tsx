'use client';

interface ToastProps {
  message: string;
  type?: 'error' | '';
  visible: boolean;
}

export default function Toast({ message, type = '', visible }: ToastProps) {
  if (!visible) return null;
  return <div className={`toast ${type}`}>{message}</div>;
}
