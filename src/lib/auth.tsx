import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL, ApiClient } from '../api/client';
import type { User } from '../api/types';
import { isExpired, type Session } from './session';

interface AuthState {
  ready: boolean;
  user: User | null;
  api: ApiClient;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: string) => boolean;
}

const KEY = 'geracao.session';
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then(async (raw) => {
        const saved = raw ? (JSON.parse(raw) as Session) : null;
        if (saved && !isExpired(saved)) setSession(saved);
        else if (saved) await SecureStore.deleteItemAsync(KEY);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const clear = useCallback(async () => {
    setSession(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  }, []);

  const api = useMemo(() => new ApiClient(API_URL, session?.token ?? null, () => void clear()), [session?.token, clear]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await new ApiClient(API_URL, null).login(email.trim(), password);
    const next: Session = { token: res.token, expiresAt: res.expires_at, user: res.user };
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    await clear();
  }, [api, clear]);

  const can = useCallback((p: string) => !!session?.user.permissions.includes(p), [session]);

  const value = useMemo<AuthState>(
    () => ({ ready, user: session?.user ?? null, api, signIn, signOut, can }),
    [ready, session, api, signIn, signOut, can],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
