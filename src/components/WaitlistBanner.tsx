'use client'

import { useEffect, useState } from 'react'
import type { UILang } from '@/contexts/UILanguageContext'

const T: Record<UILang, { text: string; cta: string }> = {
  en: { text: '🚀 ContentAI is launching very soon —', cta: 'join the waitlist to be first in line.' },
  fr: { text: '🚀 ContentAI arrive très bientôt —', cta: 'rejoignez la liste d\'attente pour être parmi les premiers.' },
  ar: { text: '🚀 ContentAI قريباً جداً —', cta: 'انضم إلى قائمة الانتظار لتكون من أوائل المستخدمين.' },
  es: { text: '🚀 ContentAI llega muy pronto —', cta: 'únete a la lista de espera para ser el primero.' },
  zh: { text: '🚀 ContentAI 即将发布 —', cta: '加入候补名单，率先体验。' },
}

interface Props {
  lang: UILang
  isRTL: boolean
  onJoin: () => void
}

export default function WaitlistBanner({ lang, isRTL, onJoin }: Props) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const d = localStorage.getItem('waitlist_banner_dismissed') === '1'
    if (!d) setDismissed(false)
  }, [])

  function dismiss() {
    localStorage.setItem('waitlist_banner_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const ui = T[lang] ?? T.en

  return (
    <div
      className={`relative flex items-center justify-center gap-2 px-10 py-2.5 text-sm font-semibold bg-brand-600 text-white ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <span>{ui.text}</span>
      <button
        onClick={onJoin}
        className="underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        {ui.cta}
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0 text-base leading-none"
      >
        ×
      </button>
    </div>
  )
}
