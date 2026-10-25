// Turns an ApiError into a translated, human-readable message.
export function errorText(t, e) {
  if (!e) return ''
  if (e.status === 0) return t('e_net')
  if (e.status === 422) return t('e_422')
  if (e.status === 501) return t('e_ocr')
  if (/groq|api[_ ]key/i.test(e.message || '')) return t('e_ai')
  return t('e_generic') + (e.message ? ` (${e.message})` : '')
}
