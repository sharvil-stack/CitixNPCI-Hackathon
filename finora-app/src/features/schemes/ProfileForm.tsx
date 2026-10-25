import { useRef, useState } from 'react';
import { Icon } from '../../lib/icons';
import { Notice, Spinner } from '../../components/ui/Feedback';
import { useRecorder } from '../../hooks/useRecorder';
import { schemesApi, type ExtractedProfile, type Profile } from '../../services/schemes';
import { errMsg } from '../../services/http';

export const OCCUPATIONS: [string, string][] = [['farmer', 'Farmer'], ['farm_labourer', 'Farm labourer'], ['fisherman', 'Fisherman'], ['artisan', 'Artisan / craftsperson'], ['street_vendor', 'Street vendor'], ['construction_worker', 'Construction worker'], ['daily_wage_worker', 'Daily-wage worker'], ['self_employed', 'Self-employed / business'], ['student', 'Student'], ['homemaker', 'Homemaker'], ['salaried', 'Salaried'], ['unemployed', 'Unemployed']];
export const NEEDS: [string, string][] = [['bpl', 'Household has a BPL / poor-household card'], ['owns_land', 'Owns agricultural land'], ['disability', 'Person with a disability'], ['widow', 'Widow'], ['minority', 'Belongs to a minority community']];
// Monthly household income bands → income_low / income_high (rupees per month) as expected by POST /api/match.
export const BANDS: [string, string, number | null, number | null][] = [
  ['b1', 'Up to ₹5,000', 0, 5000], ['b2', '₹5,001 – ₹10,000', 5001, 10000], ['b3', '₹10,001 – ₹15,000', 10001, 15000], ['b4', '₹15,001 – ₹20,000', 15001, 20000],
  ['b5', '₹20,001 – ₹40,000', 20001, 40000], ['b6', '₹40,001 – ₹75,000', 40001, 75000], ['b7', 'Above ₹75,000', 75001, null],
];
export type FormState = { age: string; gender: string; state: string; area: string; occupation: string; caste: string; band: string; exact: string; needs: Record<string, string> };
export const emptyForm: FormState = { age: '', gender: '', state: 'Maharashtra', area: '', occupation: '', caste: '', band: '', exact: '', needs: {} };

export function toProfile(f: FormState): Profile {
  const p: Profile = { state: f.state || 'Maharashtra' };
  const age = parseInt(f.age, 10); if (!isNaN(age)) p.age = age;
  if (f.gender) p.gender = f.gender; if (f.area) p.area = f.area; if (f.occupation) p.occupation = f.occupation; if (f.caste) p.caste = f.caste;
  if (f.band === 'exact') { const n = parseInt(f.exact, 10); if (!isNaN(n)) { p.income_low = n; p.income_high = n; } }
  else { const b = BANDS.find((x) => x[0] === f.band); if (b) { p.income_low = b[2]; p.income_high = b[3]; } }
  const needs: Record<string, 'yes' | 'no'> = {};
  for (const [k] of NEEDS) if (f.needs[k] === 'yes' || f.needs[k] === 'no') needs[k] = f.needs[k] as 'yes' | 'no';
  if (Object.keys(needs).length) p.needs = needs;
  return p;
}
function mergeExtracted(f: FormState, e: ExtractedProfile): { next: FormState; filled: string[] } {
  const next = { ...f, needs: { ...f.needs } }; const filled: string[] = [];
  const set = (k: keyof FormState, v: any, label: string) => { if (v !== undefined && v !== null && v !== '') { (next as any)[k] = String(v); filled.push(label); } };
  set('age', e.age, 'age'); set('gender', e.gender, 'gender'); set('state', e.state, 'state'); set('area', e.area, 'area'); set('occupation', e.occupation, 'occupation'); set('caste', e.caste, 'category');
  if (typeof e.monthly_income === 'number') { next.band = 'exact'; next.exact = String(Math.round(e.monthly_income)); filled.push('income'); }
  for (const [k, v] of Object.entries(e.needs || {})) if (v === 'yes' || v === 'no') { next.needs[k] = v; filled.push(k.replace('_', ' ')); }
  return { next, filled };
}

const Seg = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) => (
  <div className="seg" role="group">{options.map(([k, l]) => <button type="button" key={k} aria-pressed={value === k} onClick={() => onChange(value === k ? '' : k)}>{l}</button>)}</div>
);

export function QuickFill({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const rec = useRecorder();
  const [busy, setBusy] = useState<'' | 'voice' | 'doc'>('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [transcript, setTranscript] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const apply = (e: ExtractedProfile) => {
    const { next, filled } = mergeExtracted(form, e); setForm(next);
    setMsg(filled.length ? { kind: 'ok', text: `Filled from what we read: ${filled.join(', ')}. Please check each answer below and correct anything that is wrong.` } : { kind: 'info', text: 'We could not find any details. Please fill in the form below.' });
  };
  const toggleVoice = async () => {
    setMsg(null);
    if (!rec.recording) { await rec.start(); return; }
    const blob = await rec.stop(); if (!blob) return setMsg({ kind: 'bad', text: 'No audio was captured. Please try again.' });
    setBusy('voice');
    try { const r = await schemesApi.extractVoice(blob, blob.type.includes('mp4') ? 'speech.mp4' : 'speech.webm'); setTranscript(r.transcript); apply(r.profile || {}); }
    catch (e) { setMsg({ kind: 'bad', text: errMsg(e) }); } finally { setBusy(''); }
  };
  const onFile = async (f?: File) => {
    if (!f) return; setMsg(null); setBusy('doc');
    try { const r = await schemesApi.extractDocument(f); apply(r.profile || {}); }
    catch (e) { setMsg({ kind: 'bad', text: errMsg(e) }); } finally { setBusy(''); if (file.current) file.current.value = ''; }
  };
  return (
    <div className="panel stack" style={{ gap: 18 }}>
      <div><h3 className="title-md" style={{ fontSize: 28 }}>Skip the typing (optional)</h3><p className="muted">Speak about yourself, or upload a photo of an ID document. We fill the form and you stay in control — everything remains editable.</p></div>
      <div className="grid g2">
        <div className="card stack" style={{ background: 'var(--surface-2)' }}>
          <div className="row"><span className="tool-icon"><Icon name="mic" /></span><b>Speak your details</b></div>
          <p className="muted" style={{ fontSize: 14 }}>Say your age, work, income, area and situation in English, Hindi or Marathi. Your recording is sent to the scheme service for speech-to-text.</p>
          <div><button type="button" className={`btn ${rec.recording ? 'btn-danger' : ''}`} onClick={toggleVoice} disabled={busy !== ''}>{busy === 'voice' ? <><Spinner /> Reading…</> : rec.recording ? <><Icon name="stop" size={16} /> Stop &amp; read</> : <><Icon name="mic" size={16} /> Start speaking</>}</button></div>
          {rec.recording && <p role="status" style={{ color: 'var(--danger)', fontSize: 14 }}>● Recording… tap stop when you are done.</p>}
          {rec.error && <Notice kind="warn">{rec.error}</Notice>}
          {transcript && <p className="muted" style={{ fontSize: 14 }}><b>We heard:</b> “{transcript}”</p>}
        </div>
        <div className="card stack" style={{ background: 'var(--surface-2)' }}>
          <div className="row"><span className="tool-icon"><Icon name="file" /></span><b>Read an ID document</b></div>
          <p className="muted" style={{ fontSize: 14 }}>Upload a clear photo. Text is read on the server and ID and phone numbers are masked before the text is analysed.</p>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload ID document image" />
          <div><button type="button" className="btn" onClick={() => file.current?.click()} disabled={busy !== ''}>{busy === 'doc' ? <><Spinner /> Reading…</> : <><Icon name="upload" size={16} /> Upload image</>}</button></div>
        </div>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </div>
  );
}

export function ProfileForm({ form, setForm, onSubmit, busy }: { form: FormState; setForm: (f: FormState) => void; onSubmit: () => void; busy: boolean }) {
  const [step, setStep] = useState(0);
  const up = (k: keyof FormState, v: string) => setForm({ ...form, [k]: v });
  const ageBad = form.age !== '' && (isNaN(+form.age) || +form.age < 0 || +form.age > 120);
  const steps = ['About you', 'Work & income', 'Your situation'];
  return (
    <form className="panel stack" style={{ gap: 22 }} onSubmit={(e) => { e.preventDefault(); if (step < 2) setStep(step + 1); else onSubmit(); }}>
      <div className="wizard-steps" aria-hidden="true">{steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      <div><span className="eyebrow muted">Step {step + 1} of 3</span><h3 className="title-md" style={{ marginTop: 8 }}>{steps[step]}</h3><p className="muted" style={{ fontSize: 14 }}>Every question is optional. Skipped answers appear as “we still need to know”, never as a mismatch.</p></div>

      {step === 0 && <div className="grid g2">
        <div className="field"><label htmlFor="age">Age</label><input id="age" className="input" inputMode="numeric" value={form.age} onChange={(e) => up('age', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="e.g. 34" aria-invalid={ageBad} />{ageBad && <span style={{ color: 'var(--danger)', fontSize: 13 }}>Enter an age between 0 and 120.</span>}</div>
        <div className="field"><span className="label">Gender</span><Seg value={form.gender} onChange={(v) => up('gender', v)} options={[['female', 'Female'], ['male', 'Male']]} /></div>
        <div className="field"><span className="label">State</span><Seg value={form.state} onChange={(v) => up('state', v || 'Maharashtra')} options={[['Maharashtra', 'Maharashtra'], ['Other', 'Other state']]} /><span className="muted" style={{ fontSize: 12.5 }}>The dataset covers central schemes and Maharashtra schemes. “Other state” shows central schemes only.</span></div>
        <div className="field"><span className="label">Where you live</span><Seg value={form.area} onChange={(v) => up('area', v)} options={[['rural', 'Rural'], ['urban', 'Urban']]} /></div>
      </div>}

      {step === 1 && <div className="grid g2">
        <div className="field"><label htmlFor="occ">Main occupation</label><select id="occ" className="select" value={form.occupation} onChange={(e) => up('occupation', e.target.value)}><option value="">Prefer not to say</option>{OCCUPATIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="field"><span className="label">Category</span><Seg value={form.caste} onChange={(v) => up('caste', v)} options={[['general', 'General'], ['obc', 'OBC'], ['sc', 'SC'], ['st', 'ST']]} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="inc">Monthly household income</label>
          <select id="inc" className="select" value={form.band} onChange={(e) => up('band', e.target.value)}><option value="">Prefer not to say</option>{BANDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}<option value="exact">Enter an exact amount</option></select></div>
        {form.band === 'exact' && <div className="field"><label htmlFor="ex">Exact monthly income (₹)</label><input id="ex" className="input" inputMode="numeric" value={form.exact} onChange={(e) => up('exact', e.target.value.replace(/\D/g, '').slice(0, 8))} /></div>}
      </div>}

      {step === 2 && <div className="stack">
        {NEEDS.map(([k, l]) => <div key={k} className="row between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <span style={{ flex: 1, minWidth: 220 }}>{l}</span>
          <Seg value={form.needs[k] || ''} onChange={(v) => setForm({ ...form, needs: { ...form.needs, [k]: v } })} options={[['yes', 'Yes'], ['no', 'No']]} />
        </div>)}
      </div>}

      <div className="row between">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><Icon name="back" size={16} />Back</button>
        <button type="submit" className="btn btn-primary" disabled={busy || ageBad}>{busy ? <><Spinner /> Matching…</> : step < 2 ? <>Next <Icon name="arrow" size={16} /></> : <>Find my schemes <Icon name="arrow" size={16} /></>}</button>
      </div>
    </form>
  );
}
