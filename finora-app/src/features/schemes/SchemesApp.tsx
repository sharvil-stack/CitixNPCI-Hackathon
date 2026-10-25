import { useMemo, useState } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';
import { useAsync } from '../../hooks/useAsync';
import { MiniHero, Crumb, Capability, LangNote } from '../../components/ui/MiniHero';
import { ErrorNotice, Loading, Empty, Notice, Skeletons } from '../../components/ui/Feedback';
import { Reveal } from '../../components/ui/Reveal';
import { schemesApi, type MatchResult, type Scheme } from '../../services/schemes';
import { errMsg } from '../../services/http';
import { SchemeCard } from './SchemeCard';
import { ProfileForm, QuickFill, emptyForm, toProfile, type FormState } from './ProfileForm';

const TABS = [['/schemes', 'Overview'], ['/schemes/browse', 'Browse schemes'], ['/schemes/match', 'Find my schemes']];
const Tabs = ({ active }: { active: string }) => <nav className="tabs" aria-label="SchemeSathi">{TABS.map(([to, l]) => <Link key={to} to={to} aria-current={to === active ? 'page' : undefined}>{l}</Link>)}</nav>;
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function Landing() {
  return (
    <>
      <MiniHero icon="landmark" eyebrow="GOVERNMENT SCHEMES" title="SchemeSathi" em="finds what you may qualify for."
        actions={<><Link to="/schemes/match" className="btn btn-primary">Find my schemes <Icon name="arrow" size={16} /></Link><Link to="/schemes/browse" className="btn">Browse all schemes</Link></>}>
        Tell us a little about yourself — by typing, speaking or uploading an ID — and see central and Maharashtra schemes ranked by how well they fit, with the reasons shown and the documents you will need.
      </MiniHero>
      <div className="wrap" style={{ padding: '56px 24px 24px' }}>
        <div className="grid g3">
          <Capability icon="user" title="Guided profile">A three-step form where every question is optional and unanswered ones are never counted against you.</Capability>
          <Capability icon="mic" title="Voice &amp; documents" delay={80}>Speak in English, Hindi or Marathi, or upload an ID photo. Review and correct what we read before matching.</Capability>
          <Capability icon="check" title="Clear reasons" delay={160}>Each scheme shows what matches, what doesn’t, and what we still need to know.</Capability>
          <Capability icon="file" title="Documents &amp; steps" delay={0}>Required documents, conditions and application steps for every scheme.</Capability>
          <Capability icon="volume" title="Plain-language audio" delay={80}>A short spoken explanation in English or Hindi, generated only from the scheme facts.</Capability>
          <Capability icon="shield" title="Honest by design" delay={160}>Results are guidance, not an official eligibility decision. Always confirm on the official scheme page.</Capability>
        </div>
      </div>
    </>
  );
}

function Browse() {
  const { lang } = useLang();
  const [state, setState] = useState('Maharashtra');
  // The scheme service has no catalogue endpoint; matching an empty profile returns every scheme with its criteria listed as “unknown”.
  const all = useAsync(() => schemesApi.match({ state }), [state]);
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [level, setLevel] = useState('All');
  const list: Scheme[] = useMemo(() => all.data ? [...all.data.eligible, ...all.data.almost, ...all.data.need_info] : [], [all.data]);
  const cats = useMemo(() => ['All', ...Array.from(new Set(list.map((s) => s.category))).sort()], [list]);
  const shown = list.filter((s) => (cat === 'All' || s.category === cat) && (level === 'All' || s.level === level) && (!q.trim() || (s.name + ' ' + s.benefit + ' ' + s.category).toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <div className="wrap page">
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">SCHEMESATHI</span><h1 className="display">Browse schemes</h1><p className="lede">Every scheme in the dataset, with its eligibility criteria. To see which ones fit you, use “Find my schemes”.</p></div>
      <Tabs active="/schemes/browse" />
      <LangNote show={lang === 'mr'} />
      <div className="card stack" style={{ marginBottom: 24 }}>
        <div className="grid g3">
          <div className="field"><label htmlFor="q">Search</label><input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. pension, farmer, women" /></div>
          <div className="field"><label htmlFor="cat">Category</label><select id="cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="lv">Level</label><select id="lv" className="select" value={level} onChange={(e) => setLevel(e.target.value)}><option>All</option><option>Central</option><option>Maharashtra</option></select></div>
        </div>
        <div className="seg" role="group" aria-label="State"><button aria-pressed={state === 'Maharashtra'} onClick={() => setState('Maharashtra')}>Central + Maharashtra</button><button aria-pressed={state === 'Other'} onClick={() => setState('Other')}>Central only</button></div>
      </div>
      {all.loading ? <Skeletons /> : all.error ? <ErrorNotice message={all.error} onRetry={all.reload} /> : shown.length === 0 ? <Empty title="No schemes match your search">Try a different word or clear the filters.</Empty> : (
        <><p className="muted" style={{ marginBottom: 14 }} role="status">{shown.length} scheme{shown.length === 1 ? '' : 's'}</p><div className="grid g2">{shown.map((s) => <SchemeCard key={s.id} s={s} mode="browse" />)}</div></>
      )}
    </div>
  );
}

type TabKey = 'eligible' | 'almost' | 'need_info';
function Match() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [res, setRes] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [tab, setTab] = useState<TabKey>('eligible');
  const run = async () => {
    setBusy(true); setErr('');
    try { const r = await schemesApi.match(toProfile(form)); setRes(r); setTab(r.eligible.length ? 'eligible' : r.almost.length ? 'almost' : 'need_info'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const tabs: [TabKey, string][] = [['eligible', 'Likely eligible'], ['almost', 'Almost eligible'], ['need_info', 'Need more information']];
  return (
    <div className="wrap page">
      <Crumb to="/features">All features</Crumb>
      <div className="page-head"><span className="eyebrow">SCHEMESATHI</span><h1 className="display">{res ? 'Your matches' : 'Find my schemes'}</h1>
        <p className="lede">{res ? 'Based on the answers you gave. Edit them any time and match again.' : 'Answer what you are comfortable with. The more you tell us, the sharper the matches.'}</p></div>
      <Tabs active="/schemes/match" />
      <Notice kind="warn">Matching follows the rules in the scheme dataset. It is guidance only, not an official eligibility decision. Confirm on the scheme’s official page before applying.</Notice>
      <div style={{ height: 24 }} />
      {err && <div style={{ marginBottom: 20 }}><ErrorNotice message={err} onRetry={run} /></div>}
      {!res ? (
        <div className="stack" style={{ gap: 24 }}><QuickFill form={form} setForm={setForm} /><ProfileForm form={form} setForm={setForm} onSubmit={run} busy={busy} /></div>
      ) : (
        <div className="stack" style={{ gap: 26 }}>
          <div className="grid g3">
            <div className="stat"><b>{res.eligible.length}</b><span>likely eligible</span></div>
            <div className="stat"><b>{res.almost.length}</b><span>almost eligible</span></div>
            <div className="stat"><b>{res.cash_total ? inr(res.cash_total) : '—'}</b><span>listed yearly cash value across likely-eligible schemes (indicative only)</span></div>
          </div>
          <div className="row between"><div className="tabs" role="tablist" style={{ margin: 0, border: 0 }}>{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l} ({res[k].length})</button>)}</div>
            <button className="btn btn-sm" onClick={() => setRes(null)}><Icon name="back" size={15} />Edit my answers</button></div>
          {res[tab].length === 0 ? <Empty title="Nothing in this group">{tab === 'eligible' ? 'No scheme is a clear match yet. Check “Need more information” — answering more questions can change this.' : 'Try another group.'}</Empty>
            : <div className="grid g2">{res[tab].map((s) => <Reveal key={s.id}><SchemeCard s={s} mode="result" /></Reveal>)}</div>}
        </div>
      )}
      {busy && !res && <Loading label="Matching schemes…" />}
    </div>
  );
}

export default function SchemesApp({ view }: { view: 'landing' | 'browse' | 'match' }) {
  return view === 'landing' ? <div className="page" style={{ paddingTop: 8 }}><Landing /></div> : view === 'browse' ? <Browse /> : <Match />;
}
