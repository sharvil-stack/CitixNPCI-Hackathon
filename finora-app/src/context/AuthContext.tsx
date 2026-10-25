import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type AuthResponse, type AuthUser } from '../services/auth';
import { clearTokens, getTokens, onSessionCleared, setTokens } from '../lib/session';

type A = {
  user: AuthUser | null;
  /** false until the stored session (if any) has been checked with the server. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Ctx = createContext<A>({ user: null, ready: true, login: async () => {}, register: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(() => !getTokens());

  // Restore the session on first load; a failed refresh clears the tokens and lands here via onSessionCleared.
  useEffect(() => {
    let alive = true;
    if (getTokens()) {
      authApi.me().then((u) => alive && setUser(u)).catch(() => { /* offline or expired: stay signed out in the UI */ }).finally(() => alive && setReady(true));
    }
    const off = onSessionCleared(() => setUser(null));
    return () => { alive = false; off(); };
  }, []);

  const accept = useCallback((r: AuthResponse) => { setTokens({ accessToken: r.accessToken, refreshToken: r.refreshToken }); setUser(r.user); }, []);
  const login = useCallback(async (email: string, password: string) => accept(await authApi.login(email, password)), [accept]);
  const register = useCallback(async (n: string, e: string, p: string) => accept(await authApi.register(n, e, p)), [accept]);
  const logout = useCallback(async () => {
    const t = getTokens();
    clearTokens(); setUser(null); // sign out locally first so the UI never waits on the network
    if (t) { try { await authApi.logout(t.refreshToken); } catch { /* server-side revoke is best effort */ } }
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
