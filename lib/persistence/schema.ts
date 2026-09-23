import { sql } from '@/lib/persistence/sql';

let schemaReady: Promise<void> | null = null;

export function ensureCloudSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  return schemaReady;
}

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS obom_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      google_id TEXT,
      nome TEXT NOT NULL DEFAULT '',
      cpf TEXT NOT NULL DEFAULT '',
      telefone TEXT NOT NULL DEFAULT '',
      chave_pix TEXT NOT NULL DEFAULT '',
      endereco TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS obom_users_google_idx ON obom_users (google_id);`;
  await sql`
    CREATE TABLE IF NOT EXISTS obom_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES obom_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS obom_captures (
      id TEXT PRIMARY KEY,
      protocolo TEXT NOT NULL,
      filename TEXT NOT NULL,
      blob_path TEXT,
      original_name TEXT NOT NULL DEFAULT '',
      mimetype TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      media_type TEXT NOT NULL DEFAULT 'foto',
      uploaded_at TIMESTAMPTZ NOT NULL,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT '',
      user_nome TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}',
      relatorio_autoridade JSONB NOT NULL DEFAULT '{}'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS obom_captures_user_idx ON obom_captures (user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS obom_captures_uploaded_idx ON obom_captures (uploaded_at DESC);`;
}
