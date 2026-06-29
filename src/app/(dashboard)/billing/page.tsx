'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/plans'
import CheckoutButton from '@/components/CheckoutButton'
import { useUILang } from '@/contexts/UILanguageContext'

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
          price: '$4.99',
          cta: 'Buy now',
          href: 'mailto:hello@contentai.app?subject=Content Pack',
        },
        {
          icon: '🎨',
          title: 'Brand Voice Setup',
          desc: 'We configure your brand voice for you — one call, done forever.',
          price: '$19',
          cta: 'Book setup',
          href: 'mailto:hello@contentai.app?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['5 generations/month', 'All content types', '3 languages', 'Standard quality'],
      basic: ['30 generations/month', 'All content types', '3 languages', 'Brand voice', 'Priority generation'],
      pro: ['100 generations/month', 'All content types', '3 languages', 'Brand voice', 'Weekly planner', 'CSV export'],
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
          price: '4,99€',
          cta: 'Acheter',
          href: 'mailto:hello@contentai.app?subject=Pack Contenu',
        },
        {
          icon: '🎨',
          title: 'Configuration Ton de Marque',
          desc: 'Nous configurons votre ton de marque — un appel, fini pour toujours.',
          price: '19€',
          cta: 'Réserver',
          href: 'mailto:hello@contentai.app?subject=Configuration Ton de Marque',
        },
      ],
    },
    features: {
      free: ['5 générations/mois', 'Tous les types', '3 langues', 'Qualité standard'],
      basic: ['30 générations/mois', 'Tous les types', '3 langues', 'Ton de marque', 'Priorité'],
      pro: ['100 générations/mois', 'Tous les types', '3 langues', 'Ton de marque', 'Planificateur', 'Export CSV'],
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
          price: '$4.99',
          cta: 'اشتر الآن',
          href: 'mailto:hello@contentai.app?subject=Content Pack',
        },
        {
          icon: '🎨',
          title: 'إعداد صوت العلامة',
          desc: 'نُعد صوت علامتك التجارية — مكالمة واحدة، انتهى للأبد.',
          price: '$19',
          cta: 'احجز الإعداد',
          href: 'mailto:hello@contentai.app?subject=Brand Voice Setup',
        },
      ],
    },
    features: {
      free: ['5 توليدات/شهر', 'جميع الأنواع', '3 لغات', 'جودة قياسية'],
      basic: ['30 توليداً/شهر', 'جميع الأنواع', '3 لغات', 'صوت العلامة', 'أولوية'],
      pro: ['100 توليد/شهر', 'جميع الأنواع', '3 لغات', 'صوت العلامة', 'المخطط الأسبوعي', 'تصدير CSV'],
      agency: ['500 توليد/شهر', 'ملفات علامة غير محدودة', '10 فضاءات عملاء', 'تقارير PDF بالعلامة البيضاء', 'دعم أولوية'],
    },
    recommended: 'الأكثر شعبية',
  },
}

export default function BillingPage() {
  const { lang, isRTL } = useUILang()
  const uiLang: 'en' | 'fr' | 'ar' = (lang === 'es' || lang === 'zh') ? 'en' : lang
  const ui = UI[uiLang]

  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('plan').eq('id', user.id).single()
        .then(({ data }) => {
          setCurrentPlan((data?.plan as PlanId) ?? 'free')
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
    <div className={`p-8 max-w-5xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">
        {ui.current}{' '}
        <span className="font-semibold text-brand-700 capitalize">{currentPlan}</span>
      </p>

      {/* Plan cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([key, plan]) => {
          const features = ui.features[key as keyof typeof ui.features]
          const isRecommended = key === 'basic'
          const isAgency = key === 'agency'
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
                  {plan.price === 0 ? '0' : `$${plan.price}`}
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
              ) : isAgency ? (
                <a
                  href="mailto:hello@contentai.app?subject=Agency Plan"
                  className="block text-center py-2.5 rounded-xl font-semibold text-xs bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  {ui.contactUs}
                </a>
              ) : key !== 'free' ? (
                <CheckoutButton planId={key} />
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
                  <span className="text-base font-bold text-brand-700 shrink-0">{addon.price}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{addon.desc}</p>
                <a
                  href={addon.href}
                  className="inline-block bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  {addon.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
