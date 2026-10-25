import { useEffect, useState } from 'react';
import { Link, useSearchParams } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useAsync } from '../../hooks/useAsync';
import { MiniHero, Crumb } from '../../components/ui/MiniHero';
import { ErrorNotice, Loading, Notice, Pill, Spinner } from '../../components/ui/Feedback';
import { cardApi } from '../../services/cardwise';
import { drunixApi, TRANSITIONS, type HistoryResp, type Referral } from '../../services/drunix';
import { errMsg } from '../../services/http';

const RECENT_KEY = 'finora.drunix.recent'; // referral IDs only (random, pseudonymous) — never tokens
const loadRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
const saveRecent = (ids: string[]) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 6))); } catch { /* storage unavailable */ } };
const statusKind = (s: string): '' | 'ok' | 'warn' | 'bad' => s === 'COMPLETED' ? 'ok' : s === 'REJECTED' || s === 'CONSENT_REVOKED' ? 'bad' : s === 'ACTION_REQUIRED' ? 'warn' : '';
const nice = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const FIELDS: [string, string][] = [['referral_id', 'Referral ID'], ['card_name', 'Card'], ['card_id', 'Card ID'], ['issuer_code', 'Issuer'], ['consent_scope', 'Consent scope'], ['mode', 'Ledger mode'], ['transaction_id', 'Transaction ID'], ['transaction_ref', 'Transaction ref'], ['commit_status', 'Commit status'], ['created_at', 'Created'], ['updated_at', 'Updated']];

function StatusBanner() {
  const st = useAsync(() => drunixApi.status(), []);
  if (st.loading) return <Loading label="Checking ledger gateway…" />;
  if (st.error) return <ErrorNotice message={st.error} onRetry={st.reload} />;
  const s = st.data!;
  return (
    <div className={`notice ${s.ready ? (s.is_live ? 'ok' : 'warn') : 'bad'}`} role="status"><Icon name={s.ready ? 'check' : 'alert'} size={18} />
      <div className="stack" style={{ gap: 6 }}><div className="row"><b>{s.label || s.mode}</b>{s.is_live ? <Pill kind="ok">Live ledger</Pill> : <Pill kind="warn">Simulation — not a blockchain</Pill>}{!s.ready && <Pill kind="bad">Not ready</Pill>}</div>{s.notice && <span>{s.notice}</span>}</div></div>
  );
}

function History({ h }: { h: HistoryResp }) {
  const rows = Array.isArray(h.history) ? h.history : [];
  return (
    <div className="card stack"><h3>History</h3>
      {h.notice && <p className="muted" style={{ fontSize: 13.5 }}>{h.notice}</p>}
      {rows.length === 0 ? <p className="muted">No events recorded.</p> : (
        <ol className="num">{rows.map((e, i) => {
          const status = e.status || e.Status || e.event_type || e.eventType || 'Event';
          const meta = [e.actor || e.Actor, e.occurred_at || e.timestamp || e.Timestamp, e.transaction_ref || e.tx_id || e.txId || e.TxId].filter(Boolean).join(' · ');
          return <li key={i}><b>{nice(String(status))}</b>{e.event_type && e.status && e.event_type !== e.status && <span className="muted"> · {nice(e.event_type)}</span>}{meta && <div className="muted" style={{ fontSize: 13.5, wordBreak: 'break-all' }}>{meta}</div>}</li>;
        })}</ol>)}
    </div>
  );
}

function Receipt({ r, setR }: { r: Referral; setR: (r: Referral) => void }) {
  const [hist, setHist] = useState<HistoryResp | null>(null);
  const [busy, setBusy] = useState(''); const [msg, setMsg] = useState<{ k: 'ok' | 'bad'; t: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [token, setToken] = useState(''); // held in memory only; never stored
  const revoked = r.status === 'CONSENT_REVOKED';
  useEffect(() => { setHist(null); setMsg(null); setConfirm(false); }, [r.referral_id]);

  const act = (name: string, fn: () => Promise<void>, ok: string) => async () => {
    setBusy(name); setMsg(null);
    try { await fn(); setMsg({ k: 'ok', t: ok }); } catch (e) { setMsg({ k: 'bad', t: errMsg(e) }); } finally { setBusy(''); }
  };
  const merge = (x: Referral) => setR({ ...r, ...x, referral_id: r.referral_id });
  const next = TRANSITIONS[r.status] || [];
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card stack" style={{ gap: 16 }}>
        <div className="row between"><h3 style={{ marginBottom: 0 }}>Referral receipt</h3><Pill kind={statusKind(r.status)}>{nice(r.status)}</Pill></div>
        {r.ledger_verified === true ? <Notice kind="ok">Committed to the ledger and read back (commit status {r.commit_status || 'VALID'}).</Notice>
          : (r.mode || '').includes('demo') ? <Notice kind="warn">Local simulation — stored in SQLite on the server. This is not a blockchain transaction.</Notice> : null}
        {r.application_submitted === false && <Notice>This is a workflow receipt only. It does not submit an application to the card issuer.</Notice>}
        <dl className="kv">{FIELDS.filter(([k]) => r[k] !== undefined && r[k] !== null && typeof r[k] !== 'object').flatMap(([k, l]) => [<dt key={k + 'l'}>{l}</dt>, <dd key={k}>{String(r[k])}</dd>])}</dl>
        <div className="btn-row">
          <button className="btn btn-sm" disabled={!!busy} onClick={act('refresh', async () => merge(await drunixApi.get(r.referral_id)), 'Refreshed.')}>{busy === 'refresh' ? <Spinner /> : <Icon name="refresh" size={14} />}Refresh</button>
          <button className="btn btn-sm" disabled={!!busy} onClick={act('hist', async () => setHist(await drunixApi.history(r.referral_id)), 'History loaded.')}>{busy === 'hist' ? <Spinner /> : <Icon name="clock" size={14} />}Show history</button>
          {!revoked && !confirm && <button className="btn btn-sm btn-danger" onClick={() => setConfirm(true)}>Revoke consent</button>}
        </div>
        {confirm && !revoked && (
          <div className="notice warn" style={{ flexDirection: 'column' }}><span><b>Revoke consent?</b> This adds a revocation event. Earlier events already recorded cannot be erased.</span>
            <div className="btn-row"><button className="btn btn-sm btn-danger" disabled={!!busy} onClick={act('revoke', async () => { merge(await drunixApi.revoke(r.referral_id)); setConfirm(false); }, 'Consent revoked. A new event was added; earlier events remain in the record.')}>{busy === 'revoke' ? <Spinner /> : null}Yes, revoke</button><button className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button></div></div>
        )}
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      </div>
      {hist && <History h={hist} />}
      <details className="card">
        <summary style={{ cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 22 }}>Issuer actions (authorised issuers only)</summary>
        <div className="stack" style={{ marginTop: 14 }}>
          <p className="muted" style={{ fontSize: 14 }}>Simulates the card issuer progressing this referral. In live DRUNIX mode the server requires the issuer console token from its .env and a separate Org2 gateway; in simulation any value works. The token is kept in memory only and is never stored.</p>
          <div className="field"><label htmlFor="tok">Issuer console token</label><input id="tok" className="input" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Only needed in live mode" /></div>
          {revoked ? <Notice kind="warn">Consent has been revoked; issuer updates are no longer allowed.</Notice> : next.length === 0 ? <Notice>No further issuer transitions are available from “{nice(r.status)}”.</Notice> : (
            <div className="btn-row">{next.map((s) => <button key={s} className="btn btn-sm" disabled={!!busy} onClick={act('iss-' + s, async () => merge(await drunixApi.issuerUpdate(r.referral_id, s, token || undefined)), `Status updated to ${nice(s)}.`)}>{busy === 'iss-' + s ? <Spinner /> : null}Mark {nice(s)}</button>)}</div>)}
        </div>
      </details>
    </div>
  );
}

export default function DrunixApp() {
  const q = useSearchParams();
  const cards = useAsync(() => cardApi.cards('en'), []);
  const [cardId, setCardId] = useState(q.get('card') || ''); const [consent, setConsent] = useState(false);
  const [rec, setRec] = useState<Referral | null>(null); const [creating, setCreating] = useState(false); const [err, setErr] = useState('');
  const [lookup, setLookup] = useState(''); const [looking, setLooking] = useState(false);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const remember = (id: string) => { const n = [id, ...recent.filter((x) => x !== id)]; setRecent(n); saveRecent(n); };

  const create = async () => {
    if (!cardId) return setErr('Choose a card first.');
    if (!consent) return setErr('Please tick the consent box to continue.');
    setCreating(true); setErr('');
    try { const r = await drunixApi.create(cardId, true); setRec(r); remember(r.referral_id); setConsent(false); } catch (e) { setErr(errMsg(e)); } finally { setCreating(false); }
  };
  const open = async (id: string) => {
    const v = id.trim(); if (!v) return;
    if (!/^[A-Za-z0-9_-]{3,100}$/.test(v)) return setErr('That does not look like a valid referral ID.');
    setLooking(true); setErr('');
    try { const r = await drunixApi.get(v); setRec(r); remember(r.referral_id || v); } catch (e) { setErr(errMsg(e)); } finally { setLooking(false); }
  };
  return (
    <div className="page" style={{ paddingTop: 8 }}>
      <MiniHero icon="link" eyebrow="DRUNIX · CONSENT & REFERRALS" title="Referral receipts" em="you control.">
        After you choose a card, create a consent-based application-handoff receipt. It records only a random reference, the card, the issuer and your consent — no name, income, ID or card number — and you can revoke consent at any time.
      </MiniHero>
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Crumb to="/cards">CardWise</Crumb>
        <StatusBanner />
        {err && <div style={{ marginTop: 16 }}><ErrorNotice message={err} /></div>}
        <div className="split" style={{ alignItems: 'start', marginTop: 28 }}>
          <div className="stack" style={{ gap: 20 }}>
            <div className="panel stack" style={{ gap: 18 }}>
              <h2 className="title-md">Create a receipt</h2>
              <div className="field"><label htmlFor="card">Card</label>
                {cards.loading ? <Loading /> : cards.error ? <ErrorNotice message={cards.error} onRetry={cards.reload} /> : (
                  <select id="card" className="select" value={cardId} onChange={(e) => setCardId(e.target.value)}><option value="">Select a card…</option>{cards.data!.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.issuer}</option>)}</select>)}
                <span className="muted" style={{ fontSize: 12.5 }}>Not sure which card? <Link to="/cards/recommend" className="italic-sage">Find one in CardWise</Link>.</span></div>
              <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I agree to record a pseudonymous application-handoff receipt for this card. This is not a bank application, nothing is sent to the issuer, and I can revoke consent later.</span></label>
              <div><button className="btn btn-primary" onClick={create} disabled={creating}>{creating ? <><Spinner /> Creating…</> : <>Create receipt <Icon name="arrow" size={16} /></>}</button></div>
            </div>
            <div className="card stack">
              <h3>Open an existing receipt</h3>
              <div className="row" style={{ flexWrap: 'nowrap' }}><input className="input" value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="ref-…" aria-label="Referral ID" onKeyDown={(e) => e.key === 'Enter' && open(lookup)} /><button className="btn" onClick={() => open(lookup)} disabled={looking || !lookup.trim()}>{looking ? <Spinner /> : 'Open'}</button></div>
              {recent.length > 0 && <div><div className="label" style={{ marginBottom: 8 }}>Recent on this device</div><div className="chips">{recent.map((id) => <button key={id} className="chip" onClick={() => open(id)}>{id.slice(0, 16)}…</button>)}</div></div>}
            </div>
          </div>
          <div>{rec ? <Receipt r={rec} setR={setRec} /> : <div className="empty"><Icon name="file" size={28} /><h3>No receipt open</h3><p>Create a receipt, or open a recent one.</p></div>}</div>
        </div>
      </div>
    </div>
  );
}
