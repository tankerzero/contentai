'use client'

import { useState } from 'react'
import HistoryCard, { type Generation } from './HistoryCard'
import { useUILang } from '@/contexts/UILanguageContext'

const UI = {
  en: {
    all: (n: number) => `All (${n})`,
    favs: (n: number) => `★ Favorites (${n})`,
    emptyFavs: 'No favorites yet.',
    emptyAll: 'No generations yet.',
  },
  fr: {
    all: (n: number) => `Tout (${n})`,
    favs: (n: number) => `★ Favoris (${n})`,
    emptyFavs: 'Aucun favori pour le moment.',
    emptyAll: 'Aucune génération pour le moment.',
  },
  ar: {
    all: (n: number) => `الكل (${n})`,
    favs: (n: number) => `★ المفضلة (${n})`,
    emptyFavs: 'لا توجد مفضلات بعد.',
    emptyAll: 'لا توجد توليدات بعد.',
  },
}

export default function HistoryList({ generations }: { generations: Generation[] }) {
  const { lang, isRTL } = useUILang()
  const uiLang: 'en' | 'fr' | 'ar' = (lang === 'es' || lang === 'zh') ? 'en' : lang
  const ui = UI[uiLang]
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  const visible = filter === 'favorites'
    ? generations.filter(g => g.is_favorite)
    : generations

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Filter tabs */}
      <div className={`flex gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {(['all', 'favorites'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'all'
              ? ui.all(generations.length)
              : ui.favs(generations.filter(g => g.is_favorite).length)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {filter === 'favorites' ? ui.emptyFavs : ui.emptyAll}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(g => (
            <HistoryCard key={g.id} generation={g} />
          ))}
        </div>
      )}
    </div>
  )
}
