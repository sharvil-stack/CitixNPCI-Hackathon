import { request, SERVICE_BASE } from './http';

// govtscheme/backend/main.py (port 8001). Languages: en, hi only.
export type Profile = {
  age?: number | null; gender?: string; state?: string; area?: string;
  income_low?: number | null; income_high?: number | null; occupation?: string; caste?: string;
  needs?: Record<string, 'yes' | 'no'>;
};
export type Scheme = {
  id: string; name: string; level: string; category: string; benefit: string; cash: number | null;
  rules: Record<string, string>; other_conditions: string[]; documents: string[]; steps: string[]; url: string;
  status: 'eligible' | 'almost' | 'need_info'; passed: string[]; failed: { text: string; hint: string | null }[]; unknown: string[];
};
export type MatchResult = { eligible: Scheme[]; almost: Scheme[]; need_info: Scheme[]; cash_total: number };
export type ExtractedProfile = { age?: number; gender?: string; state?: string; area?: string; monthly_income?: number; occupation?: string; caste?: string; needs?: Record<string, string> };

export const schemesApi = {
  match: (p: Profile) => request<MatchResult>('schemes', '/api/match', { method: 'POST', json: p }),
  extractVoice: (blob: Blob, filename = 'speech.webm') => {
    const f = new FormData(); f.append('file', blob, filename);
    return request<{ transcript: string; profile: ExtractedProfile }>('schemes', '/api/extract/voice', { method: 'POST', form: f });
  },
  extractDocument: (file: File) => {
    const f = new FormData(); f.append('file', file);
    return request<{ profile: ExtractedProfile }>('schemes', '/api/extract/document', { method: 'POST', form: f });
  },
  explain: (scheme: Scheme, lang: 'en' | 'hi') => request<{ text: string; audio_url: string }>('schemes', '/api/explain', { method: 'POST', json: { scheme, lang } }),
  audioSrc: (audioUrl: string) => `${SERVICE_BASE.schemes}${audioUrl}`,
  health: () => request<{ schemes_loaded: number }>('schemes', '/api/health'),
};
