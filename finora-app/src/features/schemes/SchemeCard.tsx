import { useState } from 'react';
import { Icon } from '../../lib/icons';
import { Pill, Notice, Spinner } from '../../components/ui/Feedback';
import { schemesApi, type Scheme } from '../../services/schemes';
import { errMsg } from '../../services/http';
import { useLang } from '../../context/LangContext';

const STATUS: Record<string, { label: string; kind: '' | 'ok' | 'warn' }> = {
  eligible: { label: 'Likely eligible', kind: 'ok' }, almost: { label: 'Almost eligible', kind: 'warn' }, need_info: { label: 'Need more information', kind: '' },
};
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function SchemeCard({ s, mode }: { s: Scheme; mode: 'browse' | 'result' }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [ex, setEx] = useState<{ text: string; audio: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const explainLang: 'en' | 'hi' = lang === 'hi' ? 'hi' : 'en';

  const explain = async () => {
    setBusy(true); setErr('');
    try { const r = await schemesApi.explain(s, explainLang); setEx({ text: r.text, audio: schemesApi.audioSrc(r.audio_url) }); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const st = STATUS[s.status];

  return (
    <article className="card" style={{ display: 'grid', gap: 16 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="cat-tag">{s.category} · {s.level}</span>
          <h3 style={{ marginBottom: 0 }}>{s.name}</h3>
        </div>
        {mode === 'result' && <Pill kind={st.kind}>{st.label}</Pill>}
      </div>
      <p style={{ color: '#cdd3ce' }}>{s.benefit}</p>
      {s.cash ? <p className="muted" style={{ fontSize: 14 }}>Listed cash value: <b style={{ color: 'var(--sage)' }}>{inr(s.cash)}</b> per year</p> : null}

      {mode === 'result' && (
        <div className="stack" style={{ gap: 12 }}>
          {s.passed.length > 0 && <div><div className="label">Why you may qualify</div><ul className="clean dots">{s.passed.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {s.failed.length > 0 && <div><div className="label">What does not match yet</div><ul className="clean dots">{s.failed.map((x) => <li key={x.text}>{x.text}{x.hint && <span className="muted"> — {x.hint}</span>}</li>)}</ul></div>}
          {s.unknown.length > 0 && <div><div className="label">We still need to know</div><ul className="clean dots">{s.unknown.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
      )}
      {mode === 'browse' && s.unknown.length > 0 && <div><div className="label">Eligibility criteria</div><ul className="clean dots">{s.unknown.map((x) => <li key={x}>{x}</li>)}</ul></div>}

      <div className="row">
        <button className="btn btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="chevron" size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />{open ? 'Hide details' : 'Conditions, documents & steps'}</button>
        <button className="btn btn-sm" onClick={explain} disabled={busy}>{busy ? <Spinner /> : <Icon name="volume" size={15} />}Explain simply</button>
        {s.url && <a className="btn btn-sm btn-ghost" href={s.url} target="_blank" rel="noopener noreferrer">Official page <Icon name="external" size={14} /></a>}
      </div>
      {err && <Notice kind="bad">{err}</Notice>}
      {ex && (
        <div className="notice ok" style={{ flexDirection: 'column' }}>
          <p style={{ color: 'var(--text)' }}>{ex.text}</p>
          <audio controls src={ex.audio} style={{ width: '100%', colorScheme: 'dark' }} preload="none">Your browser does not support audio.</audio>
          <span className="muted" style={{ fontSize: 12.5 }}>AI-written summary of the scheme facts above, in {explainLang === 'hi' ? 'Hindi' : 'English'}. It adds no new rules and is not an official decision.</span>
        </div>
      )}
      {open && (
        <div className="grid g3" style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <div><div className="label">Other conditions</div>{s.other_conditions.length ? <ul className="clean dots">{s.other_conditions.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">None listed.</p>}</div>
          <div><div className="label">Documents needed</div>{s.documents.length ? <ul className="clean dots">{s.documents.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">None listed.</p>}</div>
          <div><div className="label">How to apply</div>{s.steps.length ? <ol className="num">{s.steps.map((x) => <li key={x}>{x}</li>)}</ol> : <p className="muted">None listed.</p>}</div>
        </div>
      )}
    </article>
  );
}
