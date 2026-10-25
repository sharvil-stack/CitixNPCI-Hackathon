import { useCallback, useRef, useState } from 'react';

// Microphone capture via MediaRecorder; returns the recorded Blob on stop.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const resolver = useRef<((b: Blob | null) => void) | null>(null);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('Voice recording is not supported in this browser.'); return false; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolver.current?.(chunks.current.length ? new Blob(chunks.current, { type: r.mimeType || 'audio/webm' }) : null);
      };
      r.start(); rec.current = r; setRecording(true); return true;
    } catch {
      setError('Microphone access was blocked. Allow it in your browser settings, or use the form instead.'); return false;
    }
  }, []);
  const stop = useCallback(() => new Promise<Blob | null>((res) => {
    resolver.current = res; setRecording(false);
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop(); else res(null);
  }), []);
  return { recording, error, start, stop };
}
