import { request } from './http';

// study-backend/app/main.py (port 8002). Languages: en, hi only.
export type Topic = { id: string; active: boolean; icon: string; image: string; title: string; desc: string; lesson_ids: string[] };
export type Lesson = { id: string; index: number; title: string; desc: string; points: string[]; spoken: string; youtube_id: string | null; placeholder: boolean; search_query: string };
export type TopicDetail = { topic: { id: string; icon: string; image: string; title: string; desc: string; intro: string }; lessons: Lesson[] };
export type QuizQ = { id: string; question: string; options: string[]; answer: number; explanation: string };
export type QuizScore = { score: number; total: number; results: { id: string; chosen: number | null; correct_index: number; correct: boolean; explanation: string }[] };
export type SimStep = any; // shape documented in study-backend/app/service.py (_play_budget / _play_scenario)

export const mentorApi = {
  topics: (lang: string) => request<Topic[]>('study', '/api/topics', { query: { lang } }),
  topic: (id: string, lang: string) => request<TopicDetail>('study', `/api/topics/${encodeURIComponent(id)}`, { query: { lang } }),
  quiz: (id: string, lang: string) => request<QuizQ[]>('study', `/api/topics/${encodeURIComponent(id)}/quiz`, { query: { lang } }),
  score: (id: string, lang: string, answers: (number | null)[]) => request<QuizScore>('study', `/api/topics/${encodeURIComponent(id)}/quiz/score`, { method: 'POST', json: { lang, answers } }),
  play: (id: string, lang: string, decisions: any[]) => request<SimStep>('study', `/api/sim/${encodeURIComponent(id)}/play`, { method: 'POST', json: { lang, decisions } }),
  tts: (text: string, lang: string) => request<Blob>('study', '/api/tts', { method: 'POST', json: { text, lang }, blob: true }),
};
