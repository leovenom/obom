import { sql } from '@/lib/persistence/sql';
import { ensureCloudSchema } from '@/lib/persistence/schema';
import type { StoredSession, StoredUser } from '@/lib/db-types';

function rowToUser(row: Record<string, unknown>): StoredUser {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    googleId: (row.google_id as string) || undefined,
    nome: row.nome as string,
    cpf: row.cpf as string,
    telefone: row.telefone as string,
    chavePix: row.chave_pix as string,
    endereco: row.endereco as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

export async function cloudFindUserByEmail(email: string): Promise<StoredUser | undefined> {
  await ensureCloudSchema();
  const rows = await sql`
    SELECT * FROM obom_users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function cloudFindUserByGoogleId(googleId: string): Promise<StoredUser | undefined> {
  await ensureCloudSchema();
  const rows = await sql`
    SELECT * FROM obom_users WHERE google_id = ${googleId} LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function cloudFindUserById(id: string): Promise<StoredUser | undefined> {
  await ensureCloudSchema();
  const rows = await sql`SELECT * FROM obom_users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function cloudCreateUser(user: StoredUser): Promise<void> {
  await ensureCloudSchema();
  await sql`
    INSERT INTO obom_users (
      id, email, password_hash, google_id, nome, cpf, telefone, chave_pix, endereco, created_at, updated_at
    ) VALUES (
      ${user.id},
      ${user.email},
      ${user.passwordHash},
      ${user.googleId ?? null},
      ${user.nome},
      ${user.cpf},
      ${user.telefone},
      ${user.chavePix},
      ${user.endereco},
      ${user.createdAt},
      ${user.updatedAt}
    )
  `;
}

export async function cloudUpdateUser(
  id: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | null> {
  const existing = await cloudFindUserById(id);
  if (!existing) return null;

  const merged: StoredUser = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await ensureCloudSchema();
  await sql`
    UPDATE obom_users SET
      email = ${merged.email},
      password_hash = ${merged.passwordHash},
      google_id = ${merged.googleId ?? null},
      nome = ${merged.nome},
      cpf = ${merged.cpf},
      telefone = ${merged.telefone},
      chave_pix = ${merged.chavePix},
      endereco = ${merged.endereco},
      updated_at = ${merged.updatedAt}
    WHERE id = ${id}
  `;
  return merged;
}

export async function cloudCreateSession(userId: string, token: string, daysValid = 30): Promise<void> {
  await ensureCloudSchema();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  await sql`DELETE FROM obom_sessions WHERE user_id = ${userId} AND expires_at <= NOW()`;
  await sql`
    INSERT INTO obom_sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()})
    ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at
  `;
}

export async function cloudFindSession(token: string): Promise<StoredSession | undefined> {
  await ensureCloudSchema();
  const rows = await sql`
    SELECT token, user_id, expires_at FROM obom_sessions WHERE token = ${token} LIMIT 1
  `;
  if (!rows[0]) return undefined;

  const expiresAt = new Date(rows[0].expires_at as string).toISOString();
  if (new Date(expiresAt) < new Date()) {
    await cloudDeleteSession(token);
    return undefined;
  }

  return {
    token: rows[0].token as string,
    userId: rows[0].user_id as string,
    expiresAt,
  };
}

export async function cloudDeleteSession(token: string): Promise<void> {
  await ensureCloudSchema();
  await sql`DELETE FROM obom_sessions WHERE token = ${token}`;
}
