import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';

// Shared pieces for the Login and Signup pages.
export function AuthLayout({ eyebrow, title, em, sub, children }: { eyebrow: string; title: string; em: string; sub: string; children: ReactNode }) {
  const { t } = useLang();
  return (
    <div className="wrap page auth">
      <aside className="auth-side">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display">{title} <em className="italic-sage">{em}</em></h1>
        <p className="lede">{sub}</p>
        <ul className="clean auth-perks">
          {['auth.perk1', 'auth.perk2', 'auth.perk3'].map((k) => <li key={k}><span className="tool-icon"><Icon name="check" size={18} /></span>{t(k)}</li>)}
        </ul>
      </aside>
      <section className="card auth-card">{children}</section>
    </div>
  );
}

type FieldProps = { id: string; label: string; error?: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;
export function TextField({ id, label, error, hint, ...rest }: FieldProps) {
  const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={`input ${error ? 'invalid' : ''}`} aria-invalid={!!error} aria-describedby={desc} {...rest} />
      {error ? <p id={`${id}-err`} className="field-err" role="alert">{error}</p> : hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function PasswordField({ id, label, error, hint, ...rest }: FieldProps) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} className={`input ${error ? 'invalid' : ''}`} type={show ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={desc} {...rest} />
        <button type="button" className="pw-toggle" aria-pressed={show} onClick={() => setShow(!show)}>{show ? t('auth.hide') : t('auth.show')}</button>
      </div>
      {error ? <p id={`${id}-err`} className="field-err" role="alert">{error}</p> : hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export const AuthSwitch = ({ text, to, label }: { text: string; to: string; label: string }) => (
  <p className="auth-switch muted">{text} <Link to={to} className="auth-link">{label}</Link></p>
);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Mirrors RegisterRequest on the server: 8-72 chars, at least one letter and one digit.
export const validPassword = (p: string) => p.length >= 8 && new TextEncoder().encode(p).length <= 72 && /[A-Za-z]/.test(p) && /\d/.test(p);

/** Only same-site paths are allowed as a post-login destination (blocks open redirects like //evil.com). */
export function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/';
}
