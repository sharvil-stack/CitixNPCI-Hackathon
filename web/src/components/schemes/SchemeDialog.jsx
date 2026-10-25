import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { audioUrl, explainScheme } from '../../services/schemeService'
import { errorText } from './errors'
import { rupees } from './SchemeCard'

function Block({ title, children }) { return <section className="sc-block"><h3>{title}</h3>{children}</section> }
function List({ items, ordered, na }) {
  if (!items?.length) return <p className="sc-na">{na}</p>
  const L = ordered ? 'ol' : 'ul'
  return <L>{items.map((x, i) => <li key={i}>{x}</li>)}</L>
}

export default function SchemeDialog({ scheme: s, onClose }) {
  const { t, lang } = useI18n()
  const ref = useRef(null)
  const [ex, setEx] = useState({ status: 'idle' })

  useEffect(() => {
    const d = ref.current
    if (s && !d.open) d.showModal()
    if (!s && d.open) d.close()
    setEx({ status: 'idle' })
  }, [s])
  useEffect(() => setEx({ status: 'idle' }), [lang])

  const ctl = useRef(null)
  async function explain() {
    ctl.current?.abort(); ctl.current = new AbortController()
    setEx({ status: 'loading' })
    try { setEx({ status: 'ok', ...(await explainScheme(s, lang, ctl.current.signal)) }) }
    catch (e) { if (e.name !== 'AbortError') setEx({ status: 'err', msg: errorText(t, e) }) }
  }
  useEffect(() => () => ctl.current?.abort(), [])

  return (
    <dialog ref={ref} className="sc-dialog" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }} aria-labelledby="sc-d-title">
      {s && (
        <div className="sc-d-body">
          <header>
            <div><span className="sc-chip">{s.category}</span> <span className="sc-lvl">{s.level}</span> <span className={'sc-status ' + s.status}>{t('st_' + s.status)}</span></div>
            <button className="sc-x" onClick={onClose} aria-label={t('d_close')}>✕</button>
          </header>
          <h2 id="sc-d-title">{s.name}</h2>
          <p className="sc-hint">{t('d_en_note')}</p>

          <Block title={t('d_benefit')}><p>{s.benefit || <span className="sc-na">{t('d_na')}</span>}{s.cash ? <> <b>({rupees(s.cash)} {t('k_year')})</b></> : null}</p></Block>

          <Block title={t('d_match')}>
            <div className="sc-match">
              {s.passed.length > 0 && <div><h4>{t('d_met')}</h4><ul className="ok">{s.passed.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {s.failed.length > 0 && <div><h4>{t('d_notmet')}</h4><ul className="no">{s.failed.map((x) => <li key={x.text}>{x.text}{x.hint && <small>{x.hint}</small>}</li>)}</ul></div>}
              {s.unknown.length > 0 && <div><h4>{t('d_confirm')}</h4><ul className="un">{s.unknown.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {!s.passed.length && !s.failed.length && !s.unknown.length && <p className="sc-na">{t('d_na')}</p>}
            </div>
          </Block>
          <Block title={t('d_cond')}><List items={s.other_conditions} na={t('d_na')} /></Block>
          <Block title={t('d_docs')}><List items={s.documents} na={t('d_na')} /></Block>
          <Block title={t('d_steps')}><List ordered items={s.steps} na={t('d_na')} /></Block>
          {s.url ? <p><a className="btn p" href={s.url} target="_blank" rel="noopener noreferrer">{t('d_link')} ↗</a></p> : <p className="sc-na">{t('d_link')}: {t('d_na')}</p>}

          <div className="sc-explain">
            <button className="btn g" onClick={explain} disabled={ex.status === 'loading'}>{ex.status === 'loading' ? t('d_explaining') : t('d_explain')}</button>
            <div role="status" aria-live="polite">
              {ex.status === 'err' && <p className="sc-note err">{ex.msg}</p>}
              {ex.status === 'ok' && <>
                <p>{ex.text}</p>
                {ex.audio_url && <audio controls src={audioUrl(ex.audio_url)} aria-label={t('d_listen')} />}
                <p className="sc-hint">{t('d_ai')}</p></>}
            </div>
          </div>
          <p className="sc-hint">{t('d_verify')}</p>
        </div>)}
    </dialog>
  )
}
