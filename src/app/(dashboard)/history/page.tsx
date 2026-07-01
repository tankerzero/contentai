'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import HistoryList from '@/components/HistoryList'
import type { Generation } from '@/components/HistoryCard'
import { useUILang } from '@/contexts/UILanguageContext'

const UI = {
  en: {
    title: 'History',
    subtitle: (n: number) => `${n} generation${n !== 1 ? 's' : ''} — click to expand`,
    loading: 'Loading history…',
  },
  fr: {
    title: 'Historique',
    subtitle: (n: number) => `${n} génération${n !== 1 ? 's' : ''} — cliquez pour développer`,
    loading: 'Chargement…',
  },
  ar: {
    title: 'السجل',
    subtitle: (n: number) => `${n} توليد — انقر للتوسيع`,
    loading: 'جارٍ التحميل…',
  },
  es: {
    title: 'Historial',
    subtitle: (n: number) => `${n} generación${n !== 1 ? 'es' : ''} — clic para expandir`,
    loading: 'Cargando historial…',
  },
  zh: {
    title: '历史记录',
    subtitle: (n: number) => `${n} 条生成记录 — 点击展开`,
    loading: '加载中…',
  },
}

export default function HistoryPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('generations')
        .select('id, content_type, topic, tone, language, content, is_favorite, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          setGenerations((data ?? []).map(g => ({ ...g, is_favorite: g.is_favorite ?? false })))
          setLoading(false)
        })
    })
  }, [])

  if (loading) {
    return (
      <div className={`p-8 flex items-center gap-3 text-gray-400 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        {ui.loading}
      </div>
    )
  }

  return (
    <div className={`p-8 max-w-4xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{ui.subtitle(generations.length)}</p>
      <HistoryList generations={generations} />
    </div>
  )
}
