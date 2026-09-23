import { neon } from '@neondatabase/serverless';

type NeonSql = ReturnType<typeof neon>;

let client: NeonSql | null = null;

function getClient(): NeonSql {
  if (!client) {
    const url =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING;
    if (!url) {
      throw new Error('POSTGRES_URL ou DATABASE_URL em falta');
    }
    client = neon(url);
  }
  return client;
}

/** Tagged-template SQL (Neon serverless). Devolve linhas directamente. */
export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const rows = await getClient()(strings, ...values);
  return rows as T[];
}
