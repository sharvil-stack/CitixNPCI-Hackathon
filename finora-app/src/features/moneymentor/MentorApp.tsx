import { useEffect, useMemo, useState } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';
import { useAsync } from '../../hooks/useAsync';
import { MiniHero, Crumb, LangNote } from '../../components/ui/MiniHero';
import { ErrorNotice, Loading, Notice, Pill, Skeletons, Spinner } from '../../components/ui/Feedback';
import { Reveal } from '../../components/ui/Reveal';
import { SpeakButton } from '../../components/ui/Speak';
import { mentorApi, type Lesson, type QuizQ, type QuizScore } from '../../services/mentor';
import { errMsg } from '../../services/http';

const ICON: Record<string, string> = { BarChart3: 'wallet', ShieldCheck: 'shield', Landmark: 'landmark', FileText: 'file' };
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const useStudyLang = () => { const { lang } = useLang(); return { lang, sl: lang === 'hi' ? 'hi' : 'en' }; };

/* ---------------- Dashboard ---------------- */
function Dashboard() {
  const { sl, lang } = useStudyLang();
  const topics = useAsync(() => mentorApi.topics(sl), [sl]);
  return (
    <div className="page" style={{ paddingTop: 8 }}>
      <MiniHero icon="cap" eyebrow="FINANCIAL EDUCATION" title="MoneyMentor" em="— learn by doing."
        actions={topics.data?.find((t) => t.active) ? <Link to={`/learn/${topics.data.find((t) => t.active)!.id}`} className="btn btn-primary">Start with {topics.data.find((t) => t.active)!.title} <Icon name="arrow" size={16} /></Link> : undefined}>
        Short video lessons, hands-on simulations where your choices have consequences, and quizzes that explain every answer. Available in English and Hindi, with read-aloud.
      </MiniHero>
      <div className="wrap" style={{ paddingTop: 48 }}>
        <LangNote show={lang === 'mr'} />
        <div className="section-head" style={{ marginBottom: 28 }}><span className="eyebrow muted">LEARNING DASHBOARD</span><h2 className="title-lg">Pick a topic</h2></div>
        {topics.loading ? <Skeletons n={3} /> : topics.error ? <ErrorNotice message={topics.error} onRetry={topics.reload} /> : (
          <div className="grid g3">
            {topics.data!.map((t, i) => {
              const body = (<>
                <div className="row between"><span className="tool-icon"><Icon name={ICON[t.icon] || 'book'} /></span>{t.active ? <Pill kind="ok">{t.lesson_ids.length} lessons</Pill> : <Pill>Coming soon</Pill>}</div>
                <h3 style={{ marginTop: 18 }}>{t.title}</h3><p className="muted">{t.desc}</p>
                {t.active && <span className="link-cta" style={{ marginTop: 18 }}>Open topic <Icon name="arrow" size={16} /></span>}
              </>);
              return <Reveal key={t.id} delay={i * 60}>{t.active
                ? <Link to={`/learn/${t.id}`} className="card hover" style={{ display: 'block', height: '100%' }}>{body}</Link>
                : <div className="card" style={{ height: '100%', opacity: .55 }} aria-disabled="true">{body}</div>}</Reveal>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Topic detail + lessons ---------------- */
function LessonCard({ l, sl }: { l: Lesson; sl: string }) {
  const speak = `${l.title}. ${l.desc} ${l.points.join('. ')}.`;
  return (
    <article className="card stack" style={{ gap: 16 }}>
      <div className="row between"><div className="row"><span className="stat" style={{ padding: '2px 14px' }}><b style={{ fontSize: 24 }}>{String(l.index).padStart(2, '0')}</b></span><h3 style={{ marginBottom: 0 }}>{l.title}</h3></div><SpeakButton text={speak} lang={sl} synth={mentorApi.tts} /></div>
      <p className="muted">{l.desc}</p>
      <ul className="clean dots">{l.points.map((p) => <li key={p}>{p}</li>)}</ul>
      {l.youtube_id ? (
        <div className="video"><iframe src={`https://www.youtube-nocookie.com/embed/${l.youtube_id}`} title={l.title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>
      ) : (
        <div className="notice"><Icon name="info" size={18} /><div>No video is attached to this lesson yet. <a className="italic-sage" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(l.search_query)}`} target="_blank" rel="noopener noreferrer">Search YouTube for “{l.search_query}” <Icon name="external" size={13} /></a></div></div>
      )}
    </article>
  );
}

function TopicPage({ id }: { id: string }) {
  const { sl, lang } = useStudyLang();
  const d = useAsync(() => mentorApi.topic(id, sl), [id, sl]);
  return (
    <div className="wrap page">
      <Crumb to="/learn">MoneyMentor</Crumb>
      {d.loading ? <Loading /> : d.error ? <ErrorNotice message={d.error} onRetry={d.reload} /> : (
        <>
          <div className="page-head"><span className="eyebrow">TOPIC</span><h1 className="display">{d.data!.topic.title}</h1><p className="lede">{d.data!.topic.intro}</p>
            <div className="btn-row"><Link to={`/learn/${id}/simulation`} className="btn btn-primary"><Icon name="play" size={15} /> Try the simulation</Link><Link to={`/learn/${id}/quiz`} className="btn"><Icon name="check" size={15} /> Take the quiz</Link></div></div>
          <LangNote show={lang === 'mr'} />
          <div className="stack" style={{ gap: 20, marginTop: 8 }}>{d.data!.lessons.map((l) => <Reveal key={l.id}><LessonCard l={l} sl={sl} /></Reveal>)}</div>
          <Notice>Lesson videos are third-party YouTube videos in Hindi unless noted; they open from youtube-nocookie.com. Educational content only — not financial advice.</Notice>
        </>
      )}
    </div>
  );
}

/* ---------------- Simulation ---------------- */
function Allocation({ step, onSubmit, busy, sl }: { step: any; onSubmit: (a: Record<string, number>) => void; busy: boolean; sl: string }) {
  const a = step.allocation; const income: number = a.income;
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(a.categories.map((c: any) => [c.id, c.default])));
  const total = Object.values(vals).reduce((x, y) => x + y, 0); const left = income - total;
  const below = a.categories.filter((c: any) => vals[c.id] < c.min);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="grid g3"><div className="stat"><b>{inr(income)}</b><span>monthly income</span></div><div className="stat"><b>{inr(total)}</b><span>allocated</span></div><div className="stat"><b style={{ color: left === 0 ? 'var(--ok)' : left < 0 ? 'var(--danger)' : 'var(--warn)' }}>{inr(left)}</b><span>{left === 0 ? 'perfectly allocated' : left > 0 ? 'left to allocate' : 'over budget'}</span></div></div>
      <div className="stack" style={{ gap: 22 }}>
        {a.categories.map((c: any) => (
          <div key={c.id} className="slider-row">
            <label htmlFor={`s-${c.id}`}><b>{c.label}</b> <span className="muted" style={{ fontSize: 13.5 }}>· {c.hint}{c.min ? ` · minimum ${inr(c.min)}` : ''}</span></label>
            <span className="mono" style={{ color: vals[c.id] < c.min ? 'var(--danger)' : 'var(--sage)' }}>{inr(vals[c.id])}</span>
            <input id={`s-${c.id}`} type="range" min={0} max={income} step={100} value={vals[c.id]} onChange={(e) => setVals({ ...vals, [c.id]: +e.target.value })} style={{ accentColor: c.color }} />
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 14 }}>{a.note}</p>
      {below.length > 0 && <Notice kind="warn">Below the minimum for: {below.map((c: any) => c.label).join(', ')}.</Notice>}
      <div><button className="btn btn-primary" disabled={busy || left !== 0 || below.length > 0} onClick={() => onSubmit(vals)}>{busy ? <Spinner /> : null} Lock in my budget <Icon name="arrow" size={16} /></button></div>
    </div>
  );
}

function SimReport({ r, onRestart, topic, sl }: { r: any; onRestart: () => void; topic: string; sl: string }) {
  const fmt = (row: any) => (row.format === 'money' && typeof row.value === 'number' ? inr(row.value) : String(row.value));
  const spoken = `${r.headline}. ${r.summary} ${r.tip}`;
  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="panel panel-sage"><div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ maxWidth: 640 }}><span className="eyebrow">YOUR RESULT</span><h2 className="title-md">{r.headline}</h2><p className="muted">{r.summary}</p></div>
        <div className="stat" style={{ textAlign: 'center', minWidth: 120 }}><b style={{ fontSize: 48 }}>{r.score}</b><span>out of 100</span></div></div>
        <div style={{ marginTop: 18 }}><SpeakButton text={spoken} lang={sl} synth={mentorApi.tts} label="Read result aloud" /></div></div>
      <div className="grid g3">{r.snapshot?.map((row: any) => <div key={row.id} className="stat"><b>{fmt(row)}</b><span>{row.label}</span></div>)}</div>
      <div className="grid g2">
        <div className="card"><h3>What went well</h3>{r.went_well?.length ? <ul className="clean dots" style={{ marginTop: 12 }}>{r.went_well.map((x: string) => <li key={x}>{x}</li>)}</ul> : <p className="muted">—</p>}</div>
        <div className="card"><h3>What to improve</h3>{r.improve?.length ? <ul className="clean dots" style={{ marginTop: 12 }}>{r.improve.map((x: string) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Nothing — well played.</p>}</div>
      </div>
      <div className="card"><h3>Your decisions</h3><ol className="num" style={{ marginTop: 14 }}>{r.history?.map((h: any) => <li key={h.round}><b>{h.title}</b>{h.choice && <> — {h.choice}</>}<p className="muted" style={{ fontSize: 14.5 }}>{h.outcome}</p></li>)}</ol></div>
      {r.tip && <Notice icon="info"><b>Tip:</b> {r.tip}</Notice>}
      <div className="btn-row"><button className="btn btn-primary" onClick={onRestart}><Icon name="refresh" size={16} />Play again</button><Link to={`/learn/${topic}/quiz`} className="btn">Take the quiz</Link></div>
    </div>
  );
}

function Simulation({ topic }: { topic: string }) {
  const { sl, lang } = useStudyLang();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [step, setStep] = useState<any>(null);
  const [busy, setBusy] = useState(true); const [err, setErr] = useState('');
  const load = async (d: any[]) => {
    setBusy(true); setErr('');
    try { setStep(await mentorApi.play(topic, sl, d)); setDecisions(d); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  useEffect(() => { load([]); }, [topic, sl]); // eslint-disable-line
  const spoken = step && step.kind !== 'done' ? `${step.title}. ${step.description}` : '';
  return (
    <div className="wrap page" style={{ maxWidth: 880 }}>
      <Crumb to={`/learn/${topic}`}>Back to topic</Crumb>
      <div className="page-head"><span className="eyebrow">SIMULATION</span><h1 className="display">{step?.kind === 'done' ? 'Simulation complete' : step?.title || 'Simulation'}</h1></div>
      <LangNote show={lang === 'mr'} />
      {err && <div style={{ marginBottom: 20 }}><ErrorNotice message={err} onRetry={() => load(decisions)} /></div>}
      {!step ? (busy ? <Loading /> : null) : step.kind === 'done' ? <SimReport r={step.report} onRestart={() => load([])} topic={topic} sl={sl} /> : (
        <div className="stack" style={{ gap: 22 }}>
          <div className="row between"><div className="row" style={{ gap: 8 }}>{step.steps.map((s: string, i: number) => <Pill key={s} kind={i + 1 === step.round ? 'ok' : ''}>{i + 1}. {s}</Pill>)}</div><SpeakButton text={spoken} lang={sl} synth={mentorApi.tts} /></div>
          <div className="progress" aria-hidden="true"><i style={{ width: `${((step.round - 1) / step.total_rounds) * 100}%` }} /></div>
          <p className="lede">{step.description}</p>
          {step.event && <div className="notice warn"><Icon name="alert" size={18} /><div><b>{step.event.label}</b> · {inr(step.event.amount)}</div></div>}
          {step.notes?.map((n: string) => <Notice key={n} kind="warn">{n}</Notice>)}
          {step.status && <div className="grid g3">{step.status.map((s: any) => <div className="stat" key={s.label}><b>{inr(s.value)}</b><span>{s.label}</span></div>)}</div>}
          {step.kind === 'allocate' ? <Allocation step={step} busy={busy} sl={sl} onSubmit={(a) => load([...decisions, { allocation: a }])} /> : (
            <div className="stack">{step.choices.map((c: any) => (
              <button key={c.id} className="opt" disabled={!c.enabled || busy} onClick={() => load([...decisions, { choice: c.id }])}>
                <span className="stack" style={{ gap: 2 }}><b>{c.label}</b><span className="muted" style={{ fontSize: 14.5 }}>{c.description}</span>{!c.enabled && c.reason && <span style={{ color: 'var(--warn)', fontSize: 13.5 }}>{c.reason}</span>}</span>
              </button>))}</div>
          )}
          {step.history?.length > 0 && <div className="card"><div className="label">So far</div><ul className="clean" style={{ marginTop: 10 }}>{step.history.map((h: any) => <li key={h.round}><b>{h.title}</b>{h.choice && <> — {h.choice}</>}<p className="muted" style={{ fontSize: 14 }}>{h.outcome}</p></li>)}</ul></div>}
          {busy && <Loading />}
        </div>
      )}
    </div>
  );
}

/* ---------------- Quiz ---------------- */
function Quiz({ topic }: { topic: string }) {
  const { sl, lang } = useStudyLang();
  const qs = useAsync(() => mentorApi.quiz(topic, sl), [topic, sl]);
  const [answers, setAnswers] = useState<(number | null)[]>([]); const [cur, setCur] = useState(0);
  const [res, setRes] = useState<QuizScore | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (qs.data) { setAnswers(Array(qs.data.length).fill(null)); setCur(0); setRes(null); } }, [qs.data]);
  const answered = answers.filter((a) => a !== null).length;
  const submit = async () => { setBusy(true); setErr(''); try { setRes(await mentorApi.score(topic, sl, answers)); window.scrollTo({ top: 0 }); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  const byId = useMemo(() => Object.fromEntries((qs.data || []).map((q: QuizQ) => [q.id, q])), [qs.data]);

  return (
    <div className="wrap page" style={{ maxWidth: 860 }}>
      <Crumb to={`/learn/${topic}`}>Back to topic</Crumb>
      <div className="page-head"><span className="eyebrow">QUIZ</span><h1 className="display">{res ? 'Your results' : 'Check what you learned'}</h1></div>
      <LangNote show={lang === 'mr'} />
      {qs.loading ? <Loading /> : qs.error ? <ErrorNotice message={qs.error} onRetry={qs.reload} /> : !qs.data?.length ? <Notice>No quiz is available for this topic yet.</Notice> : res ? (
        <div className="stack" style={{ gap: 20 }}>
          <div className="panel panel-sage row between"><div><span className="eyebrow">SCORE</span><h2 className="display" style={{ marginTop: 8 }}>{res.score} / {res.total}</h2><p className="muted">{res.score === res.total ? 'Perfect — every answer correct.' : res.score >= res.total / 2 ? 'Good progress. Review the explanations below.' : 'A good start. Read the explanations and try again.'}</p></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={() => { setAnswers(Array(qs.data!.length).fill(null)); setCur(0); setRes(null); }}><Icon name="refresh" size={16} />Retake</button><Link to={`/learn/${topic}`} className="btn">Review lessons</Link></div></div>
          {res.results.map((r, i) => { const q = byId[r.id]; return (
            <article key={r.id} className="card stack" style={{ gap: 12 }}>
              <div className="row between"><span className="cat-tag">Question {i + 1}</span>{r.correct ? <Pill kind="ok">Correct</Pill> : r.chosen === null ? <Pill kind="warn">Skipped</Pill> : <Pill kind="bad">Incorrect</Pill>}</div>
              <h3 style={{ fontSize: 24 }}>{q?.question}</h3>
              <div className="stack" style={{ gap: 8 }}>{q?.options.map((o, oi) => <div key={oi} className={`opt ${oi === r.correct_index ? 'right' : oi === r.chosen ? 'wrong' : ''}`} style={{ cursor: 'default' }}><span className="k">{String.fromCharCode(65 + oi)}</span><span>{o}{oi === r.chosen && ' · your answer'}{oi === r.correct_index && ' · correct'}</span></div>)}</div>
              <div className="notice"><Icon name="info" size={18} /><div>{r.explanation}</div></div>
              <div><SpeakButton text={`${q?.question}. ${r.explanation}`} lang={sl} synth={mentorApi.tts} label="Listen to explanation" /></div>
            </article>); })}
        </div>
      ) : (
        <div className="stack" style={{ gap: 22 }}>
          <div className="row between"><span className="muted">Question {cur + 1} of {qs.data.length} · {answered} answered</span><SpeakButton text={`${qs.data[cur].question}. ${qs.data[cur].options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('. ')}`} lang={sl} synth={mentorApi.tts} label="Read question" /></div>
          <div className="progress"><i style={{ width: `${((cur + 1) / qs.data.length) * 100}%` }} /></div>
          <h2 className="title-md">{qs.data[cur].question}</h2>
          <div className="stack" role="group" aria-label="Answer options">{qs.data[cur].options.map((o, oi) => (
            <button key={oi} className="opt" aria-pressed={answers[cur] === oi} onClick={() => setAnswers(answers.map((a, i) => i === cur ? oi : a))}><span className="k">{String.fromCharCode(65 + oi)}</span><span>{o}</span></button>))}</div>
          <div className="qdots" aria-label="Question navigation">{qs.data.map((_, i) => <button key={i} className={i === cur ? 'cur' : answers[i] !== null ? 'done' : ''} onClick={() => setCur(i)} aria-label={`Go to question ${i + 1}`} aria-current={i === cur}>{i + 1}</button>)}</div>
          {err && <ErrorNotice message={err} onRetry={submit} />}
          <div className="row between">
            <button className="btn btn-ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}><Icon name="back" size={16} />Previous</button>
            {cur < qs.data.length - 1 ? <button className="btn btn-primary" onClick={() => setCur(cur + 1)}>Next <Icon name="arrow" size={16} /></button>
              : <button className="btn btn-primary" onClick={submit} disabled={busy || answered === 0}>{busy ? <Spinner /> : null} Submit answers</button>}
          </div>
          {answered < qs.data.length && cur === qs.data.length - 1 && <p className="muted" style={{ fontSize: 13.5 }}>{qs.data.length - answered} question(s) unanswered — they will count as skipped.</p>}
        </div>
      )}
    </div>
  );
}

export default function MentorApp({ view, topic = '' }: { view: 'dashboard' | 'topic' | 'sim' | 'quiz'; topic?: string }) {
  return view === 'dashboard' ? <Dashboard /> : view === 'topic' ? <TopicPage id={topic} /> : view === 'sim' ? <Simulation topic={topic} /> : <Quiz topic={topic} />;
}
