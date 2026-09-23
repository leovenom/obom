export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  googleId?: string;
  nome: string;
  cpf: string;
  telefone: string;
  chavePix: string;
  endereco: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  expiresAt: string;
}
