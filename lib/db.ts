import { isValidPtPhone } from '@/lib/phone-pt';
import { useCloudPersistence } from '@/lib/persistence/config';
import * as local from '@/lib/db-local';
import * as cloud from '@/lib/db-cloud';
import type { StoredSession, StoredUser } from '@/lib/db-types';

export type { StoredSession, StoredUser } from '@/lib/db-types';

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  if (useCloudPersistence()) return cloud.cloudFindUserByEmail(email);
  return local.localFindUserByEmail(email);
}

export async function findUserByGoogleId(googleId: string): Promise<StoredUser | undefined> {
  if (useCloudPersistence()) return cloud.cloudFindUserByGoogleId(googleId);
  return local.localFindUserByGoogleId(googleId);
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  if (useCloudPersistence()) return cloud.cloudFindUserById(id);
  return local.localFindUserById(id);
}

export async function createUser(user: StoredUser): Promise<void> {
  if (useCloudPersistence()) return cloud.cloudCreateUser(user);
  local.localCreateUser(user);
}

export async function updateUser(
  id: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | null> {
  if (useCloudPersistence()) return cloud.cloudUpdateUser(id, updates);
  return local.localUpdateUser(id, updates);
}

export async function createSession(userId: string, token: string, daysValid = 30): Promise<void> {
  if (useCloudPersistence()) return cloud.cloudCreateSession(userId, token, daysValid);
  local.localCreateSession(userId, token, daysValid);
}

export async function findSession(token: string): Promise<StoredSession | undefined> {
  if (useCloudPersistence()) return cloud.cloudFindSession(token);
  return local.localFindSession(token);
}

export async function deleteSession(token: string): Promise<void> {
  if (useCloudPersistence()) return cloud.cloudDeleteSession(token);
  local.localDeleteSession(token);
}

export function sanitizeUser(user: StoredUser) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function isProfileComplete(user: StoredUser): boolean {
  return !!(user.nome?.trim() && user.telefone && isValidPtPhone(user.telefone));
}
