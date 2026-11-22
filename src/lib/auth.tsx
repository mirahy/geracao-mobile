import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiClient, DEFAULT_API_URL, normalizeBaseUrl } from '../api/client';
import type { User } from '../api/types';

interface AuthState {
  ready: boolean;
  user: User | null;
  api: ApiClient;
  baseUrl: string;
  signIn: (baseUrl: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: string) => boolean;
}

const KEY = 'geracao.session';
const Ctx = createContext<AuthState | null>(null);

interface Session { token: string; baseUrl: string; user: User }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((raw) => raw && setSession(JSON.parse(raw) as Session))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const clear = useCallback(async () => {
    setSession(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  }, []);

  const baseUrl = session?.baseUrl ?? DEFAULT_API_URL;
  const api = useMemo(() => new ApiClient(baseUrl, session?.token ?? null, () => void clear()), [baseUrl, session?.token, clear]);

  const signIn = useCallback(async (url: string, email: string, password: string) => {
    const base = normalizeBaseUrl(url);
    const res = await new ApiClient(base, null).login(email.trim(), password);
    const next = { token: res.token, baseUrl: base, user: res.user };
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    await clear();
  }, [api, clear]);

  const can = useCallback((p: string) => !!session?.user.permissions.includes(p), [session]);

  const value = useMemo<AuthState>(
    () => ({ ready, user: session?.user ?? null, api, baseUrl, signIn, signOut, can }),
    [ready, session, api, baseUrl, signIn, signOut, can],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
