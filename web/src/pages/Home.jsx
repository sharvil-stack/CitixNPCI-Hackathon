import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

const FEATS = [
  { n: 'Yojana Saathi', k: ['Government Schemes', 'सरकारी योजनाएँ'], d: 'Discover government schemes, understand eligibility, and explore benefits you may qualify for.', c: 'Explore Schemes', to: '/schemes', p: 'M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18', v: ['Eligibility', 'Benefits', 'Documents', 'How to apply'] },
  { n: 'Paisa Pathshala', k: ['Financial Education', 'पैसों की पढ़ाई'], d: 'Build essential money skills through simple lessons and interactive quizzes.', c: 'Start Learning', p: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5', v: ['Simple lessons', 'Quizzes', 'Hindi + English', 'Self-paced'] },
  { n: 'Scam Suraksha', k: ['Scam Detection', 'ठगी से बचाव'], d: 'Check suspicious messages and understand the warning signs before you respond.', c: 'Check a Message', p: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM9 12l2 2 4-4', v: ['Urgency', 'Unknown links', 'OTP requests', 'Threats'] },
  { n: 'Card Samajh', k: ['Credit Card Guidance', 'क्रेडिट कार्ड की समझ'], d: 'Understand fees, interest, rewards, and responsible credit-card usage.', c: 'Explore Cards', p: 'M2 8a3 3 0 013-3h14a3 3 0 013 3v8a3 3 0 01-3 3H5a3 3 0 01-3-3zM2 10h20M6 15h4', v: ['Fees', 'Interest', 'Rewards', 'Billing dates'] },
]
const STEPS = [['01', 'Discover', 'Find useful financial information and government scheme opportunities.'], ['02', 'Learn', 'Build financial knowledge through simple explanations and interactive quizzes.'], ['03', 'Decide with Confidence', 'Use what you learn to make more informed financial choices and recognize potential scams.']]
const PRIN = ['Accessible financial education', 'Easier discovery of financial opportunities', 'Greater awareness of potential scams', 'More informed financial decisions']

function Dash() {
  const rows = (a) => a.map((x) => <div className="row" key={x}><span>{x}</span><span>Learn</span></div>)
  return (
    <div className="dash" aria-label="Illustrative product preview">
      <div className="dh"><span>finora / home</span><span>Sample preview</span></div>
      <div className="dg">
        <div className="pn"><small>Paisa Pathshala</small><b>Learning path</b>
          <svg width="76" height="76" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#252B27" strokeWidth="3" /><circle className="ring" cx="18" cy="18" r="15" fill="none" stroke="#B9D3BE" strokeWidth="3" strokeDasharray="57 94" strokeLinecap="round" transform="rotate(-90 18 18)" /></svg>
          <div className="row"><span>Budgeting basics</span><span>Done</span></div><div className="row"><span>Quiz: Interest</span><span>Next</span></div></div>
        <div className="pn"><small>Yojana Saathi</small><b>Schemes to explore</b><div className="row"><span>Sample scheme A</span><span>Check</span></div><div className="row"><span>Sample scheme B</span><span>Check</span></div><div className="bar"><i style={{ width: '60%' }}></i></div>Eligibility · Benefits · Documents</div>
        <div className="pn"><small>Scam Suraksha</small><b>Message check</b><div className="msg">“Your account is blocked. Click this link now to verify…”</div><span className="tag">Urgency</span><span className="tag">Unknown link</span><div className="row" style={{ marginTop: 10 }}><span>Possible risk</span><span>Elevated</span></div></div>
        <div className="pn"><small>Card Samajh</small><b>Card basics</b>{rows(['Annual fee', 'Interest rate', 'Rewards', 'Paying on time'])}</div>
      </div>
    </div>
  )
}

export default function Home() {
  const { lang, t } = useI18n()
  return (
    <main id="top">
      <div className="w" style={{ padding: '0 12px' }}>
        <div className="hero">
          <div className="eb">{t('eb')}</div>
          <h1>{t('h1a')}<br /><em>{t('h1b')}</em></h1>
          <p className="sub">{t('sub')}</p>
          <div className="cta"><a className="btn p" href="#features">{t('c1')}</a><Link className="btn g" to="/schemes">{t('c2')}</Link></div>
          <Dash /><div className="note">Illustrative sample content only.</div>
        </div>
      </div>
      <section id="features"><div className="w"><h2>{t('fh')}</h2><p className="lead">{t('fs')}</p>
        <div className="fg">{FEATS.map((f, i) => (
          <article className="fc" key={f.n}>
            <div className="top"><div className="ic"><svg viewBox="0 0 24 24"><path d={f.p} /></svg></div><span className="num">0{i + 1}</span></div>
            <div className="kind">{f.k[0]}<em>{f.k[1]}</em></div><h3>{f.n}</h3><p>{f.d}</p>
            <div className="vis">{f.v.map((x) => <span key={x}>{x}</span>)}</div>
            {f.to ? <Link className="l" to={f.to}>{f.c} <span>→</span></Link> : <a className="l" href="#">{f.c} <span>→</span></a>}
          </article>))}</div></div></section>
      <section><div className="w"><h2>{t('hw')}</h2><div className="st" style={{ marginTop: 44 }}>{STEPS.map((s) => <div className="s" key={s[0]}><div className="n">{s[0]}</div><h3>{s[1]}</h3><p>{s[2]}</p></div>)}</div></div></section>
      <section id="mission"><div className="w pr"><div><h2>{t('mh')}</h2><p className="lead" style={{ margin: 0 }}>FINORA exists to make money matters clearer and less intimidating — whatever your starting point.</p></div><div className="pl">{PRIN.map((p) => <div key={p}>{p}</div>)}</div></div></section>
      <section id="help"><div className="w"><div className="fin"><h2>{t('fin')}</h2><p>Start with a lesson, explore a scheme, or check a message — at your own pace.</p><div className="cta"><Link className="btn p" to="/schemes">{t('c2')}</Link></div></div>
        <footer><span>© FINORA</span><span>{t('disclaimer')}</span></footer></div></section>
    </main>
  )
}
