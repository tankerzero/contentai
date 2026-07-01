'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

const T = {
  en: {
    title: 'Marketing Automation',
    subtitle: 'Generate promotional posts and manage email sequences',
    postsTab: 'Promotional Posts',
    emailTab: 'Email Sequences',
    topic: 'Campaign topic',
    topicPlaceholder: 'e.g. Black Friday sale, New product launch...',
    language: 'Language',
    tone: 'Tone',
    generate: 'Generate 5 Posts',
    generating: 'Generating...',
    noPostsYet: 'No posts generated yet.',
    platform: 'Platform',
    content: 'Content',
    status: 'Status',
    draft: 'Draft',
    approved: 'Approved',
    posted: 'Posted',
    copy: 'Copy',
    copied: 'Copied!',
    emailTitle: 'Onboarding Email Sequence',
    emailDesc: 'Automated emails sent to new users over 30 days.',
    step: 'Step',
    sent: 'Sent',
    notSent: 'Not sent',
    send: 'Send now',
    sendingEmail: 'Sending...',
    tones: ['Professional', 'Friendly', 'Urgent', 'Inspiring'],
    langs: [['en', 'English'], ['fr', 'French'], ['ar', 'Arabic']],
    day0: 'Welcome (Day 0)',
    day3: 'Tips & Tricks (Day 3)',
    day7: 'Upgrade Nudge (Day 7)',
    day30: 'Re-engagement (Day 30)',
  },
  fr: {
    title: 'Marketing Automatisé',
    subtitle: 'Générez des publications promotionnelles et gérez vos séquences email',
    postsTab: 'Publications Promo',
    emailTab: 'Séquences Email',
    topic: 'Sujet de la campagne',
    topicPlaceholder: 'ex. Soldes Black Friday, Lancement produit...',
    language: 'Langue',
    tone: 'Ton',
    generate: 'Générer 5 publications',
    generating: 'Génération en cours...',
    noPostsYet: 'Aucune publication générée.',
    platform: 'Plateforme',
    content: 'Contenu',
    status: 'Statut',
    draft: 'Brouillon',
    approved: 'Approuvé',
    posted: 'Publié',
    copy: 'Copier',
    copied: 'Copié !',
    emailTitle: "Séquence d'email d'intégration",
    emailDesc: 'Emails automatiques envoyés aux nouveaux utilisateurs sur 30 jours.',
    step: 'Étape',
    sent: 'Envoyé',
    notSent: 'Non envoyé',
    send: 'Envoyer maintenant',
    sendingEmail: 'Envoi en cours...',
    tones: ['Professionnel', 'Amical', 'Urgent', 'Inspirant'],
    langs: [['en', 'Anglais'], ['fr', 'Français'], ['ar', 'Arabe']],
    day0: 'Bienvenue (Jour 0)',
    day3: 'Astuces (Jour 3)',
    day7: 'Mise à niveau (Jour 7)',
    day30: 'Réengagement (Jour 30)',
  },
  ar: {
    title: 'التسويق الآلي',
    subtitle: 'إنشاء منشورات ترويجية وإدارة تسلسلات البريد الإلكتروني',
    postsTab: 'المنشورات الترويجية',
    emailTab: 'تسلسلات البريد',
    topic: 'موضوع الحملة',
    topicPlaceholder: 'مثال: تخفيضات الجمعة السوداء، إطلاق منتج جديد...',
    language: 'اللغة',
    tone: 'الأسلوب',
    generate: 'إنشاء 5 منشورات',
    generating: 'جاري الإنشاء...',
    noPostsYet: 'لا توجد منشورات بعد.',
    platform: 'المنصة',
    content: 'المحتوى',
    status: 'الحالة',
    draft: 'مسودة',
    approved: 'موافق عليه',
    posted: 'منشور',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    emailTitle: 'تسلسل بريد الإعداد',
    emailDesc: 'رسائل بريد إلكتروني آلية ترسل للمستخدمين الجدد على مدى 30 يومًا.',
    step: 'الخطوة',
    sent: 'تم الإرسال',
    notSent: 'لم يُرسل',
    send: 'إرسال الآن',
    sendingEmail: 'جاري الإرسال...',
    tones: ['احترافي', 'ودود', 'عاجل', 'ملهم'],
    langs: [['en', 'الإنجليزية'], ['fr', 'الفرنسية'], ['ar', 'العربية']],
    day0: 'ترحيب (اليوم 0)',
    day3: 'نصائح (اليوم 3)',
    day7: 'ترقية (اليوم 7)',
    day30: 'إعادة تفعيل (اليوم 30)',
  },
  es: {
    title: 'Marketing Automatizado',
    subtitle: 'Genera publicaciones promocionales y gestiona secuencias de email',
    postsTab: 'Publicaciones Promo',
    emailTab: 'Secuencias Email',
    topic: 'Tema de campaña',
    topicPlaceholder: 'ej. Ventas Black Friday, Lanzamiento de producto...',
    language: 'Idioma',
    tone: 'Tono',
    generate: 'Generar 5 publicaciones',
    generating: 'Generando...',
    noPostsYet: 'Sin publicaciones generadas.',
    platform: 'Plataforma',
    content: 'Contenido',
    status: 'Estado',
    draft: 'Borrador',
    approved: 'Aprobado',
    posted: 'Publicado',
    copy: 'Copiar',
    copied: '¡Copiado!',
    emailTitle: 'Secuencia de Email de Bienvenida',
    emailDesc: 'Emails automáticos enviados a nuevos usuarios durante 30 días.',
    step: 'Paso',
    sent: 'Enviado',
    notSent: 'No enviado',
    send: 'Enviar ahora',
    sendingEmail: 'Enviando...',
    tones: ['Profesional', 'Amigable', 'Urgente', 'Inspirador'],
    langs: [['en', 'Inglés'], ['fr', 'Francés'], ['ar', 'Árabe']],
    day0: 'Bienvenida (Día 0)',
    day3: 'Consejos (Día 3)',
    day7: 'Actualización (Día 7)',
    day30: 'Reactivación (Día 30)',
  },
  zh: {
    title: '营销自动化',
    subtitle: '生成推广帖子并管理电子邮件序列',
    postsTab: '推广帖子',
    emailTab: '邮件序列',
    topic: '活动主题',
    topicPlaceholder: '例：黑色星期五特卖，新品发布...',
    language: '语言',
    tone: '语气',
    generate: '生成5篇帖子',
    generating: '生成中...',
    noPostsYet: '暂无生成的帖子。',
    platform: '平台',
    content: '内容',
    status: '状态',
    draft: '草稿',
    approved: '已审核',
    posted: '已发布',
    copy: '复制',
    copied: '已复制！',
    emailTitle: '新用户引导邮件序列',
    emailDesc: '30天内自动发送给新用户的电子邮件。',
    step: '步骤',
    sent: '已发送',
    notSent: '未发送',
    send: '立即发送',
    sendingEmail: '发送中...',
    tones: ['专业', '友好', '紧迫', '励志'],
    langs: [['en', '英语'], ['fr', '法语'], ['ar', '阿拉伯语']],
    day0: '欢迎（第0天）',
    day3: '使用技巧（第3天）',
    day7: '升级提示（第7天）',
    day30: '重新激活（第30天）',
  },
}

interface MarketingPost {
  id: string
  content: string
  platform: string
  language: string
  status: string
  created_at: string
}

interface EmailSeq {
  step: number
  sent_at: string
  opened_at?: string
}

const EMAIL_STEPS = [0, 3, 7, 30]

export default function MarketingPage() {
  const { lang } = useUILang()
  const t = T[lang]

  const [tab, setTab] = useState<'posts' | 'email'>('posts')
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('en')
  const [tone, setTone] = useState('Professional')
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [sequences, setSequences] = useState<EmailSeq[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [sendingStep, setSendingStep] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [postsRes, emailRes] = await Promise.all([
      fetch('/api/marketing').then(r => r.json()),
      fetch('/api/email').then(r => r.json()),
    ])
    setPosts(postsRes.posts ?? [])
    setSequences(emailRes.sequences ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleGenerate = async () => {
    if (!topic) return
    setGenerating(true)
    const res = await fetch('/api/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, language, tone }),
    })
    const data = await res.json()
    if (data.posts) {
      setPosts(prev => [...data.posts, ...prev])
    }
    setGenerating(false)
  }

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopying(id)
    setTimeout(() => setCopying(null), 2000)
  }

  const handleSendEmail = async (step: number) => {
    setSendingStep(step)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
    await loadData()
    setSendingStep(null)
  }

  const sentSteps = new Set(sequences.map(s => s.step))

  const stepLabel = (step: number) => {
    if (step === 0) return t.day0
    if (step === 3) return t.day3
    if (step === 7) return t.day7
    return t.day30
  }

  const statusLabel = (s: string) =>
    s === 'approved' ? t.approved : s === 'posted' ? t.posted : t.draft

  const statusColor = (s: string) =>
    s === 'approved' ? 'bg-green-50 text-green-700' :
    s === 'posted' ? 'bg-blue-50 text-blue-700' :
    'bg-gray-50 text-gray-600'

  const platformIcon: Record<string, string> = {
    instagram: '📷', linkedin: '💼', twitter: '𝕏', facebook: 'f', tiktok: '♪',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
      <p className="text-gray-500 mb-6">{t.subtitle}</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {(['posts', 'email'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${tab === key ? 'border-[#0D7377] text-[#0D7377]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {key === 'posts' ? t.postsTab : t.emailTab}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <>
          {/* Generation form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.topic}</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={t.topicPlaceholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.language}</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30"
                >
                  {t.langs.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.tone}</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30"
                >
                  {t.tones.map(tn => <option key={tn}>{tn}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={!topic || generating}
                  className="w-full bg-[#0D7377] text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-[#0a5d61] disabled:opacity-50 transition text-sm"
                >
                  {generating ? t.generating : t.generate}
                </button>
              </div>
            </div>
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="text-gray-400 text-sm">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : posts.length === 0 ? (
            <div className="text-gray-400 text-sm py-8 text-center">{t.noPostsYet}</div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{platformIcon[post.platform] ?? '📢'}</span>
                      <span className="capitalize font-medium text-gray-800">{post.platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(post.status)}`}>
                        {statusLabel(post.status)}
                      </span>
                      <button
                        onClick={() => handleCopy(post.id, post.content)}
                        className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50"
                      >
                        {copying === post.id ? t.copied : t.copy}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'email' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.emailTitle}</h2>
          <p className="text-sm text-gray-500 mb-6">{t.emailDesc}</p>
          <div className="space-y-3">
            {EMAIL_STEPS.map(step => {
              const isSent = sentSteps.has(step)
              const seqData = sequences.find(s => s.step === step)
              return (
                <div key={step} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{stepLabel(step)}</div>
                    {isSent && seqData && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {t.sent}: {new Date(seqData.sent_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isSent ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">{t.sent} ✓</span>
                    ) : (
                      <button
                        onClick={() => handleSendEmail(step)}
                        disabled={sendingStep === step}
                        className="text-sm bg-[#0D7377] text-white px-4 py-1.5 rounded-lg hover:bg-[#0a5d61] disabled:opacity-50 transition"
                      >
                        {sendingStep === step ? t.sendingEmail : t.send}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
