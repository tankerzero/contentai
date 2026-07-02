'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUILang } from '@/contexts/UILanguageContext'
import type { UILang } from '@/contexts/UILanguageContext'

// ── Static example outputs ──────────────────────────────────────────────────

const EXAMPLES = [
  {
    icon: '📱',
    typeKey: 'social' as const,
    topic: 'Promotion été restaurant libanais',
    lang: 'FR',
    dir: 'ltr' as const,
    fontClass: '',
    output:
      "🌿 L'été est arrivé et notre restaurant libanais vous invite à célébrer ! 🎉\n\n" +
      "Profitez de nos saveurs authentiques du Moyen-Orient avec notre menu estival spécial :\n" +
      "✨ Mezze frais au citron et à la menthe\n" +
      "🧆 Falafels croustillants maison\n" +
      "🥗 Fattoush croquant aux herbes fraîches\n\n" +
      "📍 Réservez ce week-end et bénéficiez de -15 % sur l'ensemble du menu !\n\n" +
      "👉 Lien en bio pour réserver\n" +
      "#RestaurantLibanais #CuisineMéditerranéenne #PromotionÉté #FoodParis",
  },
  {
    icon: '📝',
    typeKey: 'blog' as const,
    topic: '5 tips for MENA entrepreneurs',
    lang: 'EN',
    dir: 'ltr' as const,
    fontClass: '',
    output:
      "5 Proven Tips for MENA Entrepreneurs to Scale Their Business\n\n" +
      "The Middle East and North Africa is experiencing an unprecedented entrepreneurial renaissance. " +
      "From Cairo's tech hubs to Dubai's innovation corridors, a new generation of founders is rewriting the rules of business.\n\n" +
      "1. Build Trust Before You Build Revenue\n" +
      "In MENA culture, relationships precede transactions. Before pitching your product, invest time in face-to-face meetings and genuine conversations. Your network is your most valuable asset — nurture it accordingly.\n\n" +
      "2. Master Bilingual Storytelling\n" +
      "The most successful MENA brands speak Arabic and English fluently — not just linguistically, but culturally. Craft messaging that resonates across both worlds.",
  },
  {
    icon: '📣',
    typeKey: 'ad' as const,
    topic: 'عرض رمضان للملابس',
    lang: 'AR',
    dir: 'rtl' as const,
    fontClass: 'font-arabic',
    output:
      "✨ عروض رمضان الاستثنائية قد وصلت! ✨\n\n" +
      "👗 اكتشفي أجمل تشكيلات الأزياء لهذا الموسم المبارك\n\n" +
      "أطلالة رائعة في كل ليلة رمضانية — من السهرات الأنيقة إلى جلسات العائلة الدافئة، " +
      "لدينا ما يناسب كل مناسبة.\n\n" +
      "🌙 خصم يصل إلى 40% على جميع التشكيلات الرمضانية\n" +
      "🎁 شحن مجاني للطلبات فوق 200 ريال\n" +
      "⏰ العرض سارٍ حتى نهاية رمضان فقط!\n\n" +
      "#رمضان_كريم #موضة_رمضان #عروض_رمضان",
  },
  {
    icon: '📱',
    typeKey: 'social' as const,
    topic: 'Promoción verano tienda de ropa',
    lang: 'ES',
    dir: 'ltr' as const,
    fontClass: '',
    output:
      "☀️ ¡El verano llegó y nuestra tienda está lista para ti! 🌊\n\n" +
      "Descubre nuestra nueva colección de verano con estilos que van desde la playa hasta la ciudad:\n" +
      "👗 Vestidos ligeros en colores vibrantes\n" +
      "🩴 Sandalias trendy para cada ocasión\n" +
      "🕶️ Accesorios de sol que marcan tendencia\n\n" +
      "🏷️ ¡Hasta 30% de descuento en toda la colección de verano este fin de semana!\n\n" +
      "👉 Enlace en bio para ver el catálogo completo\n" +
      "#ModaVerano #TiendaDeRopa #VeranoStyle #DescuentoVerano #Moda2025",
  },
  {
    icon: '📝',
    typeKey: 'blog' as const,
    topic: '创业成功的5个秘诀',
    lang: 'ZH',
    dir: 'ltr' as const,
    fontClass: 'font-chinese',
    output:
      "创业成功的5个秘诀\n\n" +
      "在当今瞬息万变的商业环境中，越来越多的年轻人选择走上创业之路。然而，成功的创业并非偶然，它需要正确的策略、坚韧的意志和持续的学习。\n\n" +
      "1. 找准市场痛点\n" +
      "成功的创业往往源于解决真实存在的问题。在启动之前，深入调研目标用户的需求，找到那个让他们「非你不可」的理由。\n\n" +
      "2. 打造最小可行产品（MVP）\n" +
      "不要等到产品完美再推向市场。先推出核心功能，快速收集用户反馈，迭代优化。速度就是竞争力。\n\n" +
      "3. 建立强大的人脉网络\n" +
      "在中国商业文化中，关系是不可忽视的资源。积极参加行业活动，与同行、投资人和潜在客户建立真诚的联系。",
  },
]

// ── UI translations ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<'social' | 'blog' | 'ad', Record<UILang, string>> = {
  social: { en: 'Social Media', fr: 'Réseaux Sociaux', ar: 'وسائل التواصل', es: 'Redes Sociales', zh: '社交媒体' },
  blog:   { en: 'Blog Post',    fr: 'Article Blog',    ar: 'مقال مدونة',    es: 'Artículo Blog', zh: '博客文章'  },
  ad:     { en: 'Ad Copy',      fr: 'Texte Publicitaire', ar: 'نص إعلاني',  es: 'Anuncio',       zh: '广告文案'  },
}

const TAB_LABELS: Record<UILang, [string, string, string, string, string]> = {
  en: ['📱 Social FR', '📝 Blog EN',  '📣 Ad AR',      '📱 Social ES', '📝 Blog 中文'],
  fr: ['📱 Social FR', '📝 Blog EN',  '📣 Pub AR',     '📱 Social ES', '📝 Blog 中文'],
  ar: ['📱 سوشيال FR', '📝 مدونة EN', '📣 إعلان AR',  '📱 سوشيال ES', '📝 مدونة 中文'],
  es: ['📱 Social FR', '📝 Blog EN',  '📣 Anuncio AR', '📱 Social ES', '📝 Blog 中文'],
  zh: ['📱 社交 FR',   '📝 博客 EN',  '📣 广告 AR',    '📱 社交 ES',   '📝 博客 中文'],
}

const UI: Record<UILang, {
  title: string; badge: string; topicLabel: string; typeLabel: string
  langLabel: string; disclaimer: string; cta: string; langsNote: string
}> = {
  en: {
    title: 'Try ContentAI',
    badge: '✨ Sample outputs — sign up to generate your own',
    topicLabel: 'Topic', typeLabel: 'Type', langLabel: 'Language',
    disclaimer: 'These are pre-made samples. Sign up free to generate unlimited content in your own voice.',
    cta: 'Start for free →',
    langsNote: 'ContentAI generates content in 5 languages: English, Français, العربية, Español, 中文',
  },
  fr: {
    title: 'Essayez ContentAI',
    badge: '✨ Exemples de sorties — inscrivez-vous pour les vôtres',
    topicLabel: 'Sujet', typeLabel: 'Type', langLabel: 'Langue',
    disclaimer: 'Ces exemples sont pré-créés. Inscrivez-vous gratuitement pour générer du contenu illimité.',
    cta: 'Commencer gratuitement →',
    langsNote: 'ContentAI génère du contenu en 5 langues : English, Français, العربية, Español, 中文',
  },
  ar: {
    title: 'جرّب ContentAI',
    badge: '✨ نماذج جاهزة — سجّل لإنشاء محتواك الخاص',
    topicLabel: 'الموضوع', typeLabel: 'النوع', langLabel: 'اللغة',
    disclaimer: 'هذه نماذج جاهزة. سجّل مجاناً لإنشاء محتوى غير محدود بأسلوبك.',
    cta: 'ابدأ مجاناً ←',
    langsNote: 'يُنتج ContentAI محتوى بـ 5 لغات: English, Français, العربية, Español, 中文',
  },
  es: {
    title: 'Prueba ContentAI',
    badge: '✨ Ejemplos predefinidos — regístrate para generar los tuyos',
    topicLabel: 'Tema', typeLabel: 'Tipo', langLabel: 'Idioma',
    disclaimer: 'Estos son ejemplos predefinidos. Regístrate gratis para generar contenido ilimitado.',
    cta: 'Comenzar gratis →',
    langsNote: 'ContentAI genera contenido en 5 idiomas: English, Français, العربية, Español, 中文',
  },
  zh: {
    title: '试用 ContentAI',
    badge: '✨ 预设示例 — 注册即可生成您自己的内容',
    topicLabel: '主题', typeLabel: '类型', langLabel: '语言',
    disclaimer: '这些是预设示例。免费注册以生成无限内容。',
    cta: '免费开始 →',
    langsNote: 'ContentAI 支持5种语言生成内容：English, Français, العربية, Español, 中文',
  },
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [displayedChars, setDisplayedChars] = useState(0)

  const example = EXAMPLES[selectedIdx]
  const fullOutput = example.output

  // Reset typing when tab changes
  useEffect(() => {
    setDisplayedChars(0)
  }, [selectedIdx])

  // Typing animation — 3 chars per 10ms ≈ ~2s for a full example
  useEffect(() => {
    if (displayedChars >= fullOutput.length) return
    const t = setTimeout(() => setDisplayedChars(n => Math.min(n + 3, fullOutput.length)), 10)
    return () => clearTimeout(t)
  }, [displayedChars, fullOutput.length])

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleClose])

  const tabs = TAB_LABELS[lang]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={`relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto ${isRTL ? 'font-arabic' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0D7377] to-[#0a5f63] rounded-t-2xl px-5 pt-5 pb-5 text-white">
          <button
            onClick={handleClose}
            className={`absolute top-4 text-white/60 hover:text-white text-2xl leading-none transition-colors ${isRTL ? 'left-4' : 'right-4'}`}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-1">{ui.title}</h2>
          <p className="text-xs text-white/75 leading-snug max-w-xs">{ui.badge}</p>
        </div>

        {/* Tabs — scrollable horizontal row */}
        <div className={`flex gap-2 px-4 pt-4 pb-1 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
          {tabs.map((label, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`shrink-0 min-h-[44px] text-xs font-semibold py-2 px-3 rounded-xl border transition-all whitespace-nowrap ${
                selectedIdx === i
                  ? 'border-[#0D7377] bg-teal-50 text-[#0D7377]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Languages note */}
        <p className="px-4 pt-2 pb-0 text-[11px] text-teal-700 font-medium text-center leading-relaxed">
          🌍 {ui.langsNote}
        </p>

        <div className="px-4 pb-5 pt-3 space-y-3">
          {/* Input metadata */}
          <div
            className={`bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 ${example.fontClass}`}
            dir={example.dir}
          >
            <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 ${example.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <span><span className="text-gray-400">{ui.topicLabel}: </span><span className="font-medium text-gray-700">{example.topic}</span></span>
              <span><span className="text-gray-400">{ui.typeLabel}: </span><span className="font-medium text-gray-700">{TYPE_LABELS[example.typeKey][lang]}</span></span>
              <span><span className="text-gray-400">{ui.langLabel}: </span><span className="font-medium text-gray-700">{example.lang}</span></span>
            </div>
          </div>

          {/* Output with typing effect */}
          <div
            className={`bg-white border border-teal-100 rounded-xl px-4 py-4 min-h-[180px] ${example.fontClass}`}
            dir={example.dir}
          >
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {fullOutput.slice(0, displayedChars)}
              {displayedChars < fullOutput.length && (
                <span className="inline-block w-0.5 h-4 bg-[#0D7377] animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 leading-relaxed text-center px-2">
            {ui.disclaimer}
          </p>

          {/* CTA */}
          <Link
            href="/signup"
            onClick={handleClose}
            className="flex items-center justify-center w-full min-h-[48px] bg-[#0D7377] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors"
          >
            {ui.cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
