const DEV_FALLBACK = 'obom-dev-secret-change-in-production';

/**
 * Secret para inicializar Auth.js — nunca lança erro (build na Vercel importa @/auth).
 * Em produção sem env, Auth.js falha nos pedidos até configurar AUTH_SECRET.
 */
export function resolveAuthSecretForNextAuth(): string | undefined {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development') return DEV_FALLBACK;
  return undefined;
}

/** Validação explícita em runtime (login, APIs sensíveis). */
export function getAuthSecret(): string {
  const secret = resolveAuthSecretForNextAuth();
  if (secret) return secret;
  throw new Error(
    'AUTH_SECRET em falta. Adicione ao .env: openssl rand -base64 32'
  );
}

export function isGoogleAuthEnabled(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    resolveAuthSecretForNextAuth()
  );
}

export function isNextAuthActive(): boolean {
  return isGoogleAuthEnabled();
}
