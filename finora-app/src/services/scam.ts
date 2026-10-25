import { request } from './http';

// Spring Boot ScamController (port 8080) — it calls the Python ML service itself, so the UI only talks to Spring.
export type ScamSignal = { name: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' | string; description: string };
export type ScamResult = { riskScore: number; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; verdict: string; explanation: string; detectedSignals: ScamSignal[]; recommendations: string[] };
export type ScamExample = { category: string; message: string };

export const scamApi = {
  analyze: (message: string) => request<ScamResult>('scam', '/api/scams/analyze', { method: 'POST', json: { message } }),
  analyzeImage: (file: Blob, name = 'screenshot.jpg') => {
    const f = new FormData(); f.append('image', file, name);
    return request<ScamResult>('scam', '/api/scams/analyze-image', { method: 'POST', form: f });
  },
  examples: () => request<ScamExample[]>('scam', '/api/scams/examples'),
};
