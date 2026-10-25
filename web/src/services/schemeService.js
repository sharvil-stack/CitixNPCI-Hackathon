// Single API layer for the Government Schemes backend (backend/main.py).
// Endpoints used: POST /api/match, POST /api/explain, POST /api/extract/voice,
// POST /api/extract/document, GET /api/health, GET /api/audio/{name}.mp3
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(API_BASE + path, options)
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('', 0) // network / CORS / server down
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = typeof body.detail === 'string' ? body.detail
        : Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join('; ') : ''
    } catch { /* non-JSON error body */ }
    throw new ApiError(detail, res.status)
  }
  return res.json()
}

const json = (body, signal) => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
})

export const matchSchemes = (profile, signal) => request('/api/match', json(profile, signal))
export const explainScheme = (scheme, lang, signal) => request('/api/explain', json({ scheme, lang }, signal))
export const checkHealth = (signal) => request('/api/health', { signal })

function upload(path, file, signal) {
  const fd = new FormData()
  fd.append('file', file, file.name || 'upload')
  return request(path, { method: 'POST', body: fd, signal })
}
export const extractFromVoice = (blob, signal) => upload('/api/extract/voice', new File([blob], 'speech.webm', { type: blob.type }), signal)
export const extractFromDocument = (file, signal) => upload('/api/extract/document', file, signal)
export const audioUrl = (path) => API_BASE + path
