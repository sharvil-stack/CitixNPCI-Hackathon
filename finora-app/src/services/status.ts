import { request, type ServiceName } from './http';

const PROBES: Record<ServiceName, string> = { cardwise: '/api/health', schemes: '/api/health', study: '/api/health', scam: '/api/scams/examples' };
export async function probeAll(): Promise<Record<ServiceName, boolean>> {
  const out = {} as Record<ServiceName, boolean>;
  await Promise.all((Object.keys(PROBES) as ServiceName[]).map(async (s) => {
    try { await request(s, PROBES[s]); out[s] = true; } catch { out[s] = false; }
  }));
  return out;
}
