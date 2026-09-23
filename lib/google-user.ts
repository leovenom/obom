import { createUser, findUserByEmail, findUserByGoogleId, updateUser } from './db';
import { generateId } from './auth';

export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  nome: string;
}): Promise<string> {
  const byGoogle = await findUserByGoogleId(profile.googleId);
  if (byGoogle) {
    if (!byGoogle.nome && profile.nome) {
      await updateUser(byGoogle.id, { nome: profile.nome });
    }
    return byGoogle.id;
  }

  const byEmail = await findUserByEmail(profile.email);
  if (byEmail) {
    await updateUser(byEmail.id, {
      googleId: profile.googleId,
      nome: byEmail.nome || profile.nome,
    });
    return byEmail.id;
  }

  const id = generateId();
  const now = new Date().toISOString();
  await createUser({
    id,
    email: profile.email.toLowerCase().trim(),
    passwordHash: '',
    googleId: profile.googleId,
    nome: profile.nome,
    cpf: '',
    telefone: '',
    chavePix: '',
    endereco: '',
    createdAt: now,
    updatedAt: now,
  });
  return id;
}
