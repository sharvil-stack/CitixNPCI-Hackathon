import { useI18n } from '../../i18n'

export const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function SchemeCard({ scheme: s, onOpen }) {
  const { t } = useI18n()
  return (
    <article className="sc-card">
      <div className="sc-meta"><span className="sc-chip">{s.category || '—'}</span><span className="sc-lvl">{s.level}</span></div>
      <h3>{s.name}</h3>
      <p className="sc-benefit">{s.benefit}</p>
      {s.cash ? <div className="sc-cash"><b>{rupees(s.cash)}</b> {t('k_year')}</div> : null}
      <ul className="sc-checks" aria-label={t(`st_${s.status}`)}>
        <li className="ok">{t('k_met', { n: s.passed.length })}</li>
        {s.failed.length > 0 && <li className="no">{t('k_not', { n: s.failed.length })}</li>}
        {s.unknown.length > 0 && <li className="un">{t('k_confirm', { n: s.unknown.length })}</li>}
      </ul>
      <button className="btn p" onClick={() => onOpen(s)} aria-label={`${t('s_view')}: ${s.name}`}>{t('s_view')}</button>
    </article>
  )
}
