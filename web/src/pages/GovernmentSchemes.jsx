import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { EMPTY_FORM, buildPayload } from '../data/profileOptions'
import { useSchemeMatch } from '../hooks/useSchemeMatch'
import ProfileForm from '../components/schemes/ProfileForm'
import SchemeCard, { rupees } from '../components/schemes/SchemeCard'
import SchemeDialog from '../components/schemes/SchemeDialog'
import { errorText } from '../components/schemes/errors'

const TABS = [['eligible', 't_eligible'], ['almost', 't_almost'], ['need_info', 't_need']]

export default function GovernmentSchemes() {
  const { t } = useI18n()
  const [form, setForm] = useState(EMPTY_FORM)
  const [tab, setTab] = useState('eligible')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(null)
  const { status, data, error, run, retry } = useSchemeMatch()
  const head = useRef(null)

  useEffect(() => { document.title = `${t('s_title')} · FINORA` }, [t])
  useEffect(() => {
    if (status !== 'success') return
    setTab((cur) => (data[cur]?.length ? cur : (TABS.find(([k]) => data[k]?.length)?.[0] || 'eligible')))
    head.current?.focus()
  }, [status, data])

  const items = data?.[tab] || []
  const cats = useMemo(() => [...new Set(items.map((s) => s.category).filter(Boolean))].sort(), [items])
  useEffect(() => { if (cat !== 'all' && !cats.includes(cat)) setCat('all') }, [cats, cat])
  const shown = cat === 'all' ? items : items.filter((s) => s.category === cat)
  const total = data ? TABS.reduce((n, [k]) => n + data[k].length, 0) : 0

  return (
    <main className="sc-page">
      <div className="w">
        <nav className="sc-crumbs" aria-label="Breadcrumb"><Link to="/">FINORA</Link><span aria-hidden="true">/</span><span aria-current="page">{t('s_crumb')}</span></nav>
        <header className="sc-hero"><h1>{t('s_title')}</h1><p>{t('s_sub')}</p></header>
        <ProfileForm form={form} setForm={setForm} busy={status === 'loading'} onSubmit={() => run(buildPayload(form))} />

        <section className="sc-results" aria-labelledby="sc-res-h" aria-busy={status === 'loading'}>
          {status !== 'idle' && <h2 id="sc-res-h" tabIndex={-1} ref={head}>{t('s_results')}</h2>}
          {status === 'loading' && <div role="status"><span className="sr">{t('s_loading')}</span><div className="sc-list">{[0, 1, 2].map((i) => <div key={i} className="sc-card sk" aria-hidden="true" />)}</div></div>}
          {status === 'error' && <div className="sc-error" role="alert"><p>{errorText(t, error)}</p><button className="btn p" onClick={retry}>{t('e_retry')}</button></div>}
          {status === 'success' && <>
            {data.cash_total > 0 && <div className="sc-total"><b>{t('s_cash', { n: rupees(data.cash_total).slice(1) })}</b><small>{t('s_cash_note')}</small></div>}
            <div className="sc-tabs" role="tablist">{TABS.map(([k, l]) => (
              <button key={k} role="tab" id={'tab-' + k} aria-selected={tab === k} aria-controls="sc-panel" className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setCat('all') }}>{t(l)} <span>{data[k].length}</span></button>))}</div>
            <div id="sc-panel" role="tabpanel" aria-labelledby={'tab-' + tab}>
              {cats.length > 1 && <div className="sc-cats" role="group" aria-label={t('s_category')}>
                {['all', ...cats].map((c) => <button key={c} aria-pressed={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c === 'all' ? t('s_all') : c}</button>)}</div>}
              {shown.length ? <><p className="sc-count">{t('s_count', { n: shown.length })}</p><div className="sc-list">{shown.map((s) => <SchemeCard key={s.id} scheme={s} onOpen={setOpen} />)}</div></>
                : <div className="sc-empty"><h3>{t('s_none_h')}</h3><p>{t('s_none_p')}</p></div>}
            </div>
            {total === 0 && <p className="sc-hint">{t('s_none_p')}</p>}
          </>}
        </section>
        <p className="sc-hint sc-disc">{t('disclaimer')}</p>
      </div>
      <SchemeDialog scheme={open} onClose={() => setOpen(null)} />
    </main>
  )
}
