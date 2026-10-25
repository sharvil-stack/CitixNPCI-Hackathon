import { useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { CASTES, EMPTY_FORM, INCOME_BANDS, NEEDS, OCCUPATIONS, mergeExtracted } from '../../data/profileOptions'
import { extractFromDocument, extractFromVoice } from '../../services/schemeService'
import { errorText } from './errors'

function Select({ id, label, value, onChange, options }) {
  const { t } = useI18n()
  return (
    <div className="sc-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('s_select')}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function Seg({ name, label, value, onChange, options }) {
  return (
    <fieldset className="sc-field sc-seg">
      <legend>{label}</legend>
      <div>{options.map(([v, l]) => (
        <label key={v} className={value === v ? 'on' : ''}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />{l}
        </label>))}
      </div>
    </fieldset>
  )
}

export default function ProfileForm({ form, setForm, onSubmit, busy }) {
  const { t } = useI18n()
  const [recording, setRecording] = useState(false)
  const [reading, setReading] = useState(false)
  const [note, setNote] = useState(null)
  const rec = useRef(null)
  const chunks = useRef([])
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const setNeed = (k) => (v) => setForm((f) => ({ ...f, needs: { ...f.needs, [k]: v } }))

  async function extract(fn, srcKey) {
    setReading(true); setNote(null)
    try {
      const r = await fn()
      setForm((f) => mergeExtracted(f, r.profile || {}))
      setNote({ ok: t('s_filled', { src: t(srcKey) }) })
    } catch (e) { setNote({ err: errorText(t, e) }) } finally { setReading(false) }
  }

  async function toggleVoice() {
    if (recording) { rec.current?.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = (e) => chunks.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop()); setRecording(false)
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' })
        extract(() => extractFromVoice(blob), 'src_voice')
      }
      rec.current = mr; mr.start(); setRecording(true)
    } catch { setNote({ err: t('e_mic') }) }
  }

  const yn = [['yes', t('s_yes')], ['no', t('s_no')]]
  return (
    <form className="sc-form" onSubmit={(e) => { e.preventDefault(); onSubmit() }} aria-labelledby="sc-form-h">
      <div className="sc-form-head">
        <div><h2 id="sc-form-h">{t('s_form_h')}</h2><p>{t('s_form_sub')}</p></div>
        <div className="sc-assist">
          <button type="button" className={'btn g' + (recording ? ' rec' : '')} onClick={toggleVoice} disabled={reading} aria-pressed={recording}>
            {recording ? '■ ' + t('s_voice_stop') : '🎙 ' + t('s_voice')}
          </button>
          <label className={'btn g' + (reading ? ' dis' : '')}>
            {reading ? t('s_busy') : '📄 ' + t('s_scan')}
            <input type="file" accept="image/*" hidden disabled={reading} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) extract(() => extractFromDocument(f), 'src_doc') }} />
          </label>
        </div>
      </div>
      <p className="sc-hint">{t('s_privacy')}</p>
      <div role="status" aria-live="polite">{note && <p className={note.err ? 'sc-note err' : 'sc-note'}>{note.err || note.ok}</p>}</div>

      <div className="sc-grid">
        <div className="sc-field"><label htmlFor="sc-age">{t('s_age')}</label>
          <input id="sc-age" type="number" inputMode="numeric" min="0" max="120" value={form.age} onChange={(e) => set('age')(e.target.value)} /></div>
        <Select id="sc-state" label={t('s_state')} value={form.state} onChange={set('state')} options={[['Maharashtra', t('s_mh')], ['Other', t('s_other')]]} />
        <Select id="sc-occ" label={t('s_occ')} value={form.occupation} onChange={set('occupation')} options={OCCUPATIONS.map((o) => [o, t('o_' + o)])} />
        <Select id="sc-inc" label={t('s_income')} value={form.band} onChange={set('band')} options={INCOME_BANDS.map((b) => [b.id, t(b.id)])} />
        <Select id="sc-caste" label={t('s_caste')} value={form.caste} onChange={set('caste')} options={CASTES.map((c) => [c, t('c_' + c)])} />
        <Seg name="gender" label={t('s_gender')} value={form.gender} onChange={set('gender')} options={[['female', t('s_female')], ['male', t('s_male')]]} />
        <Seg name="area" label={t('s_area')} value={form.area} onChange={set('area')} options={[['rural', t('s_rural')], ['urban', t('s_urban')]]} />
      </div>

      <h3 className="sc-sub">{t('s_needs')}</h3>
      <div className="sc-needs">{NEEDS.map((n) => (
        <Seg key={n} name={'need-' + n} label={t('n_' + n)} value={form.needs[n] || ''} onChange={setNeed(n)} options={[...yn, ['unsure', t('s_unsure')]]} />))}
      </div>

      <div className="sc-actions">
        <button className="btn p" type="submit" disabled={busy}>{busy ? t('s_loading') : t('s_find')}</button>
        <button className="btn g" type="button" onClick={() => setForm(EMPTY_FORM)}>{t('s_reset')}</button>
      </div>
    </form>
  )
}
