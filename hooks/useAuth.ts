'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  nome: string;
  cpf: string;
  telefone: string;
  chavePix: string;
  endereco: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
      setProfileComplete(data.profileComplete ?? false);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no login');
      setUser(data.user);
      await refresh();
      return data.user;
    },
    [refresh]
  );

  const register = useCallback(
    async (fields: {
      email: string;
      password: string;
      nome?: string;
      cpf?: string;
      telefone?: string;
      chavePix?: string;
      endereco?: string;
    }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
      setUser(data.user);
      await refresh();
      return data.user;
    },
    [refresh]
  );

  const updateProfile = useCallback(
    async (fields: { nome: string; telefone: string }) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil');
      setUser(data.user);
      setProfileComplete(data.profileComplete);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    try {
      await nextAuthSignOut({ redirect: false });
    } catch {
      // NextAuth pode não estar configurado
    }
    setUser(null);
    setProfileComplete(false);
  }, []);

  return {
    user,
    profileComplete,
    loading,
    login,
    register,
    updateProfile,
    logout,
    refresh,
  };
}
