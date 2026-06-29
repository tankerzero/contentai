'use client'

import { useEffect, useState } from 'react'
import type { OutputLanguage } from '@/lib/anthropic'
import type { PlannerDay } from '@/app/api/planner/route'
import { useUILang } from '@/contexts/UILanguageContext'

const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter / X', 'Facebook', 'TikTok']

const TONES = {
  fr: ['Professionnel', 'Décontracté', 'Amical', 'Inspirant', 'Humoristique'],
  ar: ['احترافي', 'غير رسمي', 'ودّي', 'ملهِم', 'فكاهي'],
  en: ['Professional', 'Casual', 'Friendly', 'Inspirational', 'Humorous'],
}

const LANGUAGES: { value: OutputLanguage; label: string; flag: string }[] = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'en', label: 'English',  flag: '🇬🇧' },
]

const UI = {
  en: {
    title: 'Weekly Planner',
    subtitle: 'Generate 7 posts for the whole week in one click.',
    langLabel: 'Output language', platformLabel: 'Platform',
    topicLabel: 'Weekly theme / topic',
    topicPlaceholder: 'e.g. Launch of our new spring collection',
    topicPlaceholderAr: 'e.g. Eid al-Adha promotions',
    toneLabel: 'Tone', brandToggle: 'Apply brand voice',
    generateBtn: '📅 Generate week', generating: 'Generating week…',
    generated: 'Generated week —', copyAll: 'Copy all', copiedAll: '✓ All copied!',
    copyDay: 'Copy', copiedDay: '✓', dayError: 'Generation error',
  },
  fr: {
    title: 'Planificateur hebdomadaire',
    subtitle: 'Générez 7 posts pour toute la semaine en un seul clic.',
    langLabel: 'Langue de sortie', platformLabel: 'Plateforme',
    topicLabel: 'Thème / sujet de la semaine',
    topicPlaceholder: 'ex. Lancement de notre nouvelle collection printemps',
    topicPlaceholderAr: 'مثال: الخروف والعيد',
    toneLabel: 'Ton', brandToggle: 'Utiliser mon ton de marque',
    generateBtn: '📅 Générer la semaine', generating: 'Génération de la semaine…',
    generated: 'Semaine générée —', copyAll: 'Tout copier', copiedAll: '✓ Tout copié !',
    copyDay: 'Copier', copiedDay: '✓', dayError: 'Erreur de génération',
  },
  ar: {
    title: 'المخطط الأسبوعي',
    subtitle: 'أنشئ 7 منشورات لكامل الأسبوع بنقرة واحدة.',
    langLabel: 'لغة المخرجات', platformLabel: 'المنصة',
    topicLabel: 'موضوع الأسبوع',
    topicPlaceholder: 'مثال: إطلاق مجموعتنا الربيعية الجديدة',
    topicPlaceholderAr: 'مثال: عروض عيد الأضحى',
    toneLabel: 'الأسلوب', brandToggle: 'استخدام صوت العلامة التجارية',
    generateBtn: '📅 توليد الأسبوع', generating: 'جارٍ توليد الأسبوع…',
    generated: 'أسبوع مولَّد —', copyAll: 'نسخ الكل', copiedAll: '✓ تم النسخ!',
    copyDay: 'نسخ', copiedDay: '✓', dayError: 'خطأ في التوليد',
  },
}

export default function PlannerPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [platform, setPlatform] = useState('Instagram')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('')
  const [language, setLanguage] = useState<OutputLanguage>('fr')
  const [useBrandVoice, setUseBrandVoice] = useState(false)
  const [hasBrand, setHasBrand] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [week, setWeek] = useState<PlannerDay[] | null>(null)
  const [copiedDay, setCopiedDay] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const outputIsRTL = language === 'ar'
  const tones = TONES[language]

  useEffect(() => {
    fetch('/api/brand').then(r => r.json()).then(({ profile }) => setHasBrand(!!profile))
  }, [])

  function handleLangChange(lang: OutputLanguage) {
    setLanguage(lang)
    setTone('')
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setWeek(null)
    setLoading(true)

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, language, platform, useBrandVoice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation error')
      setWeek(data.week)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function copyDay(day: PlannerDay) {
    if (!day.content) return
    await navigator.clipboard.writeText(day.content)
    setCopiedDay(day.key)
    setTimeout(() => setCopiedDay(null), 2000)
  }

  async function copyAll() {
    if (!week) return
    const all = week
      .filter(d => d.content)
      .map(d => `--- ${d.label} ---\n${d.content}`)
      .join('\n\n')
    await navigator.clipboard.writeText(all)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className={`p-8 max-w-6xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{ui.subtitle}</p>

      {/* Config form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{ui.langLabel}</label>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => handleLangChange(l.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      language === l.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    } ${l.value === 'ar' ? 'font-arabic' : ''}`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{ui.platformLabel}</label>
              <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      platform === p
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ui.topicLabel}
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required
              dir={outputIsRTL ? 'rtl' : 'ltr'}
              className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${outputIsRTL ? 'font-arabic text-right' : ''}`}
              placeholder={outputIsRTL ? ui.topicPlaceholderAr : ui.topicPlaceholder}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{ui.toneLabel}</label>
            <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {tones.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tone === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${outputIsRTL ? 'font-arabic' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Brand voice */}
          {hasBrand && (
            <label className={`flex items-center gap-3 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div
                onClick={() => setUseBrandVoice(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 ${useBrandVoice ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform shadow-sm ${useBrandVoice ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700 font-medium">{ui.brandToggle}</span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim() || !tone}
            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {ui.generating}
              </>
            ) : ui.generateBtn}
          </button>
        </form>
      </div>

      {/* Calendar skeleton during load */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-50 rounded" />
                <div className="h-3 bg-gray-50 rounded" />
                <div className="h-3 bg-gray-50 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar result */}
      {week && (
        <div>
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-900">
              {ui.generated} {platform}
            </h2>
            <button
              onClick={copyAll}
              className="text-sm text-brand-600 font-medium hover:text-brand-700 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
            >
              {copiedAll ? ui.copiedAll : ui.copyAll}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {week.map(day => (
              <div
                key={day.key}
                className={`bg-white rounded-xl border flex flex-col ${
                  day.error ? 'border-red-100' : 'border-gray-100'
                }`}
              >
                <div className={`px-3 py-2.5 border-b border-gray-50 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-xs font-semibold text-brand-700 ${outputIsRTL ? 'font-arabic' : ''}`}>
                    {day.label}
                  </span>
                  {day.content && (
                    <button
                      onClick={() => copyDay(day)}
                      className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
                    >
                      {copiedDay === day.key ? ui.copiedDay : ui.copyDay}
                    </button>
                  )}
                </div>
                <div className="p-3 flex-1">
                  {day.error ? (
                    <p className="text-xs text-red-400">{ui.dayError}</p>
                  ) : (
                    <p
                      className={`text-xs text-gray-600 leading-relaxed ${outputIsRTL ? 'font-arabic text-right' : ''}`}
                      dir={outputIsRTL ? 'rtl' : 'ltr'}
                    >
                      {day.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
