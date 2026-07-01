'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/plans'
import CheckoutButton from '@/components/CheckoutButton'
import AddOnCheckoutButton from '@/components/AddOnCheckoutButton'
import { useUILang } from '@/contexts/UILanguageContext'
import { CURRENCIES, type CurrencyCode, loadCurrency, saveCurrency, formatPrice } from '@/lib/currency'

const UI = {
  en: {
    title: 'Billing & Plans', loading: 'Loading…',
    current: 'Current plan:', currentBadge: 'Current plan',
    active: 'Active', downgrade: 'Downgrade',
    perMonth: '/mo', save: 'Save 20%',
    contactUs: 'Contact us',
    upgrade: 'Upgrade',
    addons: {
      title: 'Add-ons',
      subtitle: 'One-time purchases to boost your workflow.',
      items: [
        {
          icon: '⚡',
          title: 'Content Pack',
          desc: '500 extra generations added to your account instantly.',
          basePriceCAD: 4.99,
          cta: 'Buy now',
          addOnId: 'content_pack' as const,
        },
        {
          icon: '🎨',
          title: 'Brand Voice Setup',
          desc: 'We configure your brand voice for you — one call, done forever.',
          basePriceCAD: 19,
          cta: 'Book setup',
          href: 'mailto:support@contentai.ca?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['5 generations/month', 'All content types', '5 languages', 'Standard quality'],
      basic: ['30 generations/month', 'All content types', '5 languages', 'Brand voice', 'Priority generation'],
      pro: ['100 generations/month', 'All content types', '5 languages', 'Brand voice', 'Weekly planner', 'CSV export'],
      agency: ['500 generations/month', 'Unlimited brand profiles', '10 client workspaces', 'White-label PDF reports', 'Priority support'],
    },
    recommended: 'Most popular',
  },
  fr: {
    title: 'Facturation & Forfaits', loading: 'Chargement…',
    current: 'Forfait actuel :', currentBadge: 'Forfait actuel',
    active: 'Actif', downgrade: 'Rétrograder',
    perMonth: '/mois', save: '-20%',
    contactUs: 'Nous contacter',
    upgrade: 'Passer au Pro',
    addons: {
      title: 'Extensions',
      subtitle: 'Achats uniques pour booster votre workflow.',
      items: [
        {
          icon: '⚡',
          title: 'Pack Contenu',
          desc: '500 générations supplémentaires ajoutées instantanément.',
          basePriceCAD: 4.99,
          cta: 'Acheter',
          addOnId: 'content_pack' as const,
        },
        {
          icon: '🎨',
          title: 'Configuration Ton de Marque',
          desc: 'Nous configurons votre ton de marque — un appel, fini pour toujours.',
          basePriceCAD: 19,
          cta: 'Réserver',
          href: 'mailto:support@contentai.ca?subject=Configuration Ton de Marque',
        },
      ],
    },
    features: {
      free: ['5 générations/mois', 'Tous les types', '5 langues', 'Qualité standard'],
      basic: ['30 générations/mois', 'Tous les types', '5 langues', 'Ton de marque', 'Priorité'],
      pro: ['100 générations/mois', 'Tous les types', '5 langues', 'Ton de marque', 'Planificateur', 'Export CSV'],
      agency: ['500 générations/mois', 'Profils marque illimités', '10 espaces clients', 'Rapports PDF blanc', 'Support prioritaire'],
    },
    recommended: 'Le plus populaire',
  },
  ar: {
    title: 'الفوترة والخطط', loading: 'جارٍ التحميل…',
    current: 'الخطة الحالية:', currentBadge: 'الخطة الحالية',
    active: 'نشط', downgrade: 'تخفيض',
    perMonth: '/شهر', save: 'وفّر 20%',
    contactUs: 'تواصل معنا',
    upgrade: 'الترقية',
    addons: {
      title: 'الإضافات',
      subtitle: 'مشتريات لمرة واحدة لتعزيز سير عملك.',
      items: [
        {
          icon: '⚡',
          title: 'حزمة المحتوى',
          desc: '500 توليد إضافي يُضاف لحسابك فوراً.',
          basePriceCAD: 4.99,
          cta: 'اشتر الآن',
          addOnId: 'content_pack' as const,
        },
        {
          icon: '🎨',
          title: 'إعداد صوت العلامة',
          desc: 'نُعد صوت علامتك التجارية — مكالمة واحدة، انتهى للأبد.',
          basePriceCAD: 19,
          cta: 'احجز الإعداد',
          href: 'mailto:support@contentai.ca?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['5 توليدات/شهر', 'جميع الأنواع', '5 لغات', 'جودة قياسية'],
      basic: ['30 توليداً/شهر', 'جميع الأنواع', '5 لغات', 'صوت العلامة', 'أولوية'],
      pro: ['100 توليد/شهر', 'جميع الأنواع', '5 لغات', 'صوت العلامة', 'المخطط الأسبوعي', 'تصدير CSV'],
      agency: ['500 توليد/شهر', 'ملفات علامة غير محدودة', '10 فضاءات عملاء', 'تقارير PDF بالعلامة البيضاء', 'دعم أولوية'],
    },
    recommended: 'الأكثر شعبية',
  },
  es: {
    title: 'Facturación y Planes', loading: 'Cargando…',
    current: 'Plan actual:', currentBadge: 'Plan actual',
    active: 'Activo', downgrade: 'Degradar',
    perMonth: '/mes', save: '-20%',
    contactUs: 'Contáctenos',
    upgrade: 'Actualizar',
    addons: {
      title: 'Complementos',
      subtitle: 'Compras únicas para potenciar tu flujo de trabajo.',
      items: [
        {
          icon: '⚡',
          title: 'Pack de Contenido',
          desc: '500 generaciones adicionales añadidas a tu cuenta al instante.',
          basePriceCAD: 4.99,
          cta: 'Comprar ahora',
          addOnId: 'content_pack' as const,
        },
        {
          icon: '🎨',
          title: 'Configuración Voz de Marca',
          desc: 'Configuramos tu voz de marca — una llamada, listo para siempre.',
          basePriceCAD: 19,
          cta: 'Reservar',
          href: 'mailto:support@contentai.ca?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['5 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Calidad estándar'],
      basic: ['30 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Voz de marca', 'Prioridad'],
      pro: ['100 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Voz de marca', 'Planificador', 'Export CSV'],
      agency: ['500 generaciones/mes', 'Perfiles de marca ilimitados', '10 espacios de cliente', 'Informes PDF blancos', 'Soporte prioritario'],
    },
    recommended: 'Más popular',
  },
  zh: {
    title: '账单与套餐', loading: '加载中…',
    current: '当前套餐：', currentBadge: '当前套餐',
    active: '已激活', downgrade: '降级',
    perMonth: '/月', save: '节省20%',
    contactUs: '联系我们',
    upgrade: '升级',
    addons: {
      title: '附加项目',
      subtitle: '一次性购买，提升工作效率。',
      items: [
        {
          icon: '⚡',
          title: '内容包',
          desc: '立即为您的账户添加500次额外生成。',
          basePriceCAD: 4.99,
          cta: '立即购买',
          addOnId: 'content_pack' as const,
        },
        {
          icon: '🎨',
          title: '品牌声音配置',
          desc: '我们为您配置品牌声音 — 一次通话，永久完成。',
          basePriceCAD: 19,
          cta: '预约配置',
          href: 'mailto:support@contentai.ca?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['每月5次生成', '所有内容类型', '5种语言', '标准质量'],
      basic: ['每月30次生成', '所有内容类型', '5种语言', '品牌声音', '优先生成'],
      pro: ['每月100次生成', '所有内容类型', '5种语言', '品牌声音', '每周规划器', 'CSV导出'],
      agency: ['每月500次生成', '无限品牌档案', '10个客户工作区', '白标PDF报告', '优先支持'],
    },
    recommended: '最受欢迎',
  },
}

export default function BillingPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')
  const [loading, setLoading] = useState(true)
  const [currency, setCurrencyState] = useState<CurrencyCode>('CAD')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    const reset = () => setLoadingPlan(null)
    window.addEventListener('focus', reset)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.removeEventListener('focus', reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [])

  useEffect(() => {
    setCurrencyState(loadCurrency())
  }, [])

  function handleCurrencyChange(code: CurrencyCode) {
    setCurrencyState(code)
    saveCurrency(code)
  }

  useEffect(() => {
    const supabase = createClient()
    function loadPlan() {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase.from('profiles').select('plan').eq('id', user.id).single()
          .then(({ data }) => {
            setCurrentPlan((data?.plan as PlanId) ?? 'free')
            setLoading(false)
          })
      })
    }
    loadPlan()
    // After a successful checkout, the Stripe webhook updates the plan shortly after
    // redirect. Re-fetch once more after a short delay to catch the update.
    if (isSuccess) {
      const t = setTimeout(loadPlan, 3000)
      return () => clearTimeout(t)
    }
  }, [isSuccess])

  if (loading) {
    return (
      <div className={`p-8 flex items-center gap-3 text-gray-400 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        {ui.loading}
      </div>
    )
  }

  return (
    <div className={`p-8 max-w-5xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-start justify-between gap-4 mb-6 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{ui.title}</h1>
          <p className="text-gray-500 text-sm">
            {ui.current}{' '}
            <span className="font-semibold text-brand-700 capitalize">{currentPlan}</span>
          </p>
        </div>
        {/* Currency selector */}
        <div className={`flex flex-col items-end gap-1 ${isRTL ? 'items-start' : ''}`}>
          <select
            value={currency}
            onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
            ))}
          </select>
          {currency !== 'CAD' && (
            <p className="text-xs text-gray-400">
              Prices shown in {currency}. Charged in CAD.
            </p>
          )}
        </div>
      </div>

      {/* Post-checkout banners */}
      {isSuccess && (
        <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <span className="text-green-500 text-lg shrink-0">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Payment successful!</p>
            <p className="text-xs text-green-700 mt-0.5">Your plan is being activated. This page will refresh automatically in a few seconds.</p>
          </div>
        </div>
      )}
      {isCanceled && (
        <div className="mb-6 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
          <span className="text-gray-400 text-lg shrink-0">✕</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">Checkout canceled</p>
            <p className="text-xs text-gray-500 mt-0.5">No charge was made. You can upgrade anytime below.</p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([key, plan]) => {
          const features = ui.features[key as keyof typeof ui.features]
          const isRecommended = key === 'basic'
          const isCurrent = key === currentPlan

          return (
            <div
              key={key}
              className={`rounded-2xl p-5 border relative flex flex-col ${
                isCurrent ? 'border-brand-500 bg-brand-50' :
                isRecommended ? 'border-brand-300 bg-gradient-to-b from-brand-50 to-white shadow-sm' :
                'border-gray-200 bg-white'
              }`}
            >
              {isRecommended && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  {ui.recommended}
                </div>
              )}
              {isCurrent && (
                <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                  {ui.currentBadge}
                </div>
              )}
              <h3 className="text-base font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price === 0 ? '0' : formatPrice(plan.price, currency)}
                </span>
                {plan.price > 0 && <span className="text-gray-400 text-xs">{ui.perMonth}</span>}
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-xs text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-brand-500 shrink-0 font-bold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-center text-xs text-brand-600 font-semibold py-2">{ui.active}</div>
              ) : key !== 'free' ? (
                <CheckoutButton
                  planId={key}
                  isLoading={loadingPlan === key}
                  onStart={() => setLoadingPlan(key)}
                  onError={() => setLoadingPlan(null)}
                />
              ) : (
                <div className="text-center text-xs text-gray-400 py-2">{ui.downgrade}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add-ons */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{ui.addons.title}</h2>
        <p className="text-gray-400 text-sm mb-5">{ui.addons.subtitle}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ui.addons.items.map(addon => (
            <div key={addon.title} className={`bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-3xl shrink-0">{addon.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`flex items-center justify-between gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-sm font-bold text-gray-900">{addon.title}</h3>
                  <span className="text-base font-bold text-brand-700 shrink-0">{formatPrice(addon.basePriceCAD, currency)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{addon.desc}</p>
                {addon.addOnId != null ? (
                  <AddOnCheckoutButton addOnId={addon.addOnId} label={addon.cta} />
                ) : (
                  <a
                    href={addon.href}
                    className="inline-block bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                  >
                    {addon.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
