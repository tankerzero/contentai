'use client'

import { useState } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

export interface Generation {
  id: string
  content_type: string
  topic: string
  tone: string
  language: string
  content: string
  is_favorite: boolean
  created_at: string
}

const TYPE_LABELS = {
  en: { blog_post: 'Article', social_media: 'Social', email: 'Email', product_description: 'Product', ad_copy: 'Ad' },
  fr: { blog_post: 'Article', social_media: 'Social', email: 'Email', product_description: 'Produit', ad_copy: 'Pub' },
  ar: { blog_post: 'مقال', social_media: 'اجتماعي', email: 'بريد', product_description: 'منتج', ad_copy: 'إعلان' },
}

const LANG_FLAGS: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦' }

const UI = {
  en: { copy: 'Copy', copied: '✓', addFav: 'Add to favorites', removeFav: 'Remove from favorites' },
  fr: { copy: 'Copier', copied: '✓', addFav: 'Ajouter aux favoris', removeFav: 'Retirer des favoris' },
  ar: { copy: 'نسخ', copied: '✓', addFav: 'إضافة للمفضلة', removeFav: 'إزالة من المفضلة' },
}

export default function HistoryCard({ generation }: { generation: Generation }) {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]
  const typeLabels = TYPE_LABELS[lang]

  const [isFavorite, setIsFavorite] = useState(generation.is_favorite ?? false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isArabicContent = generation.language === 'ar'

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !isFavorite
    setIsFavorite(next)
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generation.id, is_favorite: next }),
    })
  }

  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(generation.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const preview = generation.content.slice(0, 120) + (generation.content.length > 120 ? '…' : '')

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full shrink-0">
            {typeLabels[generation.content_type as keyof typeof typeLabels] ?? generation.content_type}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {LANG_FLAGS[generation.language] ?? ''}
          </span>
          <span
            className={`text-sm text-gray-700 truncate ${isArabicContent ? 'font-arabic' : ''}`}
            dir={isArabicContent ? 'rtl' : 'ltr'}
          >
            {generation.topic}
          </span>
        </div>
        <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date(generation.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
          <button
            onClick={copy}
            className="text-xs text-gray-400 hover:text-brand-600 transition-colors font-medium"
          >
            {copied ? ui.copied : ui.copy}
          </button>
          <button
            onClick={toggleFavorite}
            className={`text-lg leading-none transition-colors ${
              isFavorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'
            }`}
            title={isFavorite ? ui.removeFav : ui.addFav}
          >
            ★
          </button>
        </div>
      </div>

      {/* Preview or full content */}
      {!expanded ? (
        <div className="px-5 pb-4">
          <p
            className={`text-xs text-gray-400 leading-relaxed ${isArabicContent ? 'font-arabic text-right' : ''}`}
            dir={isArabicContent ? 'rtl' : 'ltr'}
          >
            {preview}
          </p>
        </div>
      ) : (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          <pre
            className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed ${isArabicContent ? 'font-arabic text-right' : 'font-sans'}`}
            dir={isArabicContent ? 'rtl' : 'ltr'}
          >
            {generation.content}
          </pre>
        </div>
      )}
    </div>
  )
}
