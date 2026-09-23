/** Persistência cloud (Vercel Postgres + Blob). Requer ambas as variáveis. */
export function useCloudPersistence(): boolean {
  const hasDb = !!(
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  return hasDb && hasBlob;
}
