import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function Nav() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const links = [['home', '/'], ['feat', '/#features'], ['about', '/#mission'], ['help', '/#help']]
  return (
    <nav aria-label="Main">
      <div className="w nv">
        <Link className="logo" to="/"><i></i>FINORA</Link>
        <div className="lk">{links.map(([k, h]) => <a key={k} href={h}>{t(k)}</a>)}</div>
        <div className="ac">
          <div className="seg" role="group" aria-label="Language">
            <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            <button aria-pressed={lang === 'hi'} onClick={() => setLang('hi')}>हिन्दी</button>
          </div>
          <a className="btn g" href="#">{t('login')}</a><a className="btn p" href="#">{t('signup')}</a>
          <button className="mb" aria-label={t('menu')} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        </div>
      </div>
      <div className={'mp' + (open ? ' o' : '')} onClick={() => setOpen(false)}>
        {links.map(([k, h]) => <a key={k} href={h}>{t(k)}</a>)}
        <a href="#">{t('login')}</a><a href="#">{t('signup')}</a>
      </div>
    </nav>
  )
}
