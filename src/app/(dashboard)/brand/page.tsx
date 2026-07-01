'use client'

import { useEffect, useState } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

interface BrandProfile {
  company_name: string
  industry: string
  values: string
  writing_style: string
  tone_examples: string
}

const INDUSTRIES = {
  en: ['E-commerce', 'Restaurant', 'Fashion & Beauty', 'Technology', 'Real Estate', 'Health & Wellness', 'Finance', 'Education', 'Sport', 'Tourism', 'Other'],
  fr: ['E-commerce', 'Restauration', 'Mode & Beauté', 'Technologie', 'Immobilier', 'Santé & Bien-être', 'Finance', 'Éducation', 'Sport', 'Tourisme', 'Autre'],
  ar: ['تجارة إلكترونية', 'مطاعم', 'موضة وجمال', 'تكنولوجيا', 'عقارات', 'صحة ولياقة', 'مالية', 'تعليم', 'رياضة', 'سياحة', 'أخرى'],
  es: ['E-commerce', 'Restaurante', 'Moda y Belleza', 'Tecnología', 'Inmobiliaria', 'Salud y Bienestar', 'Finanzas', 'Educación', 'Deporte', 'Turismo', 'Otro'],
  zh: ['电商', '餐厅', '时尚与美容', '科技', '房地产', '健康与健身', '金融', '教育', '体育', '旅游', '其他'],
}

const WRITING_STYLES = {
  en: ['Formal & Professional', 'Casual & Friendly', 'Inspiring & Motivating', 'Humorous & Quirky', 'Expert & Authoritative', 'Warm & Community-focused'],
  fr: ['Formel et professionnel', 'Décontracté et amical', 'Inspirant et motivant', 'Humoristique et décalé', 'Expertise et autorité', 'Chaleureux et communautaire'],
  ar: ['رسمي ومهني', 'غير رسمي وودّي', 'ملهم وتحفيزي', 'فكاهي ومميز', 'خبير وموثوق', 'دافئ ومجتمعي'],
  es: ['Formal y Profesional', 'Casual y Amigable', 'Inspirador y Motivador', 'Humorístico y Único', 'Experto y Autorizado', 'Cálido y Comunitario'],
  zh: ['正式专业', '轻松友好', '励志激励', '幽默独特', '专家权威', '温暖社区'],
}

const UI = {
  en: {
    title: 'Brand Voice', loading: 'Loading…',
    subtitle: 'Define your brand identity. This info will be automatically injected into your generations when "Brand voice" mode is enabled.',
    companyLabel: 'Company name', companyPlaceholder: 'e.g. My Beautiful Shop',
    industryLabel: 'Industry', valuesLabel: 'Brand values',
    valuesPlaceholder: 'e.g. Quality, proximity, innovation, authenticity',
    styleLabel: 'Writing style', toneLabel: 'Tone examples',
    toneHint: '(typical phrases, characteristic expressions)',
    tonePlaceholder: 'e.g.\n• With us, every client is unique\n• We don\'t do things halfway\n• Excellence isn\'t an option, it\'s our standard',
    save: 'Save profile', saving: 'Saving…', saved: '✓ Profile saved',
  },
  fr: {
    title: 'Ton de Marque', loading: 'Chargement…',
    subtitle: 'Définissez l\'identité de votre marque. Ces informations seront automatiquement injectées dans vos générations lorsque le mode "Ton de marque" est activé.',
    companyLabel: 'Nom de l\'entreprise', companyPlaceholder: 'ex. Ma Belle Boutique',
    industryLabel: 'Secteur d\'activité', valuesLabel: 'Valeurs de la marque',
    valuesPlaceholder: 'ex. Qualité, proximité, innovation, authenticité',
    styleLabel: 'Style d\'écriture', toneLabel: 'Exemples de ton',
    toneHint: '(phrases types, expressions caractéristiques)',
    tonePlaceholder: 'ex.\n• Chez nous, chaque client est unique\n• On ne fait pas les choses à moitié\n• L\'excellence n\'est pas une option, c\'est notre standard',
    save: 'Enregistrer le profil', saving: 'Enregistrement…', saved: '✓ Profil sauvegardé',
  },
  ar: {
    title: 'صوت العلامة التجارية', loading: 'جارٍ التحميل…',
    subtitle: 'حدد هوية علامتك التجارية. ستُحقَن هذه المعلومات تلقائياً في توليداتك عند تفعيل وضع "صوت العلامة".',
    companyLabel: 'اسم الشركة', companyPlaceholder: 'مثال: متجري الجميل',
    industryLabel: 'القطاع', valuesLabel: 'قيم العلامة التجارية',
    valuesPlaceholder: 'مثال: الجودة، القرب، الابتكار، الأصالة',
    styleLabel: 'أسلوب الكتابة', toneLabel: 'أمثلة الأسلوب',
    toneHint: '(عبارات نموذجية، تعبيرات مميزة)',
    tonePlaceholder: 'مثال:\n• لدينا، كل عميل فريد\n• نحن لا نتنازل عن الجودة\n• التميز ليس خياراً، بل معيارنا',
    save: 'حفظ الملف', saving: 'جارٍ الحفظ…', saved: '✓ تم حفظ الملف',
  },
  es: {
    title: 'Voz de Marca', loading: 'Cargando…',
    subtitle: 'Define la identidad de tu marca. Esta información se inyectará automáticamente en tus generaciones cuando el modo "Voz de marca" esté activado.',
    companyLabel: 'Nombre de la empresa', companyPlaceholder: 'ej. Mi Tienda Bonita',
    industryLabel: 'Sector', valuesLabel: 'Valores de marca',
    valuesPlaceholder: 'ej. Calidad, proximidad, innovación, autenticidad',
    styleLabel: 'Estilo de escritura', toneLabel: 'Ejemplos de tono',
    toneHint: '(frases típicas, expresiones características)',
    tonePlaceholder: 'ej.\n• Con nosotros, cada cliente es único\n• No hacemos las cosas a medias\n• La excelencia no es una opción, es nuestro estándar',
    save: 'Guardar perfil', saving: 'Guardando…', saved: '✓ Perfil guardado',
  },
  zh: {
    title: '品牌声音', loading: '加载中…',
    subtitle: '定义您的品牌身份。启用"品牌声音"模式时，此信息将自动注入您的生成内容中。',
    companyLabel: '公司名称', companyPlaceholder: '例：我的精品店',
    industryLabel: '行业', valuesLabel: '品牌价值观',
    valuesPlaceholder: '例：质量、亲近、创新、真实性',
    styleLabel: '写作风格', toneLabel: '语气示例',
    toneHint: '（典型短语、特色表达）',
    tonePlaceholder: '例：\n• 在我们这里，每位客户都是独特的\n• 我们不做半途而废的事\n• 卓越不是选项，而是我们的标准',
    save: '保存档案', saving: '保存中…', saved: '✓ 档案已保存',
  },
}

export default function BrandPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [profileId, setProfileId] = useState<string | null>(null)
  const [form, setForm] = useState<BrandProfile>({
    company_name: '',
    industry: '',
    values: '',
    writing_style: '',
    tone_examples: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.json())
      .then(({ profile }) => {
        if (profile) {
          setProfileId(profile.id ?? null)
          setForm({
            company_name: profile.company_name ?? '',
            industry: profile.industry ?? '',
            values: profile.values ?? '',
            writing_style: profile.writing_style ?? '',
            tone_examples: profile.tone_examples ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function update(key: keyof BrandProfile, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: profileId }),
    })

    const d = await res.json()
    if (res.ok) {
      if (d.id) setProfileId(d.id)
      setSaved(true)
    } else {
      setError(d.error ?? 'Save error')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className={`p-8 flex items-center gap-3 text-gray-400 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        {ui.loading}
      </div>
    )
  }

  const industries = INDUSTRIES[lang as keyof typeof INDUSTRIES] ?? INDUSTRIES.en
  const writingStyles = WRITING_STYLES[lang as keyof typeof WRITING_STYLES] ?? WRITING_STYLES.en

  return (
    <div className={`p-8 max-w-2xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{ui.subtitle}</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.companyLabel}</label>
          <input
            type="text"
            value={form.company_name}
            onChange={e => update('company_name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={ui.companyPlaceholder}
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{ui.industryLabel}</label>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {industries.map(ind => (
              <button
                key={ind}
                type="button"
                onClick={() => update('industry', ind)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.industry === ind
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Values */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.valuesLabel}</label>
          <input
            type="text"
            value={form.values}
            onChange={e => update('values', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={ui.valuesPlaceholder}
          />
        </div>

        {/* Writing style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{ui.styleLabel}</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {writingStyles.map(style => (
              <button
                key={style}
                type="button"
                onClick={() => update('writing_style', style)}
                className={`px-4 py-3 rounded-lg border text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'} ${
                  form.writing_style === style
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Tone examples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {ui.toneLabel}{' '}
            <span className="text-gray-400 font-normal">{ui.toneHint}</span>
          </label>
          <textarea
            value={form.tone_examples}
            onChange={e => update('tone_examples', e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder={ui.tonePlaceholder}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {saving ? ui.saving : ui.save}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">{ui.saved}</span>
          )}
        </div>
      </form>
    </div>
  )
}
