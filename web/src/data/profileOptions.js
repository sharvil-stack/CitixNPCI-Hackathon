// Allowed values mirror backend/ai.py (OCC, NEEDS) and the rule vocabulary in backend/engine.py.
export const OCCUPATIONS = ['farmer', 'farm_labourer', 'fisherman', 'artisan', 'street_vendor', 'construction_worker',
  'daily_wage_worker', 'self_employed', 'student', 'homemaker', 'salaried', 'unemployed']
export const NEEDS = ['disability', 'bpl', 'widow', 'owns_land', 'minority']
export const CASTES = ['general', 'obc', 'sc', 'st']
// Monthly household income bands -> income_low / income_high (rupees per month) expected by /api/match
export const INCOME_BANDS = [
  { id: 'b1', low: 0, high: 10000 }, { id: 'b2', low: 10001, high: 25000 },
  { id: 'b3', low: 25001, high: 50000 }, { id: 'b4', low: 50001, high: null },
]
export const EMPTY_FORM = { age: '', gender: '', state: 'Maharashtra', area: '', band: '', occupation: '', caste: '', needs: {} }

export function buildPayload(f) {
  const band = INCOME_BANDS.find((b) => b.id === f.band)
  const p = { state: f.state || 'Maharashtra' }
  if (f.age !== '' && !Number.isNaN(Number(f.age))) p.age = Math.round(Number(f.age))
  for (const k of ['gender', 'area', 'occupation', 'caste']) if (f[k]) p[k] = f[k]
  if (band) { p.income_low = band.low; if (band.high != null) p.income_high = band.high }
  const needs = Object.fromEntries(Object.entries(f.needs).filter(([, v]) => v === 'yes' || v === 'no'))
  if (Object.keys(needs).length) p.needs = needs
  return p
}

// Merge the profile returned by /api/extract/* into the form (only fields the backend was sure about).
export function mergeExtracted(form, x) {
  const n = { ...form, needs: { ...form.needs } }
  if (x.age != null) n.age = String(x.age)
  for (const k of ['gender', 'area', 'occupation', 'caste', 'state']) if (x[k]) n[k] = x[k]
  if (x.monthly_income != null) {
    const b = INCOME_BANDS.find((b) => x.monthly_income >= b.low && (b.high == null || x.monthly_income <= b.high))
    if (b) n.band = b.id
  }
  Object.entries(x.needs || {}).forEach(([k, v]) => { n.needs[k] = v })
  return n
}
