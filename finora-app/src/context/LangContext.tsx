import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { STRINGS, type Lang } from '../lib/strings';

type L = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const Ctx = createContext<L>({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { const v = localStorage.getItem('finora.lang'); return v === 'hi' || v === 'mr' ? v : 'en'; } catch { return 'en'; }
  });
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('finora.lang', l); } catch { /* storage unavailable */ } };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // Falls back to English for any key not translated into the selected language.
  const t = (k: string) => STRINGS[lang]?.[k] ?? STRINGS.en[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
