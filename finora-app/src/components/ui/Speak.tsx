import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../lib/icons';
import { errMsg } from '../../services/http';

const SPEECH: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

// Read-aloud control. Uses the backend's TTS endpoint; if it is unavailable, falls back to the browser's speech voices.
export function SpeakButton({ text, lang, synth, label = 'Listen', small = true }: { text: string; lang: string; synth: (text: string, lang: string) => Promise<Blob>; label?: string; small?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [note, setNote] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const stop = () => {
    audio.current?.pause(); audio.current = null; window.speechSynthesis?.cancel();
    if (url.current) { URL.revokeObjectURL(url.current); url.current = null; }
    setState('idle');
  };
  useEffect(() => stop, []); // stop on unmount
  useEffect(() => { stop(); setNote(''); }, [text, lang]); // eslint-disable-line

  const play = async () => {
    if (state !== 'idle') return stop();
    setNote(''); setState('loading');
    try {
      const blob = await synth(text, lang);
      url.current = URL.createObjectURL(blob);
      const a = new Audio(url.current); audio.current = a; a.onended = stop; a.onerror = stop;
      await a.play(); setState('playing');
    } catch (e) {
      if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
        const u = new SpeechSynthesisUtterance(text); u.lang = SPEECH[lang] || 'en-IN'; u.onend = stop; u.onerror = stop;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); setState('playing');
        setNote('Server voice unavailable — using your browser’s voice.');
      } else { setState('idle'); setNote(errMsg(e)); }
    }
  };
  return (
    <span className="audio-btn" style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button type="button" className={`btn ${small ? 'btn-sm' : ''}`} onClick={play} aria-pressed={state === 'playing'} disabled={!text.trim()}>
        {state === 'loading' ? <span className="spinner" /> : <Icon name={state === 'playing' ? 'pause' : 'volume'} size={16} />}
        {state === 'playing' ? 'Stop' : label}
      </button>
      {note && <span className="muted" style={{ fontSize: 12.5 }} role="status">{note}</span>}
    </span>
  );
}
