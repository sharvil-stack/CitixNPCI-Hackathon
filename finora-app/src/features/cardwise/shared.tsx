import { useEffect, useRef, useState } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { Pill } from '../../components/ui/Feedback';
import type { Card, CardProfile, Rec } from '../../services/cardwise';

export const CARD_TABS: [string, string][] = [['/cards', 'Overview'], ['/cards/browse', 'Catalogue'], ['/cards/recommend', 'Find a card'], ['/cards/assistant', 'Assistant'], ['/cards/learn', 'Learn']];
export const CardTabs = ({ active }: { active: string }) => <nav className="tabs" aria-label="CardWise">{CARD_TABS.map(([to, l]) => <Link key={to} to={to} aria-current={to === active ? 'page' : undefined}>{l}</Link>)}</nav>;
export const catLabel = (c?: string) => (c || 'other').replace(/_/g, ' ');
export const inr = (n: number | null | undefined) => (n === null || n === undefined ? '—' : '₹' + Math.round(n).toLocaleString('en-IN'));

// Profile lives in memory for the session only (not persisted): it can contain income and spending.
let saved: CardProfile = {};
export const profileStore = { get: () => saved, set: (p: CardProfile) => { saved = p; } };

export function DataStatus({ c }: { c: Pick<Card, 'data_status' | 'verified_on'> }) {
  const bad = /re-?verif|unverified|needs/i.test(c.data_status || '');
  return <Pill kind={bad ? 'warn' : ''}>{bad ? 'Needs re-verification' : 'Sample data'} · checked {c.verified_on || 'n/a'}</Pill>;
}

export function CardTile({ c }: { c: Card | Rec }) {
  return (
    <article className="card hover stack" style={{ gap: 14, height: '100%' }}>
      <div className="row between"><span className="cat-tag">{catLabel(c.category)}</span>{c.fd_backed && <Pill>FD-backed</Pill>}</div>
      <div><h3 style={{ marginBottom: 2 }}>{c.name}</h3><span className="muted" style={{ fontSize: 14 }}>{c.issuer}</span></div>
      <div className="row" style={{ gap: 22 }}>
        <div><div className="label">Annual fee</div><b>{c.annual_fee === 0 ? '₹0' : inr(c.annual_fee)}</b></div>
        {c.fee_waiver_spend ? <div><div className="label">Fee waiver spend</div><b>{inr(c.fee_waiver_spend)}</b></div> : null}
        {c.fd_backed && c.minimum_fd ? <div><div className="label">Minimum FD</div><b>{inr(c.minimum_fd)}</b></div> : null}
      </div>
      {c.benefits?.[0] && <p className="muted" style={{ fontSize: 14.5 }}>{c.benefits[0]}</p>}
      <div style={{ marginTop: 'auto' }}><Link to={`/cards/${c.id}`} className="link-cta">View details <Icon name="arrow" size={16} /></Link></div>
    </article>
  );
}

// Browser speech-to-text (Web Speech API) where available; used to dictate into a text field.
export function useDictation(lang: string, onText: (t: string) => void) {
  const [on, setOn] = useState(false); const r = useRef<any>(null);
  const Ctor = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const supported = !!Ctor;
  useEffect(() => () => r.current?.stop?.(), []);
  const toggle = () => {
    if (!Ctor) return;
    if (on) { r.current?.stop(); return; }
    const rec = new Ctor(); rec.lang = ({ en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' } as any)[lang] || 'en-IN'; rec.interimResults = false;
    rec.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(' '));
    rec.onend = () => setOn(false); rec.onerror = () => setOn(false);
    r.current = rec; rec.start(); setOn(true);
  };
  return { on, supported, toggle };
}
