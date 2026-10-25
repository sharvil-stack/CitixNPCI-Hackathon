import { useEffect, useState } from 'react';
import { Link, useRouter } from '../../lib/router';
import { Icon } from '../../lib/icons';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import type { Lang } from '../../lib/strings';

export function LangSwitch() {
  const { lang, setLang } = useLang();
  const opts: [Lang, string][] = [['en', 'EN'], ['hi', 'हिंदी'], ['mr', 'मराठी']];
  return (
    <div className="lang" role="group" aria-label="Language">
      {opts.map(([k, label]) => <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)} lang={k === 'en' ? 'en' : k}>{label}</button>)}
    </div>
  );
}

function AuthLinks({ stacked = false }: { stacked?: boolean }) {
  const { t } = useLang();
  const { user, ready, logout } = useAuth();
  if (!ready) return null;
  if (user) {
    return (
      <div className={`nav-auth ${stacked ? 'stacked' : ''}`}>
        <span className="nav-user" title={user.email}><Icon name="user" size={16} />{user.fullName.split(' ')[0]}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => logout()}>{t('auth.logout')}</button>
      </div>
    );
  }
  return (
    <div className={`nav-auth ${stacked ? 'stacked' : ''}`}>
      <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
      <Link to="/signup" className="btn btn-primary btn-sm">{t('nav.signup')}</Link>
    </div>
  );
}

export function Navbar() {
  const { t } = useLang();
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 8); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  const links = [['/', t('nav.home')], ['/features', t('nav.features')], ['/about', t('nav.about')], ['/help', t('nav.help')]];
const cur = (to: string): 'page' | undefined => (to === '/' ? path === '/' : path === to || (to === '/features' && /^\/(schemes|scamshield|learn|cards|referrals)/.test(path))) ? 'page' : undefined;  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-in">
        <Link to="/" className="logo" aria-label="FINORA home"><span className="logo-dot" />FINORA</Link>
        <nav className="nav-links" aria-label="Primary">{links.map(([to, label]) => <Link key={to} to={to} aria-current={cur(to)}>{label}</Link>)}</nav>
        <div className="nav-right">
          <LangSwitch />
          <span className="nav-auth-desktop"><AuthLinks /></span>
          <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'x' : 'menu'} /></button>
        </div>
      </div>
      <div className={`drawer ${open ? 'open' : ''}`}>
        {links.map(([to, label]) => <Link key={to} to={to} aria-current={cur(to)}>{label}</Link>)}
        <AuthLinks stacked />
        <LangSwitch />
      </div>
    </header>
  );
}
