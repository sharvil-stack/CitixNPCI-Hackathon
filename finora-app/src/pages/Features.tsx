import { useLang } from '../context/LangContext';
import { FeatureCards } from './Home';
import { Link } from '../lib/router';
import { Icon } from '../lib/icons';

export default function Features() {
  const { t } = useLang();
  return (
    <div className="page wrap">
      <div className="page-head"><span className="eyebrow">{t('features.eyebrow')}</span><h1 className="display">{t('features.title')}</h1><p className="lede">{t('features.sub')}</p></div>
      <FeatureCards />
      <div className="panel" style={{ marginTop: 28 }}>
        <div className="row between" style={{ gap: 20 }}>
          <div className="row" style={{ gap: 16, flex: 1, minWidth: 260 }}><span className="tool-icon"><Icon name="link" /></span>
            <div><h3 style={{ fontSize: 26 }}>DRUNIX Referrals</h3><p className="muted">Create and manage a consent-based application-handoff receipt after you choose a credit card.</p></div></div>
          <Link to="/referrals" className="link-cta">Open DRUNIX <Icon name="arrow" size={18} /></Link>
        </div>
      </div>
    </div>
  );
}
