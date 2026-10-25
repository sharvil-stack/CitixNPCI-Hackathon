import { Link } from '../../lib/router';
import { useLang } from '../../context/LangContext';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="stack">
            <Link to="/" className="logo" style={{ fontSize: 24 }}><span className="logo-dot" />FINORA</Link>
            <p className="serif muted" style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic' }}>{t('footer.tag')}</p>
          </div>
          <div><h4>{t('footer.tools')}</h4><ul>
            <li><Link to="/schemes">SchemeSathi</Link></li><li><Link to="/learn">MoneyMentor</Link></li>
            <li><Link to="/scamshield">ScamShield AI</Link></li><li><Link to="/cards">CardWise</Link></li><li><Link to="/referrals">DRUNIX Referrals</Link></li>
          </ul></div>
          <div><h4>{t('footer.info')}</h4><ul>
            <li><Link to="/about">{t('nav.about')}</Link></li><li><Link to="/help">{t('nav.help')}</Link></li><li><Link to="/features">{t('nav.features')}</Link></li>
          </ul></div>
        </div>
        <p className="fine">{t('footer.note')}</p>
      </div>
    </footer>
  );
}
