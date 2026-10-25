import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';
import { useAsync } from '../../hooks/useAsync';
import { MiniHero, Crumb, Capability } from '../../components/ui/MiniHero';
import { Empty, ErrorNotice, Loading, Notice, Pill, Skeletons, Spinner } from '../../components/ui/Feedback';
import { Reveal } from '../../components/ui/Reveal';
import { SpeakButton } from '../../components/ui/Speak';
import { cardApi, type CardProfile, type ChatMsg, type Recommendation, type ChatReply } from '../../services/cardwise';
import { errMsg } from '../../services/http';
import { CardTabs, CardTile, DataStatus, catLabel, inr, profileStore, useDictation } from './shared';

const GOALS: [string, string][] = [['build_history', 'Build credit history'], ['cashback', 'Cashback on everyday spending'], ['bill_payments', 'Cashback on bills'], ['online_shopping', 'Online shopping rewards'], ['upi_payments', 'Pay with UPI'], ['travel', 'Travel'], ['fuel_savings', 'Fuel savings'], ['low_fees', 'Low fees'], ['learn_manage', 'Learn to manage my card'], ['debt_safety', 'Get out of / avoid debt']];
const DISCLAIMER = 'This is an educational comparison from a small sample catalogue — not a bank offer, approval or prediction of approval. Fees, rewards and eligibility change; confirm everything with the issuer before applying.';

/* ---------- Landing ---------- */
function Landing() {
  return (
    <div className="page" style={{ paddingTop: 8 }}>
      <MiniHero icon="card" eyebrow="CREDIT CARD GUIDANCE" title="CardWise" em="— understand before you apply."
        actions={<><Link to="/cards/recommend" className="btn btn-primary">Find a card <Icon name="arrow" size={16} /></Link><Link to="/cards/browse" className="btn">Browse the catalogue</Link></>}>
        Compare cards on fees, interest and rewards, learn how credit really works, and ask questions in English, Hindi or Marathi. New to credit? There is a path for you too.
      </MiniHero>
      <div className="wrap" style={{ padding: '56px 24px 24px' }}>
        <div className="grid g3">
          <Capability icon="search" title="Card catalogue">Search and filter sample cards by category, fee and FD-backed options, with benefits and risks side by side.</Capability>
          <Capability icon="user" title="Personal pathway" delay={80}>Describe your situation by form, text or voice and get a transparent, rule-based comparison — never an approval promise.</Capability>
          <Capability icon="bot" title="Ask the assistant" delay={160}>Plain-language answers on fees, minimum due, CIBIL, RuPay on UPI and card safety, with read-aloud.</Capability>
          <Capability icon="book" title="Lessons &amp; resources" delay={0}>Short lessons, a glossary and links to RBI, NPCI and NCFE learning material.</Capability>
          <Capability icon="shield" title="Safety first" delay={80}>Messages that look like they contain OTPs, card numbers or IDs are blocked before they reach the assistant.</Capability>
          <Capability icon="link" title="Hand-off receipts" delay={160}>After choosing a card, create a consent-based DRUNIX receipt — it records only a random reference, card and issuer.</Capability>
        </div>
        <div style={{ marginTop: 22 }}><Notice kind="warn">{DISCLAIMER}</Notice></div>
      </div>
    </div>
  );
}

/* ---------- Catalogue ---------- */
function Browse() {
  const { lang } = useLang();
  const cards = useAsync(() => cardApi.cards(lang), [lang]);
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all'); const [fee, setFee] = useState('any'); const [fd, setFd] = useState(false);
  const cats = useMemo(() => ['all', ...Array.from(new Set((cards.data || []).map((c) => c.category))).sort()], [cards.data]);
  const shown = (cards.data || []).filter((c) => (cat === 'all' || c.category === cat) && (!fd || c.fd_backed) && (fee === 'any' || (fee === 'free' ? c.annual_fee === 0 : (c.annual_fee ?? 0) <= 1000))
    && (!q.trim() || `${c.name} ${c.issuer} ${c.category} ${c.benefits.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <div className="wrap page">
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">CARDWISE</span><h1 className="display">Card catalogue</h1><p className="lede">A curated sample of {cards.data?.length ?? '…'} cards — not the whole market.</p></div>
      <CardTabs active="/cards/browse" />
      <div className="card stack" style={{ marginBottom: 24 }}>
        <div className="grid g3">
          <div className="field"><label htmlFor="cq">Search</label><input id="cq" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Card, bank or benefit" /></div>
          <div className="field"><label htmlFor="cc">Category</label><select id="cc" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : catLabel(c)}</option>)}</select></div>
          <div className="field"><label htmlFor="cf">Annual fee</label><select id="cf" className="select" value={fee} onChange={(e) => setFee(e.target.value)}><option value="any">Any</option><option value="free">₹0 only</option><option value="low">Up to ₹1,000</option></select></div>
        </div>
        <label className="check"><input type="checkbox" checked={fd} onChange={(e) => setFd(e.target.checked)} /> Only FD-backed (secured) cards — a route into credit without income proof or history</label>
      </div>
      {cards.loading ? <Skeletons /> : cards.error ? <ErrorNotice message={cards.error} onRetry={cards.reload} /> : shown.length === 0 ? <Empty title="No cards match">Loosen a filter or clear the search.</Empty> : (
        <><p className="muted" style={{ marginBottom: 14 }} role="status">{shown.length} card{shown.length === 1 ? '' : 's'}</p><div className="grid g3">{shown.map((c) => <Reveal key={c.id}><CardTile c={c} /></Reveal>)}</div></>
      )}
      <div style={{ marginTop: 28 }}><Notice kind="warn">{DISCLAIMER}</Notice></div>
    </div>
  );
}

/* ---------- Card detail ---------- */
function Detail({ id }: { id: string }) {
  const { lang } = useLang(); const nav = useNavigate();
  const cards = useAsync(() => cardApi.cards(lang), [lang]);
  const c = cards.data?.find((x) => x.id === id);
  return (
    <div className="wrap page" style={{ maxWidth: 980 }}>
      <Crumb to="/cards/browse">Catalogue</Crumb>
      {cards.loading ? <Loading /> : cards.error ? <ErrorNotice message={cards.error} onRetry={cards.reload} /> : !c ? <Empty title="Card not found"><Link to="/cards/browse" className="btn btn-primary">Back to catalogue</Link></Empty> : (
        <div className="stack" style={{ gap: 26 }}>
          <div className="page-head" style={{ marginBottom: 0 }}><span className="cat-tag">{catLabel(c.category)}{c.fd_backed ? ' · FD-backed' : ''}</span><h1 className="display">{c.name}</h1><p className="lede">{c.issuer}</p><div><DataStatus c={c} /></div></div>
          <div className="grid g3"><div className="stat"><b>{c.annual_fee === 0 ? '₹0' : inr(c.annual_fee)}</b><span>annual fee (as listed)</span></div><div className="stat"><b>{c.fee_waiver_spend ? inr(c.fee_waiver_spend) : '—'}</b><span>spend for fee waiver</span></div><div className="stat"><b>{c.fd_backed ? inr(c.minimum_fd) : 'n/a'}</b><span>minimum FD</span></div></div>
          <div className="grid g2">
            <div className="card"><h3>Benefits</h3><ul className="clean dots" style={{ marginTop: 12 }}>{c.benefits.map((b) => <li key={b}>{b}</li>)}</ul></div>
            <div className="card"><h3>Risks &amp; things to check</h3><ul className="clean dots" style={{ marginTop: 12 }}>{c.risks.map((b) => <li key={b}>{b}</li>)}</ul></div>
          </div>
          {c.note && <Notice>{c.note}</Notice>}
          <Notice kind="warn">{DISCLAIMER}</Notice>
          <div className="btn-row">
            <a className="btn" href={c.source_url} target="_blank" rel="noopener noreferrer">Issuer page <Icon name="external" size={14} /></a>
            <a className="btn" href={c.fees_url} target="_blank" rel="noopener noreferrer">Fees &amp; charges <Icon name="external" size={14} /></a>
            <button className="btn" onClick={() => nav(`/cards/assistant?q=${encodeURIComponent(`Tell me about the ${c.name} card and what to check before applying.`)}`)}><Icon name="bot" size={15} /> Ask the assistant</button>
            <button className="btn btn-primary" onClick={() => nav(`/referrals?card=${encodeURIComponent(c.id)}`)}><Icon name="link" size={15} /> Create referral receipt</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Recommend ---------- */
const num = (s: string) => (s.trim() === '' ? undefined : Math.max(0, Number(s.replace(/,/g, ''))) || 0);
type F = Record<string, string>;
function toProfile(f: F): CardProfile {
  const p: CardProfile = {};
  if (f.user_type) p.user_type = f.user_type as any;
  for (const k of ['age', 'income', 'fd_amount', 'online_spend', 'offline_spend', 'fuel_spend'] as const) { const v = num(f[k] || ''); if (v !== undefined) (p as any)[k] = v; }
  if (f.employment) p.employment = f.employment; if (f.primary_goal) p.primary_goal = f.primary_goal; if (f.credit_history) p.credit_history = f.credit_history; if (f.payment_capacity) p.payment_capacity = f.payment_capacity;
  if (f.fd_available) p.fd_available = f.fd_available === 'yes'; if (f.uses_upi) p.uses_upi = f.uses_upi === 'yes';
  return p;
}
const fromProfile = (p: CardProfile): F => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v)]));

function Recommend() {
  const { lang } = useLang();
  const [f, setF] = useState<F>(() => fromProfile(profileStore.get()));
  const [say, setSay] = useState(''); const [parsing, setParsing] = useState(false); const [note, setNote] = useState<{ k: 'ok' | 'warn' | 'bad'; t: string } | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [rec, setRec] = useState<Recommendation | null>(null);
  const dict = useDictation(lang, (t) => setSay((s) => (s ? s + ' ' : '') + t));
  const up = (k: string, v: string) => setF({ ...f, [k]: v });
  const Seg = ({ k, o }: { k: string; o: [string, string][] }) => <div className="seg" role="group">{o.map(([v, l]) => <button type="button" key={v} aria-pressed={f[k] === v} onClick={() => up(k, f[k] === v ? '' : v)}>{l}</button>)}</div>;
  const Num = ({ k, label, hint }: { k: string; label: string; hint?: string }) => <div className="field"><label htmlFor={k}>{label}</label><input id={k} className="input" inputMode="numeric" value={f[k] || ''} onChange={(e) => up(k, e.target.value.replace(/[^\d]/g, '').slice(0, 9))} />{hint && <span className="muted" style={{ fontSize: 12.5 }}>{hint}</span>}</div>;

  const parse = async () => {
    setParsing(true); setNote(null);
    try {
      const r = await cardApi.parseProfile(say, lang);
      if (r.blocked_sensitive) return setNote({ k: 'warn', t: r.warning || 'Please remove sensitive details and try again.' });
      const got = fromProfile(r.fields || {}); setF({ ...f, ...got });
      setNote(Object.keys(got).length ? { k: 'ok', t: `Filled: ${Object.keys(got).map((x) => x.replace(/_/g, ' ')).join(', ')}. Please check and correct below.` } : { k: 'warn', t: 'We could not pick out any details. Try adding age, income and what you want from a card.' });
    } catch (e) { setNote({ k: 'bad', t: errMsg(e) }); } finally { setParsing(false); }
  };
  const submit = async () => {
    setBusy(true); setErr('');
    try { const p = toProfile(f); profileStore.set(p); setRec(await cardApi.recommend(p, lang)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="wrap page">
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">CARDWISE</span><h1 className="display">{rec ? 'Your card pathway' : 'Find a card'}</h1><p className="lede">{rec ? rec.ranking_explanation : 'Tell us about your situation. Every answer is optional, and nothing here is stored.'}</p></div>
      <CardTabs active="/cards/recommend" />
      {err && <div style={{ marginBottom: 20 }}><ErrorNotice message={err} onRetry={submit} /></div>}
      {rec ? (
        <div className="stack" style={{ gap: 24 }}>
          <div className="panel panel-sage stack"><span className="eyebrow">{rec.path.priority_label}</span><h2 className="title-md">{rec.path.title}</h2><p style={{ color: '#cdd3ce' }}>{rec.note || rec.path.summary}</p><p className="muted">{rec.path.goal_advice}</p>
            {rec.path.steps?.length > 0 && <ol className="num" style={{ marginTop: 6 }}>{rec.path.steps.map((s) => <li key={s}>{s}</li>)}</ol>}</div>
          {rec.results.length === 0 ? <Empty title="No card to suggest right now">{rec.note}</Empty> : <div className="grid g2">{rec.results.map((c, i) => (
            <Reveal key={c.id}><article className="card stack" style={{ gap: 14, height: '100%', borderColor: i === 0 ? 'var(--forest)' : undefined }}>
              <div className="row between"><span className="cat-tag">{i === 0 ? 'Closest match' : 'Also consider'} · {catLabel(c.category)}</span>{c.fd_backed && <Pill>FD-backed</Pill>}</div>
              <div><h3 style={{ marginBottom: 2 }}>{c.name}</h3><span className="muted" style={{ fontSize: 14 }}>{c.issuer} · annual fee {c.annual_fee === 0 ? '₹0' : inr(c.annual_fee)}</span></div>
              <p style={{ color: '#cdd3ce' }}>{c.why_fit}</p>
              {c.eligibility && <p className="muted" style={{ fontSize: 14 }}><b>Eligibility (issuer decides):</b> {c.eligibility}</p>}
              <div><div className="label">Benefits</div><ul className="clean dots">{c.benefits.slice(0, 3).map((b) => <li key={b}>{b}</li>)}</ul></div>
              <div><div className="label">Watch out for</div><ul className="clean dots">{c.risks.slice(0, 2).map((b) => <li key={b}>{b}</li>)}</ul></div>
              <DataStatus c={c} />
              <div className="row" style={{ marginTop: 'auto' }}><Link to={`/cards/${c.id}`} className="btn btn-sm">Details</Link><a className="btn btn-sm btn-ghost" href={c.fees_url} target="_blank" rel="noopener noreferrer">Fees <Icon name="external" size={13} /></a></div>
            </article></Reveal>))}</div>}
          {rec.application_steps?.length > 0 && <div className="card"><h3>Before you apply</h3><ol className="num" style={{ marginTop: 14 }}>{rec.application_steps.map((s) => <li key={s}>{s}</li>)}</ol><p className="muted" style={{ marginTop: 14, fontSize: 14 }}>{rec.application_note}</p></div>}
          <Notice kind="warn">{DISCLAIMER}</Notice>
          <div className="btn-row"><button className="btn btn-primary" onClick={() => setRec(null)}><Icon name="back" size={16} />Edit my answers</button><Link to="/cards/assistant" className="btn"><Icon name="bot" size={15} />Ask a question</Link></div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 24 }}>
          <div className="panel stack">
            <h3 className="title-md" style={{ fontSize: 28 }}>Describe yourself (optional)</h3>
            <p className="muted">For example: “I’m 21, a student with no income and no credit history. I can keep ₹20,000 in an FD and want to build credit.” Don’t include card numbers, OTPs or IDs.</p>
            <textarea className="textarea" style={{ minHeight: 100 }} value={say} onChange={(e) => setSay(e.target.value)} maxLength={1800} aria-label="Describe your situation" />
            <div className="row"><button className="btn" onClick={parse} disabled={parsing || !say.trim()}>{parsing ? <Spinner /> : <Icon name="user" size={15} />} Fill the form for me</button>
              {dict.supported && <button className={`btn ${dict.on ? 'btn-danger' : ''}`} onClick={dict.toggle}><Icon name={dict.on ? 'stop' : 'mic'} size={15} />{dict.on ? 'Stop' : 'Speak'}</button>}</div>
            {note && <Notice kind={note.k}>{note.t}</Notice>}
          </div>
          <form className="panel stack" style={{ gap: 22 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="grid g2">
              <div className="field"><span className="label">Do you already have a credit card?</span><Seg k="user_type" o={[['new', 'No, I’m new'], ['existing', 'Yes']]} /></div>
              <Num k="age" label="Age" />
              <Num k="income" label="Monthly income (₹)" hint="Enter 0 if you have none." />
              <div className="field"><label htmlFor="emp">Employment</label><select id="emp" className="select" value={f.employment || ''} onChange={(e) => up('employment', e.target.value)}><option value="">Prefer not to say</option><option value="student">Student</option><option value="salaried">Salaried</option><option value="self-employed">Self-employed</option><option value="other">Other</option></select></div>
              <div className="field"><span className="label">Credit history</span><Seg k="credit_history" o={[['none', 'None'], ['limited', 'Limited'], ['established', 'Established']]} /></div>
              <div className="field"><span className="label">Can you pay the full bill every month?</span><Seg k="payment_capacity" o={[['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]} /></div>
              <div className="field"><span className="label">Could you keep money in a Fixed Deposit?</span><Seg k="fd_available" o={[['yes', 'Yes'], ['no', 'No']]} /></div>
              {f.fd_available === 'yes' && <Num k="fd_amount" label="Amount you could set aside (₹)" />}
              <div className="field"><span className="label">Do you use UPI?</span><Seg k="uses_upi" o={[['yes', 'Yes'], ['no', 'No']]} /></div>
              <Num k="online_spend" label="Monthly online spend (₹)" /><Num k="offline_spend" label="Monthly in-store spend (₹)" /><Num k="fuel_spend" label="Monthly fuel spend (₹)" />
            </div>
            <div className="field"><label htmlFor="goal">Main goal</label><select id="goal" className="select" value={f.primary_goal || ''} onChange={(e) => up('primary_goal', e.target.value)}><option value="">Let CardWise choose from my situation</option>{GOALS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="row between"><button type="button" className="btn btn-ghost" onClick={() => { setF({}); profileStore.set({}); }}>Clear</button><button className="btn btn-primary" disabled={busy}>{busy ? <><Spinner /> Comparing…</> : <>Show my pathway <Icon name="arrow" size={16} /></>}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- Assistant ---------- */
type Msg = ChatMsg & { sources?: ChatReply['sources']; blocked?: boolean };
const STARTERS = ['What is the difference between minimum due and total due?', 'How can I get my first credit card with no credit history?', 'Can I use a credit card on UPI?', 'How do I stay safe from card scams?'];
function Assistant() {
  const { lang } = useLang(); const q0 = useSearchParams().get('q') || '';
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(q0); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const health = useAsync(() => cardApi.health(), []);
  const dict = useDictation(lang, (t) => setInput((s) => (s ? s + ' ' : '') + t));
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);
  const send = async (text: string) => {
    const t = text.trim(); if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: t }]; setMsgs(next); setInput(''); setBusy(true); setErr('');
    try {
      const r = await cardApi.chat(next.slice(-16).map(({ role, content }) => ({ role, content })), lang, profileStore.get());
      setMsgs([...next, { role: 'assistant', content: r.reply, sources: r.sources, blocked: r.blocked_sensitive }]);
    } catch (e) { setErr(errMsg(e)); setInput(t); setMsgs(msgs); } finally { setBusy(false); }
  };
  return (
    <div className="wrap page" style={{ maxWidth: 920 }}>
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">CARDWISE</span><h1 className="display">Ask the assistant</h1><p className="lede">Plain answers about credit cards, in your language. Don’t share OTPs, card numbers or IDs here.</p></div>
      <CardTabs active="/cards/assistant" />
      {health.data && !health.data.ai_configured && <div style={{ marginBottom: 16 }}><Notice kind="warn">The assistant’s AI model is not configured on the server (set GROQ_API_KEY in the root .env and restart CardWise). Chat will fail until then.</Notice></div>}
      <div className="chat">
        <div className="chat-log" ref={log} aria-live="polite">
          {msgs.length === 0 && <div className="stack" style={{ margin: 'auto', textAlign: 'center', justifyItems: 'center', maxWidth: 520 }}><span className="tool-icon"><Icon name="bot" /></span><h3 style={{ fontSize: 26 }}>What would you like to know?</h3>
            <div className="chips" style={{ justifyContent: 'center' }}>{STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div></div>}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
              {m.content}
              {m.role === 'assistant' && <div className="stack" style={{ marginTop: 10, gap: 8 }}>
                {m.blocked && <Pill kind="warn">Not processed — sensitive data</Pill>}
                {m.sources?.length ? <div className="chips">{m.sources.map((s) => <a key={s.id} className="chip" href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <Icon name="external" size={11} /></a>)}</div> : null}
                <div><SpeakButton text={m.content} lang={lang} synth={cardApi.tts} /></div></div>}
            </div>))}
          {busy && <div className="msg bot"><span className="row"><Spinner /> Thinking…</span></div>}
        </div>
        {err && <div style={{ padding: '0 14px' }}><ErrorNotice message={err} /></div>}
        <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          {dict.supported && <button type="button" className={`btn ${dict.on ? 'btn-danger' : ''}`} onClick={dict.toggle} aria-label={dict.on ? 'Stop dictation' : 'Dictate'} style={{ padding: 12 }}><Icon name={dict.on ? 'stop' : 'mic'} size={18} /></button>}
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about fees, interest, rewards, safety…" maxLength={3000} aria-label="Your question" disabled={busy} />
          <button className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Send"><Icon name="send" size={18} /></button>
        </form>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>AI-generated answers can be wrong. Check fees and terms with your bank. Conversations are not saved by FINORA.</p>
    </div>
  );
}

/* ---------- Learn ---------- */
function Learn() {
  const { lang } = useLang();
  const ls = useAsync(() => cardApi.lessons(lang), [lang]); const rs = useAsync(() => cardApi.resources(lang), [lang]);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="wrap page">
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">CARDWISE</span><h1 className="display">Learn the basics</h1></div>
      <CardTabs active="/cards/learn" />
      {ls.loading ? <Loading /> : ls.error ? <ErrorNotice message={ls.error} onRetry={ls.reload} /> : (
        <div className="stack" style={{ gap: 14 }}>{ls.data!.lessons.map((l) => (
          <article key={l.id} className="card stack" style={{ gap: 12 }}>
            <div className="row between"><h3 style={{ marginBottom: 0 }}>{l.title}</h3><div className="row"><SpeakButton text={l.text} lang={lang} synth={cardApi.tts} /><button className="btn btn-sm" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Hide' : 'Read'}</button></div></div>
            {open === l.id && <p style={{ color: '#cdd3ce' }}>{l.text}</p>}
          </article>))}</div>
      )}
      {ls.data && <div className="section-head" style={{ marginTop: 56, marginBottom: 20 }}><h2 className="title-md">Glossary</h2></div>}
      {ls.data && <div className="grid g2">{ls.data.glossary.map((g) => <div key={g.term} className="card" style={{ padding: 20 }}><span className="cat-tag">{g.term}</span><p style={{ marginTop: 6, color: '#cdd3ce', fontSize: 15 }}>{g.text}</p></div>)}</div>}
      <div className="section-head" style={{ marginTop: 56, marginBottom: 20 }}><h2 className="title-md">Trusted resources</h2></div>
      {rs.loading ? <Loading /> : rs.error ? <ErrorNotice message={rs.error} onRetry={rs.reload} /> : <div className="grid g2">{rs.data!.map((r) => (
        <a key={r.id} className="card hover stack" href={r.url} target="_blank" rel="noopener noreferrer" style={{ gap: 6 }}><span className="cat-tag">{r.tag}</span><h3 style={{ fontSize: 22, marginBottom: 0 }}>{r.title} <Icon name="external" size={14} /></h3><p className="muted" style={{ fontSize: 14.5 }}>{r.description}</p></a>))}</div>}
    </div>
  );
}

export default function CardWiseApp({ view, id = '' }: { view: 'landing' | 'browse' | 'detail' | 'recommend' | 'assistant' | 'learn'; id?: string }) {
  return view === 'landing' ? <Landing /> : view === 'browse' ? <Browse /> : view === 'detail' ? <Detail id={id} /> : view === 'recommend' ? <Recommend /> : view === 'assistant' ? <Assistant /> : <Learn />;
}
