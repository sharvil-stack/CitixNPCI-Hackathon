import { useEffect, useRef, useState } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';
import { useAsync } from '../../hooks/useAsync';
import { MiniHero, Crumb, Capability, LangNote } from '../../components/ui/MiniHero';
import { ErrorNotice, Notice, Spinner } from '../../components/ui/Feedback';
import { Reveal } from '../../components/ui/Reveal';
import { scamApi, type ScamResult } from '../../services/scam';
import { errMsg } from '../../services/http';
import { shrinkImage } from '../../lib/image';
import { RiskMeter } from './RiskMeter';

const MAX_CHARS = 10000;

function Landing() {
  return (
    <>
      <MiniHero icon="shield" eyebrow="SCAM DETECTION" title="ScamShield AI" em="— pause before you respond."
        actions={<Link to="/scamshield/check" className="btn btn-primary">Check a message <Icon name="arrow" size={16} /></Link>}>
        Paste a suspicious SMS, WhatsApp or email text, or upload a screenshot. ScamShield estimates the risk, shows the warning signs it found and tells you what to do next.
      </MiniHero>
      <div className="wrap" style={{ padding: '56px 24px 24px' }}>
        <div className="grid g3">
          <Capability icon="file" title="Text or screenshot">Paste the message, or upload a screenshot — the text is read from the image for you.</Capability>
          <Capability icon="alert" title="Warning signs explained" delay={80}>Links, KYC requests, OTP asks, urgent language and unexpected rewards are flagged with a plain reason.</Capability>
          <Capability icon="check" title="What to do next" delay={160}>Clear safety steps after every check, whatever the score.</Capability>
        </div>
        <Reveal><div className="panel" style={{ marginTop: 28 }}>
          <h3 className="title-md">Common warning signs</h3>
          <ul className="clean dots" style={{ marginTop: 14 }}>
            <li>It asks for an OTP, PIN, password or CVV. Genuine banks never do.</li>
            <li>It says your account or KYC will be blocked unless you act immediately.</li>
            <li>It promises a prize, refund or job if you pay a small fee first.</li>
            <li>It contains a link you did not expect, or asks you to call an unknown number.</li>
          </ul>
        </div></Reveal>
        <div style={{ marginTop: 20 }}><Notice kind="warn">ScamShield estimates risk; it cannot prove a message is genuine. A low score never guarantees safety — verify with your bank using the number on your card or its official app.</Notice></div>
      </div>
    </>
  );
}

function splitOcr(explanation: string) {
  const marker = ' Text read from the image: "';
  const i = explanation.indexOf(marker);
  if (i < 0) return { text: explanation, ocr: '' };
  return { text: explanation.slice(0, i), ocr: explanation.slice(i + marker.length).replace(/"\s*$/, '') };
}

function Result({ r, onReset }: { r: ScamResult; onReset: () => void }) {
  const { text, ocr } = splitOcr(r.explanation || '');
  const lvl = r.riskLevel;
  const headline = lvl === 'HIGH' ? 'High risk — do not respond or click anything.' : lvl === 'MEDIUM' ? 'Some warning signs found — be careful.' : 'Lower risk detected — but this is not a guarantee of safety.';
  return (
    <div className="stack" style={{ gap: 22 }} aria-live="polite">
      <div className="panel panel-sage"><div className="row" style={{ gap: 36, alignItems: 'center' }}>
        <RiskMeter score={r.riskScore} level={lvl} />
        <div className="stack" style={{ flex: 1, minWidth: 240 }}>
          <span className="eyebrow">VERDICT</span><h2 className="title-md">{r.verdict}</h2>
          <p style={{ color: '#cdd3ce' }}>{headline}</p><p className="muted">{text}</p>
        </div>
      </div></div>
      {ocr && <div className="card"><div className="label">Text read from your screenshot</div><p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{ocr}</p><p className="muted" style={{ fontSize: 13, marginTop: 8 }}>If this is wrong or incomplete, the score may be too. Try a clearer image or paste the text instead.</p></div>}
      <div className="grid g2">
        <div className="card"><h3>Suspicious signals</h3>
          {r.detectedSignals?.length ? <ul className="clean" style={{ marginTop: 14 }}>{r.detectedSignals.map((s) => <li key={s.name} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <div className="row between"><b>{s.name}</b><span className={`sev ${s.severity}`}>{s.severity}</span></div><p className="muted" style={{ marginTop: 4, fontSize: 14.5 }}>{s.description}</p></li>)}</ul>
            : <p className="muted" style={{ marginTop: 10 }}>No specific warning signs were flagged. That does not mean the message is safe.</p>}
        </div>
        <div className="card"><h3>What to do</h3>
          {r.recommendations?.length ? <ol className="num" style={{ marginTop: 14 }}>{r.recommendations.map((x) => <li key={x}>{x}</li>)}</ol> : <p className="muted" style={{ marginTop: 10 }}>Do not share OTPs or card details, and verify through your bank’s official app or the number on your card.</p>}
        </div>
      </div>
      <Notice>Never share your OTP, PIN, CVV or password with anyone who contacts you. If you already did, call your bank immediately using the number on your card and report the fraud at cybercrime.gov.in or helpline 1930.</Notice>
      <div><button className="btn btn-primary" onClick={onReset}><Icon name="refresh" size={16} />Analyze another message</button></div>
    </div>
  );
}

const STAGES = ['Reading the message…', 'Looking for warning signs…', 'Scoring the risk…'];

function Check() {
  const { lang } = useLang();
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false); const [stage, setStage] = useState(0);
  const [err, setErr] = useState(''); const [res, setRes] = useState<ScamResult | null>(null);
  const [over, setOver] = useState(false); const [resizedNote, setResizedNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const examples = useAsync(() => scamApi.examples(), []);

  useEffect(() => { if (!busy) return; setStage(0); const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1400); return () => clearInterval(t); }, [busy]);
  useEffect(() => { if (!file) { setPreview(''); return; } const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);

  const pick = (f?: File | null) => {
    setErr('');
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(f.type)) return setErr('Please choose an image file (PNG, JPG or WebP).');
    if (f.size > 15 * 1024 * 1024) return setErr('That image is larger than 15 MB. Please choose a smaller screenshot.');
    setFile(f);
  };
  const submit = async () => {
    setErr(''); setRes(null); setResizedNote('');
    if (mode === 'text' && !text.trim()) return setErr('Paste a message to check.');
    if (mode === 'image' && !file) return setErr('Choose a screenshot to check.');
    setBusy(true);
    try {
      if (mode === 'text') setRes(await scamApi.analyze(text.trim()));
      else { const s = await shrinkImage(file!); if (s.resized) setResizedNote('Your screenshot was compressed before upload to fit the service’s size limit.'); setRes(await scamApi.analyzeImage(s.blob, s.name)); }
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const reset = () => { setRes(null); setText(''); setFile(null); setErr(''); setResizedNote(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="wrap page">
      <Crumb to="/scamshield">ScamShield AI</Crumb>
      <div className="page-head"><span className="eyebrow">SCAMSHIELD AI</span><h1 className="display">Check a message</h1><p className="lede">Paste the text or upload a screenshot. Nothing is sent to anyone but the ScamShield service.</p></div>
      <LangNote show={lang !== 'en'} />
      {res ? <>{resizedNote && <div style={{ marginBottom: 16 }}><Notice>{resizedNote}</Notice></div>}<Result r={res} onReset={reset} /></> : (
        <div className="split" style={{ alignItems: 'start' }}>
          <div className="panel stack" style={{ gap: 20 }}>
            <div className="seg" role="group" aria-label="Input type"><button aria-pressed={mode === 'text'} onClick={() => { setMode('text'); setErr(''); }}><Icon name="file" size={14} /> Text message</button><button aria-pressed={mode === 'image'} onClick={() => { setMode('image'); setErr(''); }}><Icon name="image" size={14} /> Screenshot</button></div>
            {mode === 'text' ? (
              <div className="field"><label htmlFor="msg">Message to check</label>
                <textarea id="msg" className="textarea" value={text} maxLength={MAX_CHARS} onChange={(e) => setText(e.target.value)} placeholder="Paste the suspicious message here…" disabled={busy} />
                <span className="muted mono" style={{ fontSize: 12.5, textAlign: 'right' }}>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span></div>
            ) : (
              <div className="stack">
                <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} aria-label="Upload screenshot" />
                {!file ? (
                  <div className={`drop ${over ? 'over' : ''}`} role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
                    <Icon name="upload" size={28} /><b style={{ color: 'var(--text)' }}>Drop a screenshot here, or click to choose</b><span style={{ fontSize: 13.5 }}>PNG, JPG or WebP · clear, readable text works best</span>
                  </div>
                ) : (
                  <div className="stack" style={{ justifyItems: 'start' }}>
                    <img src={preview} alt="Screenshot preview" className="preview" />
                    <div className="row"><span className="muted" style={{ fontSize: 14 }}>{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button className="btn btn-sm btn-ghost" onClick={() => setFile(null)} disabled={busy}><Icon name="trash" size={14} />Remove</button></div>
                  </div>
                )}
              </div>
            )}
            {err && <ErrorNotice message={err} onRetry={err.includes('not') || err.includes('Cannot') ? submit : undefined} />}
            <div className="row"><button className="btn btn-primary" onClick={submit} disabled={busy || (mode === 'text' ? !text.trim() : !file)}>{busy ? <><Spinner /> {STAGES[stage]}</> : <><Icon name="shield" size={16} /> Analyze message</>}</button></div>
          </div>
          <div className="stack">
            <div className="card"><h3>Try an example</h3><p className="muted" style={{ marginBottom: 14, fontSize: 14.5 }}>Typical scam patterns supplied by the ScamShield service.</p>
              {examples.loading ? <div className="skel" style={{ height: 80 }} /> : examples.error ? <ErrorNotice message={examples.error} onRetry={examples.reload} /> : (
                <div className="stack" style={{ gap: 10 }}>{examples.data?.map((x) => <button key={x.category} className="opt" onClick={() => { setMode('text'); setText(x.message); setErr(''); }}><span className="stack" style={{ gap: 2 }}><span className="cat-tag">{x.category}</span><span style={{ fontSize: 14.5 }}>{x.message}</span></span></button>)}</div>
              )}
            </div>
            <Notice kind="warn">A low score is not a guarantee of safety. When in doubt, don’t click, don’t pay and don’t share codes.</Notice>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScamShieldApp({ view }: { view: 'landing' | 'check' }) { return view === 'landing' ? <div className="page" style={{ paddingTop: 8 }}><Landing /></div> : <Check />; }
