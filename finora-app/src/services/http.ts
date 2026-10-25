// Centralised HTTP layer. Every service URL comes from an env var; by default the same-origin
// proxy path /svc/<name> is used (configured in vite.config.ts), so services may run on any host/port.
import { clearTokens, getTokens, setTokens } from '../lib/session';

export type ServiceName = 'cardwise' | 'schemes' | 'study' | 'scam' | 'auth';
const env = import.meta.env as Record<string, string | undefined>;


export const SERVICE_BASE: Record<ServiceName, string> = {
  cardwise: (env.VITE_CARDWISE_URL || '/svc/cardwise').replace(/\/$/, ''),
  schemes: (env.VITE_SCHEMES_URL || '/svc/schemes').replace(/\/$/, ''),
  study: (env.VITE_STUDY_URL || '/svc/study').replace(/\/$/, ''),
  scam: (env.VITE_SCAM_URL || '/svc/scam').replace(/\/$/, ''),
  auth: (env.VITE_AUTH_URL || '/svc/auth').replace(/\/$/, ''),
};


export const SERVICE_LABEL: Record<ServiceName, string> = {
  cardwise: 'CardWise (port 8000)', schemes: 'SchemeSathi (port 8001)', study: 'MoneyMentor (port 8002)', scam: 'ScamShield Spring Boot (port 8080)',
  auth: 'Account service (Spring Boot, port 8080)',
};

// Only the Spring Boot app understands our JWTs, so the bearer token is never sent to the other services.
const SENDS_TOKEN: ServiceName[] = ['auth', 'scam'];

export class ApiError extends Error {
  status: number; offline: boolean; service: ServiceName | ''; code?: string; fields?: Record<string, string>;
  constructor(message: string, o: { status?: number; offline?: boolean; service?: ServiceName | ''; code?: string; fields?: Record<string, string> } = {}) {
    super(message); this.name = 'ApiError'; this.status = o.status ?? 0; this.offline = !!o.offline; this.service = o.service ?? ''; this.code = o.code; this.fields = o.fields;
  }
}

function detailText(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join('; ');
  return d.message || d.error || (typeof d.detail === 'string' ? d.detail : '') || JSON.stringify(d);
}

type Opts = { noAuth?: boolean; method?: string; json?: unknown; form?: FormData; headers?: Record<string, string>; signal?: AbortSignal; blob?: boolean; query?: Record<string, string | number | undefined> };

let refreshing: Promise<boolean> | null = null;
/** Exchanges the refresh token for a new pair. One call at a time; resolves false (and clears the session) on failure. */
export function refreshSession(): Promise<boolean> {
  const current = getTokens();
  if (!current) return Promise.resolve(false);
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${SERVICE_BASE.auth}/api/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (res.ok) {
        const d = await res.json();
        setTokens({ accessToken: d.accessToken, refreshToken: d.refreshToken });
        return true;
      }
      if (res.status === 401 || res.status === 400) clearTokens(); // refresh token rejected: session is over
      return false;
    } catch { return false; } // service unreachable: keep tokens, try again later
    finally { refreshing = null; }
  })();
  return refreshing;
}

export async function request<T = any>(service: ServiceName, path: string, o: Opts = {}): Promise<T> {
  const baseHeaders: Record<string, string> = { ...(o.headers || {}) };
  let body: BodyInit | undefined;
  if (o.json !== undefined) { body = JSON.stringify(o.json); baseHeaders['Content-Type'] = 'application/json'; }
  if (o.form) body = o.form; // browser sets the multipart boundary
  const qs = o.query ? '?' + new URLSearchParams(Object.entries(o.query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
  const useAuth = !o.noAuth && SENDS_TOKEN.includes(service);

  const send = async (): Promise<Response> => {
    const headers = { ...baseHeaders };
    const tok = useAuth ? getTokens() : null;
    if (tok) headers.Authorization = `Bearer ${tok.accessToken}`;
    try {
      return await fetch(`${SERVICE_BASE[service]}${path}${qs}`, { method: o.method || 'GET', headers, body, signal: o.signal });
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      throw new ApiError(`Cannot reach ${SERVICE_LABEL[service]}. Is it running?`, { offline: true, service });
    }
  };

  let res = await send();
  // Access token expired: refresh once and replay the request (FormData bodies are re-readable, so this is safe).
  if (res.status === 401 && useAuth && getTokens() && (await refreshSession())) res = await send();

  if (!res.ok) {
    let payload: any = null;
    try { payload = await res.clone().json(); } catch { /* not json */ }
    const unreachable = payload?.error === 'service_unreachable' || ([502, 503, 504].includes(res.status) && !payload?.detail && !payload?.message);
    if (unreachable) throw new ApiError(`${SERVICE_LABEL[service]} is not running or not reachable right now.`, { status: res.status, offline: true, service });
    throw new ApiError(detailText(payload?.detail ?? payload) || `Request failed (${res.status})`, { status: res.status, service, code: payload?.error, fields: payload?.fieldErrors });
  }
  if (o.blob) return (await res.blob()) as any;
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('json') ? await res.json() : await res.text()) as T;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
