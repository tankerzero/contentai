'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUILang } from '@/contexts/UILanguageContext'
import type { UILang } from '@/contexts/UILanguageContext'

const DEMO_KEY = 'contentai_demo_count'
const DEMO_MAX = 3

const CONTENT_TYPES: { value: string; labels: Record<UILang, string> }[] = [
  { value: 'social_media', labels: { en: 'Social Post', fr: 'Post Social',   ar: 'منشور',    es: 'Post Social', zh: '社交帖子' } },
  { value: 'blog_post',    labels: { en: 'Blog Post',   fr: 'Article Blog',  ar: 'مقال',     es: 'Artículo',    zh: '博客文章' } },
  { value: 'ad_copy',      labels: { en: 'Ad Copy',     fr: 'Texte Pub',     ar: 'إعلان',    es: 'Anuncio',     zh: '广告文案' } },
]

const CONTENT_LANGS: { value: UILang; label: string }[] = [
  { value: 'en', label: '🇬🇧 EN' },
  { value: 'fr', label: '🇫🇷 FR' },
  { value: 'ar', label: '🇸🇦 AR' },
  { value: 'es', label: '🇪🇸 ES' },
  { value: 'zh', label: '🇨🇳 中' },
]

const UI: Record<UILang, {
  title: string; subtitle: string; topicLabel: string; topicPlaceholder: string
  typeLabel: string; langLabel: string; btn: string; generating: string
  demosLeft: (n: number) => string; remaining: string
  resultTitle: string; ctaText: string; ctaBtn: string
  limitTitle: string; limitText: string; limitBtn: string
}> = {
  en: {
    title: 'Try ContentAI', subtitle: 'No sign-up needed',
    topicLabel: 'What do you want to write about?',
    topicPlaceholder: 'e.g. Summer coffee specials for our Montreal café',
    typeLabel: 'Content type', langLabel: 'Language',
    btn: 'Generate', generating: 'Generating…',
    demosLeft: n => `${n} free demo${n !== 1 ? 's' : ''}`, remaining: 'remaining',
    resultTitle: 'Your generated content',
    ctaText: 'Like it? Get unlimited generations.',
    ctaBtn: 'Start free →',
    limitTitle: 'Demo limit reached',
    limitText: 'Sign up free to keep generating — 5 generations/month on the free plan.',
    limitBtn: 'Create free account →',
  },
  fr: {
    title: 'Essayez ContentAI', subtitle: 'Sans inscription',
    topicLabel: 'Sur quoi voulez-vous écrire ?',
    topicPlaceholder: 'ex. Offres café d\'été pour notre café montréalais',
    typeLabel: 'Type de contenu', langLabel: 'Langue',
    btn: 'Générer', generating: 'Génération…',
    demosLeft: n => `${n} démo${n !== 1 ? 's' : ''} gratuite${n !== 1 ? 's' : ''}`, remaining: 'restante(s)',
    resultTitle: 'Votre contenu généré',
    ctaText: 'Vous aimez ? Obtenez des générations illimitées.',
    ctaBtn: 'Commencer gratuitement →',
    limitTitle: 'Limite atteinte',
    limitText: 'Créez un compte gratuit — 5 générations/mois sur le plan gratuit.',
    limitBtn: 'Créer un compte gratuit →',
  },
  ar: {
    title: 'جرّب ContentAI', subtitle: 'بدون تسجيل',
    topicLabel: 'عمَّ تريد الكتابة؟',
    topicPlaceholder: 'مثال: عروض القهوة الصيفية لمقهانا',
    typeLabel: 'نوع المحتوى', langLabel: 'اللغة',
    btn: 'توليد', generating: 'جارٍ التوليد…',
    demosLeft: n => `${n} تجربة مجانية`, remaining: 'متبقية',
    resultTitle: 'المحتوى الذي تم توليده',
    ctaText: 'أعجبك؟ احصل على توليدات غير محدودة.',
    ctaBtn: 'ابدأ مجاناً ←',
    limitTitle: 'انتهت التجارب المجانية',
    limitText: 'أنشئ حساباً مجانياً — 5 توليدات/شهر في الخطة المجانية.',
    limitBtn: 'إنشاء حساب مجاني ←',
  },
  es: {
    title: 'Prueba ContentAI', subtitle: 'Sin registro',
    topicLabel: '¿Sobre qué quieres escribir?',
    topicPlaceholder: 'ej. Especiales de café de verano para nuestro café',
    typeLabel: 'Tipo de contenido', langLabel: 'Idioma',
    btn: 'Generar', generating: 'Generando…',
    demosLeft: n => `${n} demo${n !== 1 ? 's' : ''} gratis`, remaining: 'restante(s)',
    resultTitle: 'Tu contenido generado',
    ctaText: '¿Te gusta? Obtén generaciones ilimitadas.',
    ctaBtn: 'Comenzar gratis →',
    limitTitle: 'Límite alcanzado',
    limitText: 'Crea una cuenta gratuita — 5 generaciones/mes en el plan gratuito.',
    limitBtn: 'Crear cuenta gratuita →',
  },
  zh: {
    title: '试用 ContentAI', subtitle: '无需注册',
    topicLabel: '您想写什么？',
    topicPlaceholder: '例如：蒙特利尔咖啡馆的夏季特惠',
    typeLabel: '内容类型', langLabel: '输出语言',
    btn: '生成', generating: '生成中…',
    demosLeft: n => `剩余 ${n} 次免费体验`, remaining: '',
    resultTitle: '您生成的内容',
    ctaText: '喜欢吗？获取无限生成次数。',
    ctaBtn: '免费开始 →',
    limitTitle: '体验次数已用完',
    limitText: '注册免费账户继续使用 — 免费计划每月 5 次。',
    limitBtn: '创建免费账户 →',
  },
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: Props) {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState('social_media')
  const [contentLang, setContentLang] = useState(lang)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoCount, setDemoCount] = useState(0)

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(DEMO_KEY) ?? '0', 10)
    setDemoCount(isNaN(saved) ? 0 : saved)
  }, [isOpen])

  useEffect(() => {
    setContentLang(lang)
  }, [lang])

  const handleClose = useCallback(() => {
    onClose()
    setResult(null)
    setError(null)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  const remaining = DEMO_MAX - demoCount
  const limitReached = remaining <= 0

  async function handleGenerate() {
    if (!topic.trim() || limitReached || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), type: contentType, language: contentLang }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      const newCount = demoCount + 1
      localStorage.setItem(DEMO_KEY, String(newCount))
      setDemoCount(newCount)
      setResult(data.content)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={`relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto ${isRTL ? 'font-arabic' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#0D7377] to-[#0a5f63] rounded-t-2xl px-6 pt-5 pb-7 text-white">
          <button
            onClick={handleClose}
            className={`absolute top-4 text-white/60 hover:text-white text-2xl leading-none transition-colors ${isRTL ? 'left-4' : 'right-4'}`}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-0.5">{ui.title}</h2>
          <p className="text-white/70 text-sm">{ui.subtitle}</p>
          {!limitReached && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
              {ui.demosLeft(remaining)} {ui.remaining}
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {limitReached ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{ui.limitTitle}</h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{ui.limitText}</p>
              <Link
                href="/signup"
                onClick={handleClose}
                className="inline-block bg-[#0D7377] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors"
              >
                {ui.limitBtn}
              </Link>
            </div>
          ) : (
            <>
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.topicLabel}</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                  placeholder={ui.topicPlaceholder}
                  dir="auto"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                />
              </div>

              {/* Type + Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{ui.typeLabel}</p>
                  <div className="flex flex-col gap-1.5">
                    {CONTENT_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setContentType(ct.value)}
                        className={`min-h-[44px] text-sm py-2.5 px-3 rounded-xl border text-start transition-all ${
                          contentType === ct.value
                            ? 'border-[#0D7377] bg-teal-50 text-[#0D7377] font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {ct.labels[lang]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{ui.langLabel}</p>
                  <div className="flex flex-col gap-1.5">
                    {CONTENT_LANGS.map(cl => (
                      <button
                        key={cl.value}
                        type="button"
                        onClick={() => setContentLang(cl.value)}
                        className={`min-h-[44px] text-sm py-2.5 px-3 rounded-xl border text-start transition-all ${
                          contentLang === cl.value
                            ? 'border-[#0D7377] bg-teal-50 text-[#0D7377] font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full min-h-[48px] bg-[#0D7377] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {ui.generating}
                  </span>
                ) : ui.btn}
              </button>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}
            </>
          )}

          {/* Result */}
          {result && (
            <div className="border border-teal-100 bg-teal-50/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#0D7377] uppercase tracking-wide mb-3">{ui.resultTitle}</p>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap" dir="auto">{result}</p>
              <div className={`mt-4 pt-4 border-t border-teal-100 flex items-center justify-between gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                <p className="text-xs text-gray-500">{ui.ctaText}</p>
                <Link
                  href="/signup"
                  onClick={handleClose}
                  className="shrink-0 bg-[#0D7377] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0a5f63] transition-colors"
                >
                  {ui.ctaBtn}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
