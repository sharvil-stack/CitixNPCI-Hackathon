import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DICT } from './data/dict'

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('fl') === 'hi' ? 'hi' : 'en' } catch { return 'en' } })
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem('fl', lang) } catch { /* storage unavailable */ } }, [lang])
  const t = useCallback((k, vars) => {
    let s = DICT[lang]?.[k] ?? DICT.en[k] ?? k
    if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v])
    return s
  }, [lang])
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useI18n = () => useContext(Ctx)
