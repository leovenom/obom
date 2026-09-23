/** Valida telemóvel português (9 dígitos começados por 9, com ou sem +351). */
export function isValidPtPhone(telefone: string): boolean {
  const digits = telefone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('351')) {
    return digits.charAt(3) === '9';
  }
  if (digits.length === 9) {
    return digits.startsWith('9');
  }
  return false;
}

export function normalizePtPhone(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('351')) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+351${digits}`;
  }
  return telefone.trim();
}
