'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { AuthUser, LoginResponse } from '@/lib/types/auth';

import { useAppDispatch } from '@/store/hooks';
import {
  hydrateAuth,
  setCredentials,
  logout as reduxLogout,
  setAuthError,
  setAuthLoading,
} from '@/store/slices/authSlice';

const TOKEN_KEY = 'smart_ivf_token';
const USER_KEY = 'smart_ivf_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);
    if (payload.exp && typeof payload.exp === 'number') {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return false;
  }
}

function readStoredAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { token: null, user: null };

    if (isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, user: null };
    }

    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredAuth();
    setToken(stored.token);
    setUser(stored.user);
    setHydrated(true);
    dispatch(hydrateAuth(stored));
  }, [dispatch]);

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);
      setError(null);
      dispatch(setAuthLoading(true));
      try {
        const res = await apiFetch<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });

        if (!res.token || !res.user) {
          throw new Error('Login response was incomplete.');
        }

        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.push('/dashboard');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed.';
        setError(message);
        dispatch(setAuthError(message));
        throw err;
      } finally {
        setLoading(false);
        dispatch(setAuthLoading(false));
      }
    },
    [router, dispatch]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    setError(null);
    dispatch(reduxLogout());
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [dispatch]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ user, token, loading, hydrated, error, login, logout, clearError }),
    [user, token, loading, hydrated, error, login, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useRequireAuth() {
  return useAuth();
}
