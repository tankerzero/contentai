'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type UILang = 'en' | 'fr' | 'ar'

const STORAGE_KEY = 'contentai_ui_lang'

interface UILangContextValue {
  lang: UILang
  setLang: (lang: UILang) => void
  isRTL: boolean
}

const UILangContext = createContext<UILangContextValue>({
  lang: 'fr',
  setLang: () => {},
  isRTL: false,
})

export function UILanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILang>('fr')
  const isRTL = lang === 'ar'

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UILang | null
    if (saved && ['en', 'fr', 'ar'].includes(saved)) setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.classList.toggle('font-arabic', isRTL)
  }, [lang, isRTL])

  function setLang(newLang: UILang) {
    setLangState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
  }

  return (
    <UILangContext.Provider value={{ lang, setLang, isRTL }}>
      {children}
    </UILangContext.Provider>
  )
}

export function useUILang() {
  return useContext(UILangContext)
}
