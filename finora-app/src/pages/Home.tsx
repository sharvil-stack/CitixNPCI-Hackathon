import { Link } from '../lib/router';
import { Icon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { Reveal } from '../components/ui/Reveal';

export const FEATURES = [
  { n: '01', k: 'f1', icon: 'landmark', to: '/schemes', title: 'SchemeSathi' },
  { n: '02', k: 'f2', icon: 'cap', to: '/learn', title: 'MoneyMentor' },
  { n: '03', k: 'f3', icon: 'shield', to: '/scamshield/check', title: 'ScamShield AI' },
  { n: '04', k: 'f4', icon: 'card', to: '/cards', title: 'CardWise' },
];

export function FeatureCards() {
  const { t } = useLang();
  return (
    <div className="fgrid">
      {FEATURES.map((f, i) => (
        <Reveal key={f.k} delay={i * 80}>
          <article className="fcard" style={{ height: '100%' }}>
            <div className="fcard-top">
              <div className="cat">{t(f.k + '.cat')}<small>{t(f.k + '.sub')}</small></div>
              <span className="num">{f.n}</span>
            </div>
            <span className="ficon"><Icon name={f.icon} size={26} /></span>
            <h3>{f.title}</h3>
            <p>{t(f.k + '.desc')}</p>
            <Link to={f.to} className="link-cta stretch">{t(f.k + '.cta')} <Icon name="arrow" size={18} /></Link>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useLang();
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-in">
          <span className="eyebrow">{t('hero.eyebrow')}</span>
          <h1 id="hero-title">{t('hero.line1')}<span className="l2">{t('hero.line2')}</span></h1>
          <p className="sub">{t('hero.sub')}</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Link to="/features" className="btn btn-primary">{t('hero.cta1')}</Link>
            <Link to="/learn" className="btn">{t('hero.cta2')}</Link>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head"><span className="eyebrow muted">{t('features.eyebrow')}</span><h2 className="title-lg">{t('features.title')}</h2><p className="lede">{t('features.sub')}</p></div>
          <FeatureCards />
        </div>
      </section>

      <hr className="divider" />
      <section className="section">
        <div className="wrap">
          <Reveal><div className="section-head"><span className="eyebrow muted">{t('how.eyebrow')}</span><h2 className="title-lg">{t('how.title')}</h2></div></Reveal>
          <Reveal><div className="steps">
            {[1, 2, 3].map((n) => <div className="step" key={n}><div className="n">0{n}</div><h3>{t(`how.${n}.t`)}</h3><p>{t(`how.${n}.d`)}</p></div>)}
          </div></Reveal>
        </div>
      </section>

      <hr className="divider" />
      <section className="section">
        <div className="wrap split">
          <Reveal><div className="stack" style={{ gap: 22 }}><span className="eyebrow muted">{t('about.eyebrow')}</span><h2 className="title-lg">{t('about.title')}</h2></div></Reveal>
          <Reveal delay={100}><div className="stack" style={{ gap: 18 }}><p className="lede">{t('about.p1')}</p><p className="lede">{t('about.p2')}</p><div><Link to="/about" className="link-cta">{t('nav.about')} <Icon name="arrow" size={18} /></Link></div></div></Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <Reveal><div className="panel panel-sage stack" style={{ gap: 20 }}>
            <span className="tool-icon"><Icon name="shield" /></span>
            <span className="eyebrow">{t('safety.eyebrow')}</span><h2 className="title-md">{t('safety.title')}</h2><p className="muted">{t('safety.p')}</p>
            <div><Link to="/scamshield/check" className="btn btn-primary">{t('safety.cta')}</Link></div>
          </div></Reveal>
          <Reveal delay={120}><div className="panel stack" style={{ gap: 20 }}>
            <span className="tool-icon"><Icon name="cap" /></span>
            <span className="eyebrow">{t('learn.eyebrow')}</span><h2 className="title-md">{t('learn.title')}</h2><p className="muted">{t('learn.p')}</p>
            <ul className="clean dots"><li>Saving &amp; budgeting simulation</li><li>UPI safety scenario</li><li>Banking basics scenario</li><li>Quizzes with explanations</li></ul>
            <div><Link to="/learn" className="btn">{t('learn.cta')}</Link></div>
          </div></Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap"><Reveal><div className="cta-band">
          <h2 className="display" style={{ maxWidth: '14ch' }}>{t('final.title')}</h2><p className="lede">{t('final.p')}</p>
          <Link to="/features" className="btn btn-primary">{t('final.cta')}</Link>
        </div></Reveal></div>
      </section>
    </>
  );
}
