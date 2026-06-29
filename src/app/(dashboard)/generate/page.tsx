'use client'

import { useEffect, useState } from 'react'
import type { ContentType, OutputLanguage } from '@/lib/content-types'
import { TEMPLATES } from '@/lib/templates'
import { getActiveSeasonalTemplates, type SeasonalTemplate } from '@/lib/seasonal'
import { useUILang } from '@/contexts/UILanguageContext'

const CONTENT_TYPES: {
  value: ContentType; icon: string
  label: string; labelFr: string; labelAr: string; labelEs: string; labelZh: string
}[] = [
  { value: 'blog_post',           icon: '✍️', label: 'Blog Post',           labelFr: 'Article de Blog',    labelAr: 'مقال مدونة',    labelEs: 'Artículo de Blog',         labelZh: '博客文章' },
  { value: 'social_media',        icon: '📱', label: 'Social Media',        labelFr: 'Réseaux Sociaux',    labelAr: 'منشور اجتماعي', labelEs: 'Redes Sociales',           labelZh: '社交媒体' },
  { value: 'email',               icon: '📧', label: 'Email',               labelFr: 'Email',              labelAr: 'بريد إلكتروني', labelEs: 'Email',                    labelZh: '电子邮件' },
  { value: 'product_description', icon: '🛒', label: 'Product Description', labelFr: 'Description Produit',labelAr: 'وصف منتج',      labelEs: 'Descripción de Producto',  labelZh: '产品描述' },
  { value: 'ad_copy',             icon: '📣', label: 'Ad Copy',             labelFr: 'Texte Pub',          labelAr: 'نص إعلاني',     labelEs: 'Texto Publicitario',       labelZh: '广告文案' },
]

const TONES: Record<OutputLanguage, string[]> = {
  en: ['Professional', 'Casual', 'Friendly', 'Formal', 'Humorous', 'Inspirational'],
  fr: ['Professionnel', 'Décontracté', 'Amical', 'Formel', 'Humoristique', 'Inspirant'],
  ar: ['احترافي', 'غير رسمي', 'ودّي', 'رسمي', 'فكاهي', 'ملهِم'],
  es: ['Profesional', 'Casual', 'Amigable', 'Formal', 'Humorístico', 'Inspirador'],
  zh: ['专业', '随意', '友好', '正式', '幽默', '励志'],
}

const LANGUAGES: { value: OutputLanguage; label: string; dir: 'ltr' | 'rtl'; flag: string }[] = [
  { value: 'en', label: 'English',  dir: 'ltr', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { value: 'ar', label: 'العربية',  dir: 'rtl', flag: '🇸🇦' },
  { value: 'es', label: 'Español',  dir: 'ltr', flag: '🇪🇸' },
  { value: 'zh', label: '中文',     dir: 'ltr', flag: '🇨🇳' },
]

const UI = {
  en: {
    title: 'Generate Content', subtitle: 'Describe what you need and let AI do the writing.',
    contentTypeLabel: 'Content type', topicLabel: 'Topic / brief',
    topicPlaceholder: 'e.g. The benefits of remote work for software engineers',
    toneLabel: 'Tone', keywordsLabel: 'Keywords', keywordsOptional: '(optional)',
    keywordsPlaceholder: 'e.g. productivity, work-life balance, async',
    wordCountLabel: 'Target word count', outputLabel: 'Output',
    outputPlaceholder: 'Your generated content will appear here.',
    generating: 'Generating…', generatingOutput: 'Generating your content…',
    generate: '✨ Generate', copy: 'Copy', copied: '✓ Copied!', languageLabel: 'Output language',
    templatesLabel: 'Templates', brandToggle: 'Apply brand voice',
    openPlatform: 'Copy & open platform',
  },
  fr: {
    title: 'Générer du Contenu', subtitle: "Décrivez ce dont vous avez besoin et laissez l'IA écrire.",
    contentTypeLabel: 'Type de contenu', topicLabel: 'Sujet / brief',
    topicPlaceholder: 'ex. Les avantages du télétravail pour les développeurs',
    toneLabel: 'Ton', keywordsLabel: 'Mots-clés', keywordsOptional: '(optionnel)',
    keywordsPlaceholder: 'ex. productivité, équilibre vie pro/perso',
    wordCountLabel: 'Nombre de mots cible', outputLabel: 'Résultat',
    outputPlaceholder: 'Votre contenu généré apparaîtra ici.',
    generating: 'Génération en cours…', generatingOutput: 'Génération de votre contenu…',
    generate: '✨ Générer', copy: 'Copier', copied: '✓ Copié !', languageLabel: 'Langue de sortie',
    templatesLabel: 'Modèles', brandToggle: 'Ton de marque',
    openPlatform: 'Copier & ouvrir la plateforme',
  },
  ar: {
    title: 'توليد المحتوى', subtitle: 'صِف ما تحتاجه ودع الذكاء الاصطناعي يكتب.',
    contentTypeLabel: 'نوع المحتوى', topicLabel: 'الموضوع / الموجز',
    topicPlaceholder: 'مثال: فوائد العمل عن بُعد للمطورين',
    toneLabel: 'الأسلوب', keywordsLabel: 'الكلمات المفتاحية', keywordsOptional: '(اختياري)',
    keywordsPlaceholder: 'مثال: الإنتاجية، التوازن بين العمل والحياة',
    wordCountLabel: 'عدد الكلمات المستهدف', outputLabel: 'النتيجة',
    outputPlaceholder: 'سيظهر المحتوى المولَّد هنا.',
    generating: 'جارٍ التوليد…', generatingOutput: 'جارٍ توليد محتواك…',
    generate: '✨ توليد', copy: 'نسخ', copied: '✓ تم النسخ!', languageLabel: 'لغة المخرجات',
    templatesLabel: 'القوالب', brandToggle: 'صوت العلامة التجارية',
    openPlatform: 'نسخ وفتح المنصة',
  },
  es: {
    title: 'Generar Contenido', subtitle: 'Describe lo que necesitas y deja que la IA escriba.',
    contentTypeLabel: 'Tipo de contenido', topicLabel: 'Tema / brief',
    topicPlaceholder: 'ej. Los beneficios del trabajo remoto para ingenieros de software',
    toneLabel: 'Tono', keywordsLabel: 'Palabras clave', keywordsOptional: '(opcional)',
    keywordsPlaceholder: 'ej. productividad, equilibrio trabajo-vida, colaboración',
    wordCountLabel: 'Número de palabras objetivo', outputLabel: 'Resultado',
    outputPlaceholder: 'Tu contenido generado aparecerá aquí.',
    generating: 'Generando…', generatingOutput: 'Generando tu contenido…',
    generate: '✨ Generar', copy: 'Copiar', copied: '✓ ¡Copiado!', languageLabel: 'Idioma de salida',
    templatesLabel: 'Plantillas', brandToggle: 'Aplicar voz de marca',
    openPlatform: 'Copiar y abrir plataforma',
  },
  zh: {
    title: '生成内容', subtitle: '描述您的需求，让AI来写作。',
    contentTypeLabel: '内容类型', topicLabel: '主题 / 简介',
    topicPlaceholder: '例如：远程办公对软件工程师的好处',
    toneLabel: '语调', keywordsLabel: '关键词', keywordsOptional: '（可选）',
    keywordsPlaceholder: '例如：生产力、工作生活平衡、协作',
    wordCountLabel: '目标字数', outputLabel: '输出',
    outputPlaceholder: '您生成的内容将显示在这里。',
    generating: '生成中…', generatingOutput: '正在生成您的内容…',
    generate: '✨ 生成', copy: '复制', copied: '✓ 已复制！', languageLabel: '输出语言',
    templatesLabel: '模板', brandToggle: '应用品牌声音',
    openPlatform: '复制并打开平台',
  },
}

export default function GeneratePage() {
  const { lang, isRTL } = useUILang()
  const [contentType, setContentType] = useState<ContentType>('blog_post')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('')
  const [language, setLanguage] = useState<OutputLanguage>('fr')
  const [keywords, setKeywords] = useState('')
  const [wordCount, setWordCount] = useState(300)
  const [result, setResult] = useState('')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [useBrandVoice, setUseBrandVoice] = useState(false)
  const [hasBrand, setHasBrand] = useState(false)

  const [activeSeasonal, setActiveSeasonal] = useState<SeasonalTemplate[]>([])

  const outputDir = LANGUAGES.find(l => l.value === language)?.dir ?? 'ltr'
  const ui = UI[lang]
  const tones = TONES[language]

  // Compute seasonal templates client-side only, so the real browser date and
  // locale are always used (never a stale SSR date).
  useEffect(() => {
    const locale = navigator.language || 'en'
    setActiveSeasonal(getActiveSeasonalTemplates(locale, lang))
  }, [lang])

  useEffect(() => {
    fetch('/api/brand').then(r => r.json()).then(({ profile }) => setHasBrand(!!profile))
  }, [])

  function handleLanguageChange(newLang: OutputLanguage) {
    setLanguage(newLang)
    setTone('')
  }

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setContentType(tpl.contentType)
    const topicLang = (tpl.topic as Record<string, string>)[lang] ?? tpl.topic.fr ?? tpl.topic.ar ?? ''
    setTopic(topicLang)
    setTone(tpl.tone)
    setLanguage(tpl.language)
    if (tpl.keywords) setKeywords(tpl.keywords)
    if (tpl.wordCount) setWordCount(tpl.wordCount)
  }

  function applySeasonalTemplate(tpl: SeasonalTemplate) {
    setContentType(tpl.contentType)
    setTopic(tpl.topic[lang] ?? tpl.topic.en ?? tpl.topic.fr)
    setTone(tpl.tone)
    setLanguage(tpl.language)
  }

  function getContentTypeLabel(ct: typeof CONTENT_TYPES[0]) {
    if (language === 'ar') return ct.labelAr
    if (language === 'fr') return ct.labelFr
    if (language === 'es') return ct.labelEs
    if (language === 'zh') return ct.labelZh
    return ct.label
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult('')
    setGenerationId(null)
    setIsFavorite(false)
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, topic, tone, language, keywords, wordCount, useBrandVoice }),
      })

      const data = await res.json()
      console.log('[generate] API response:', { status: res.status, ok: res.ok, hasContent: !!data.content, contentLen: data.content?.length, id: data.id, error: data.error })
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setResult(data.content ?? '')
      if (data.id) setGenerationId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleFavorite() {
    if (!generationId) return
    const next = !isFavorite
    setIsFavorite(next)
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generationId, is_favorite: next }),
    })
  }

  return (
    <div className={`p-8 max-w-5xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{ui.subtitle}</p>

      {/* Templates strip */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {ui.templatesLabel}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Seasonal templates first */}
          {activeSeasonal.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applySeasonalTemplate(tpl)}
              className="shrink-0 flex flex-col items-start gap-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:border-amber-400 hover:bg-amber-100 transition-colors text-left w-[180px]"
            >
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-lg shrink-0">{tpl.icon}</span>
                <span className="text-xs font-bold text-amber-700 truncate">
                  {tpl.name[lang] ?? tpl.name.en ?? tpl.name.fr}
                </span>
              </div>
              <span className="text-xs text-amber-600 leading-tight line-clamp-2 w-full">
                {tpl.description[lang] ?? tpl.description.en ?? tpl.description.fr}
              </span>
            </button>
          ))}
          {/* Static templates */}
          {TEMPLATES.map(tpl => {
            const nameStr = (tpl.name as Record<string, string>)[lang] ?? tpl.name.fr ?? tpl.name.ar ?? ''
            const descStr = (tpl.description as Record<string, string>)[lang] ?? tpl.description.fr ?? tpl.description.ar ?? ''
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="shrink-0 flex flex-col items-start gap-1 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left w-[180px]"
              >
                <span className="text-xl">{tpl.icon}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight w-full">
                  {nameStr}
                </span>
                <span className="text-xs text-gray-400 leading-tight line-clamp-2 w-full">
                  {descStr}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-5">

          {/* Language selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{ui.languageLabel}</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => handleLanguageChange(l.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    language === l.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${l.value === 'ar' ? 'font-arabic' : ''}`}
                >
                  <span>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{ui.contentTypeLabel}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setContentType(ct.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    contentType === ct.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span>{ct.icon}</span>
                  <span>{getContentTypeLabel(ct)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.topicLabel}</label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required
              rows={3}
              dir={outputDir}
              className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none ${isRTL ? 'font-arabic text-right' : ''}`}
              placeholder={ui.topicPlaceholder}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{ui.toneLabel}</label>
            <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
              {tones.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tone === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${isRTL ? 'font-arabic' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ui.keywordsLabel}{' '}
              <span className="text-gray-400 font-normal">{ui.keywordsOptional}</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              dir={outputDir}
              className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${isRTL ? 'font-arabic text-right' : ''}`}
              placeholder={ui.keywordsPlaceholder}
            />
          </div>

          {/* Word count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ui.wordCountLabel}: <span className="text-brand-600">{wordCount}</span>
            </label>
            <input
              type="range" min={100} max={1000} step={50} value={wordCount}
              onChange={e => setWordCount(Number(e.target.value))}
              className="w-full accent-brand-600"
              style={isRTL ? { direction: 'ltr' } : undefined}
            />
            <div className={`flex justify-between text-xs text-gray-400 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>100</span>
              <span>1000</span>
            </div>
          </div>

          {/* Brand voice toggle */}
          {hasBrand && (
            <label className="flex items-center gap-3 cursor-pointer py-1">
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
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {ui.generating}
              </>
            ) : ui.generate}
          </button>
        </form>

        {/* Output */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col min-h-96">
          <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium text-gray-700">{ui.outputLabel}</span>
            {result && (
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {generationId && (
                  <button
                    onClick={toggleFavorite}
                    className={`text-xl leading-none transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
                    title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    ★
                  </button>
                )}
                <button
                  onClick={copyToClipboard}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  {copied ? ui.copied : ui.copy}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 p-5 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mr-2" />
                {ui.generatingOutput}
              </div>
            )}
            {!loading && !result && (
              <p className="text-gray-400 text-sm text-center mt-12">{ui.outputPlaceholder}</p>
            )}
            {result && (
              <pre
                dir={outputDir}
                className={`text-sm text-gray-800 whitespace-pre-wrap leading-relaxed ${language === 'ar' ? 'font-arabic text-right' : 'font-sans'}`}
              >
                {result}
              </pre>
            )}
          </div>

          {/* Copy & Open social buttons */}
          {result && (
            <div className="px-5 pb-5 border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-400 mb-3">{ui.openPlatform}</p>
              <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {[
                  { name: 'Instagram', url: 'https://www.instagram.com/', color: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100' },
                  { name: 'LinkedIn',  url: 'https://www.linkedin.com/post/new', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
                  { name: 'Twitter',   url: 'https://twitter.com/compose/tweet', color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
                  { name: 'Facebook',  url: 'https://www.facebook.com/', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' },
                  { name: 'TikTok',   url: 'https://www.tiktok.com/upload', color: 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100' },
                  { name: 'Buffer',   url: 'https://buffer.com', color: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100' },
                ].map(p => (
                  <button
                    key={p.name}
                    onClick={async () => {
                      await navigator.clipboard.writeText(result)
                      window.open(p.url, '_blank', 'noopener,noreferrer')
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${p.color}`}
                  >
                    {p.name} ↗
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
