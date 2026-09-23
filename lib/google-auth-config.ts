export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'development') {
    return 'obom-dev-secret-change-in-production';
  }

  throw new Error(
    'AUTH_SECRET em falta. Adicione ao .env: openssl rand -base64 32'
  );
}

export function isGoogleAuthEnabled(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.NODE_ENV === 'development')
  );
}

export function isNextAuthActive(): boolean {
  return isGoogleAuthEnabled();
}
