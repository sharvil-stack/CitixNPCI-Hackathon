import { useLang } from '../context/LangContext';
import { Notice } from '../components/ui/Feedback';

export default function About() {
  const { t } = useLang();
  return (
    <div className="page wrap" style={{ maxWidth: 920 }}>
      <div className="page-head"><span className="eyebrow">{t('about.eyebrow')}</span><h1 className="display">{t('about.title')}</h1></div>
      <div className="stack" style={{ gap: 22 }}>
        <p className="lede">{t('about.p1')}</p><p className="lede">{t('about.p2')}</p>
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div className="card"><h3>What it is</h3><p className="muted">Four connected tools: SchemeSathi for government schemes, MoneyMentor for financial education, ScamShield AI for suspicious messages and CardWise for credit-card guidance. DRUNIX records consent-based referral receipts.</p></div>
          <div className="card"><h3>What it is not</h3><p className="muted">FINORA is not a bank, not a financial adviser and not a government portal. Results are guidance for learning and discovery — never an approval, a guarantee of eligibility or a promise that a message is safe.</p></div>
          <div className="card"><h3>Your data</h3><p className="muted">Never type OTPs, PINs, passwords, CVV, full card numbers, Aadhaar or PAN into any tool. CardWise blocks messages that look like they contain such data.</p></div>
          <div className="card"><h3>Languages</h3><p className="muted">The interface is available in English, Hindi and Marathi. Backend content depends on each service: CardWise supports all three, SchemeSathi and MoneyMentor English and Hindi, and ScamShield English.</p></div>
        </div>
        <Notice>FINORA is a prototype. Always confirm scheme details, card fees and eligibility with the official source before you act.</Notice>
      </div>
    </div>
  );
}
