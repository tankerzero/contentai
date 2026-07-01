'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export type UILang = 'en' | 'fr' | 'ar' | 'es' | 'zh'

const STORAGE_KEY = 'contentai_ui_lang'

interface UILangContextValue {
  lang: UILang
  setLang: (lang: UILang) => void
  isRTL: boolean
}

const UILangContext = createContext<UILangContextValue>({
  lang: 'en',
  setLang: () => {},
  isRTL: false,
})

export function UILanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILang>('en')
  const isRTL = lang === 'ar'

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UILang | null
    if (saved && ['en', 'fr', 'ar', 'es', 'zh'].includes(saved)) setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.classList.toggle('font-arabic', isRTL)
  }, [lang, isRTL])

  // Stable reference — prevents context consumers from re-rendering when
  // UILanguageProvider re-renders for reasons unrelated to lang/isRTL.
  const setLang = useCallback((newLang: UILang) => {
    setLangState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
  }, [])

  // Memoised value object — consumers only re-render when lang or isRTL actually changes.
  const value = useMemo<UILangContextValue>(
    () => ({ lang, setLang, isRTL }),
    [lang, setLang, isRTL],
  )

  return (
    <UILangContext.Provider value={value}>
      {children}
    </UILangContext.Provider>
  )
}

export function useUILang() {
  return useContext(UILangContext)
}
