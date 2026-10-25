import type { ReactNode } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { Reveal } from './Reveal';

// Feature-page hero: same dark panel language as the homepage hero, more compact.
export function MiniHero({ eyebrow, title, em, children, actions, icon }: { eyebrow: string; title: string; em?: string; children: ReactNode; actions?: ReactNode; icon?: string }) {
  return (
    <section className="hero-mini">
      <div className="hero-mini-in">
        <div className="row" style={{ gap: 14 }}>{icon && <span className="tool-icon"><Icon name={icon} /></span>}<span className="eyebrow">{eyebrow}</span></div>
        <h1 className="display" style={{ maxWidth: '16ch' }}>{title}{em && <> <em className="italic-sage">{em}</em></>}</h1>
        <p className="lede">{children}</p>
        {actions && <div className="btn-row" style={{ marginTop: 6 }}>{actions}</div>}
      </div>
    </section>
  );
}
export const Crumb = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to} className="crumb"><Icon name="back" size={16} />{children}</Link>;
export const Capability = ({ icon, title, children, delay = 0 }: { icon: string; title: string; children: ReactNode; delay?: number }) => (
  <Reveal delay={delay}><div className="card hover" style={{ height: '100%' }}><span className="tool-icon" style={{ marginBottom: 16 }}><Icon name={icon} /></span><h3>{title}</h3><p className="muted">{children}</p></div></Reveal>
);
export const LangNote = ({ show }: { show: boolean }) => show ? <p className="note-lang" role="status">This tool’s backend does not support the selected language, so content is shown in English.</p> : null;
