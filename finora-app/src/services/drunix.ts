import { request } from './http';

// DRUNIX is reached only through the CardWise backend adapter (backend/ledger.py). Gateway tokens never reach the browser.
export type LedgerStatus = { mode: string; is_live: boolean; ready: boolean; label?: string; notice?: string };
export type Referral = {
  referral_id: string; card_id?: string; issuer_code?: string; consent_scope?: string; status: string; mode?: string; is_live?: boolean;
  ledger_verified?: boolean; transaction_id?: string; transaction_ref?: string; commit_status?: string; created_at?: string; updated_at?: string;
  card_name?: string; notice?: string; application_submitted?: boolean; events?: any[]; [k: string]: any;
};
export type HistoryResp = { referral_id: string; mode?: string; is_live?: boolean; history: any[]; notice?: string };
export const ISSUER_STATUSES = ['ACKNOWLEDGED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'COMPLETED', 'REJECTED'] as const;
// Mirrors ALLOWED_STATUS_TRANSITIONS in backend/ledger.py so the UI only offers moves the backend will accept.
export const TRANSITIONS: Record<string, string[]> = {
  CONSENTED: ['ACKNOWLEDGED'], ACKNOWLEDGED: ['UNDER_REVIEW'], UNDER_REVIEW: ['ACTION_REQUIRED', 'COMPLETED', 'REJECTED'], ACTION_REQUIRED: ['UNDER_REVIEW', 'COMPLETED', 'REJECTED'],
};
const enc = encodeURIComponent;
export const drunixApi = {
  status: () => request<LedgerStatus>('cardwise', '/api/drunix/status'),
  create: (card_id: string, consent: boolean) => request<Referral>('cardwise', '/api/referrals', { method: 'POST', json: { card_id, consent } }),
  get: (id: string) => request<Referral>('cardwise', `/api/referrals/${enc(id)}`),
  history: (id: string) => request<HistoryResp>('cardwise', `/api/referrals/${enc(id)}/history`),
  revoke: (id: string) => request<Referral>('cardwise', `/api/referrals/${enc(id)}/revoke`, { method: 'POST', json: {} }),
  issuerUpdate: (id: string, status: string, consoleToken?: string) =>
    request<Referral>('cardwise', `/api/issuer/referrals/${enc(id)}/status`, { method: 'PATCH', json: { status }, headers: consoleToken ? { 'x-issuer-console-token': consoleToken } : {} }),
};
