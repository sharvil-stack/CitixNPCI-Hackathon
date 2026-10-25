import { request } from './http';

// backend/app.py (port 8000). Languages: en, hi, mr.
export type Card = {
  id: string; name: string; issuer: string; category: string; annual_fee: number | null; fee_waiver_spend: number | null;
  fd_backed: boolean; minimum_fd: number | null; benefits: string[]; risks: string[]; source_url: string; fees_url: string;
  verified_on: string; data_status: string; note: string;
};
export type Rec = Card & { eligibility: string; why_fit: string; match_strength: string; reason_tags: string[] };
export type Recommendation = {
  path: { mode: string; title: string; summary: string; priority_label: string; goal_advice: string; steps: string[]; application_steps: string[]; application_note: string };
  results: Rec[]; primary_recommendation: Rec | null; alternatives: Rec[]; note: string; goal: string; ranking_explanation: string; application_steps: string[]; application_note: string; catalogue_count: number;
};
export type CardProfile = {
  user_type?: 'new' | 'existing'; age?: number; income?: number; employment?: string; fd_available?: boolean; fd_amount?: number;
  online_spend?: number; offline_spend?: number; fuel_spend?: number; primary_goal?: string; credit_history?: string; payment_capacity?: string; uses_upi?: boolean;
};
export type ChatMsg = { role: 'user' | 'assistant'; content: string };
export type ChatReply = { reply: string; sources?: { id: string; title: string; description: string; url: string; tag: string }[]; lang: string; model: string; blocked_sensitive?: boolean };
export type Lessons = { lessons: { id: string; title: string; text: string }[]; glossary: { term: string; text: string }[] };
export type Resource = { id: string; title: string; description: string; url: string; tag: string };

export const cardApi = {
  health: () => request<{ ai_configured: boolean; provider: string; model: string; languages: string[] }>('cardwise', '/api/health'),
  cards: (lang: string) => request<Card[]>('cardwise', '/api/cards', { query: { lang } }),
  lessons: (lang: string) => request<Lessons>('cardwise', '/api/lessons', { query: { lang } }),
  resources: (lang: string) => request<Resource[]>('cardwise', '/api/resources', { query: { lang } }),
  chat: (messages: ChatMsg[], lang: string, profile: CardProfile) => request<ChatReply>('cardwise', '/api/chat', { method: 'POST', json: { messages, lang, profile } }),
  parseProfile: (utterance: string, lang: string) => request<{ fields: CardProfile; heard: string; blocked_sensitive?: boolean; warning?: string }>('cardwise', '/api/parse-profile', { method: 'POST', json: { utterance, lang } }),
  recommend: (profile: CardProfile, lang: string) => request<Recommendation>('cardwise', '/api/recommend', { method: 'POST', json: { profile, lang } }),
  tts: (text: string, lang: string) => request<Blob>('cardwise', '/api/tts', { method: 'POST', json: { text, lang }, blob: true }),
};
