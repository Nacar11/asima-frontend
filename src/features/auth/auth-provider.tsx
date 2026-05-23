'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { authApi } from './api';
import { PERMISSIONS_QUERY_KEY } from './use-permissions';
import type { AuthUser, LoginInput } from './schemas';

/**
 * Auth state machine for the SPA. Owns the access-token in memory + the
 * refresh-token in localStorage, and wires those into the shared
 * `apiClient` singleton (SPEC §6).
 *
 * The dependency rule: `lib/api-client.ts` is feature-agnostic. It
 * exposes `setAccessToken` and `setRefreshHandler`; AuthProvider is
 * the only place that constructs and registers those handlers.
 * `features/*` import from `lib/`, never the reverse.
 */

const REFRESH_STORAGE_KEY = 'asima:refresh_token';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Access token lives in a ref so the refresh-handler closure always
  // sees the latest value without forcing a re-render when it rotates.
  const accessTokenRef = useRef<string | null>(null);

  // One-shot guard so back-to-back expiries (or StrictMode double-mount in
  // dev) don't stack the toast. Reset on successful login.
  const expiredFiredRef = useRef(false);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    apiClient().setAccessToken(token);
  }, []);

  const notifySessionExpired = useCallback(() => {
    if (expiredFiredRef.current) return;
    expiredFiredRef.current = true;
    toast.warning('Your session expired. Please sign in again.');
  }, []);

  const readRefreshToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_STORAGE_KEY);
  }, []);

  const writeRefreshToken = useCallback((token: string | null) => {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(REFRESH_STORAGE_KEY, token);
    else window.localStorage.removeItem(REFRESH_STORAGE_KEY);
  }, []);

  /**
   * The mutex-protected refresh handler we register with apiClient.
   * When ANY apiClient call gets a 401, this is invoked exactly once
   * (apiClient internally coalesces concurrent retries).
   */
  const refreshHandler = useCallback(async (): Promise<string> => {
    const refreshToken = readRefreshToken();
    if (!refreshToken) {
      notifySessionExpired();
      setStatus('unauthenticated');
      throw new Error('No refresh token available');
    }
    try {
      const response = await authApi.refresh(refreshToken);
      setAccessToken(response.access_token);
      writeRefreshToken(response.refresh_token);
      return response.access_token;
    } catch (err) {
      setAccessToken(null);
      writeRefreshToken(null);
      setUser(null);
      setStatus('unauthenticated');
      notifySessionExpired();
      throw err;
    }
  }, [readRefreshToken, writeRefreshToken, setAccessToken, notifySessionExpired]);

  // Register the refresh handler once on mount.
  useEffect(() => {
    apiClient().setRefreshHandler(refreshHandler);
    return () => {
      apiClient().setRefreshHandler(null);
    };
  }, [refreshHandler]);

  // Bootstrap on mount: if we have a refresh token, try to use it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshToken = readRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        const response = await authApi.refresh(refreshToken);
        if (cancelled) return;
        setAccessToken(response.access_token);
        writeRefreshToken(response.refresh_token);
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        writeRefreshToken(null);
        setStatus('unauthenticated');
        // We HAD a refresh token but it didn't work — that's a real expiry,
        // not an unauthenticated first visit.
        notifySessionExpired();
      }
    })();
    return () => {
      cancelled = true;
    };
    // We intentionally run this once on mount. Linter rule disabled for clarity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (input) => {
      const response = await authApi.login(input);
      setAccessToken(response.access_token);
      writeRefreshToken(response.refresh_token);
      setUser(response.user);
      setStatus('authenticated');
      expiredFiredRef.current = false;
    },
    [setAccessToken, writeRefreshToken],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    // Best-effort server-side (stateless no-op). Whether it succeeds or
    // not, the client must drop tokens.
    await authApi.logout().catch(() => {});
    setAccessToken(null);
    writeRefreshToken(null);
    setUser(null);
    setStatus('unauthenticated');
    // Drop cached permissions so a different user signing in on the same
    // tab fetches fresh — never inherits the previous user's grants.
    queryClient.removeQueries({ queryKey: PERMISSIONS_QUERY_KEY });
  }, [setAccessToken, writeRefreshToken, queryClient]);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
