// Token storage for the Spring Boot auth service. localStorage is wrapped in try/catch (private windows,
// blocked storage) with an in-memory fallback, so the app still works for the current tab.
export type Tokens = { accessToken: string; refreshToken: string };
const KEY = 'finora.session';
let memory: Tokens | null = null;
const listeners = new Set<() => void>();

export function getTokens(): Tokens | null {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (t && typeof t.accessToken === 'string' && typeof t.refreshToken === 'string') return (memory = t);
  } catch { /* unavailable or corrupt */ }
  return null;
}
export function setTokens(t: Tokens) {
  memory = t;
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* storage unavailable */ }
}
export function clearTokens() {
  memory = null;
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  listeners.forEach((fn) => fn());
}
/** Called whenever the session is cleared (logout, or refresh failed because the session expired). */
export function onSessionCleared(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
