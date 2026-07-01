'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUILang } from '@/contexts/UILanguageContext'

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  en: {
    steps: ['Connect', 'Schedule', 'Topics', 'Brand Voice', 'First Post'],
    step: 'Step',
    of: 'of',
    skip: "I'll do this later",
    next: 'Continue →',
    back: '← Back',
    done: 'Done! 🎉',

    s1: {
      title: 'Connect your first social account',
      subtitle: 'ContentAI will ask for permission to post on your behalf. You approve every post before it goes live — nothing posts without you.',
      igNote: 'Connect Facebook first to unlock Instagram posting.',
      igMeta: 'No Instagram Business account found linked to your Facebook Page. Set it up in Meta Business Suite to enable Instagram posting.',
    },
    s2: {
      title: 'When do you want to post?',
      subtitle: 'Pick days and times. ContentAI will suggest content for these slots.',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      slots: ['Morning (9 AM)', 'Afternoon (1 PM)', 'Evening (7 PM)'],
      tz: 'Timezone',
    },
    s3: {
      title: 'What do you post about?',
      subtitle: 'Pick at least 2 — ContentAI will rotate between these.',
      topics: ['📦 Products & services', '💡 Industry tips', '🎬 Behind the scenes', '🎁 Promotions', '📰 News & updates', '🤝 Customer stories'],
    },
    s4: {
      title: 'Set up your brand voice',
      subtitle: 'Optional — helps ContentAI sound like you.',
      name: 'Brand name',
      tone: 'Tone',
      tones: ['Professional', 'Friendly', 'Playful', 'Authoritative'],
      about: 'One sentence about what you do',
      aboutPlaceholder: 'e.g. We help small businesses grow with social media marketing',
      skip: 'Skip for now',
    },
    s5: {
      title: "Here's your first post",
      subtitle: 'Generated based on your topics and brand voice.',
      approve: '✅ Approve & Schedule',
      regen: '🔄 Regenerate (1 credit)',
      edit: '✏️ Edit before approving',
      scheduled: (day: string, time: string) => `Your first post is scheduled for ${day} at ${time}. We'll email you before it goes live so you can approve or skip.`,
    },
  },
  fr: {
    steps: ['Connecter', 'Planifier', 'Sujets', 'Voix de marque', 'Premier post'],
    step: 'Étape',
    of: 'sur',
    skip: 'Je ferai ça plus tard',
    next: 'Continuer →',
    back: '← Retour',
    done: 'Terminé ! 🎉',

    s1: {
      title: 'Connectez votre premier réseau social',
      subtitle: 'ContentAI demandera la permission de publier en votre nom. Vous approuvez chaque publication avant qu\'elle soit mise en ligne.',
      igNote: 'Connectez Facebook d\'abord pour débloquer la publication Instagram.',
      igMeta: 'Aucun compte Instagram Business trouvé sur votre Page Facebook. Configurez-le dans Meta Business Suite.',
    },
    s2: {
      title: 'Quand voulez-vous publier ?',
      subtitle: 'Choisissez des jours et des heures. ContentAI suggérera du contenu pour ces créneaux.',
      days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      slots: ['Matin (9 h)', 'Après-midi (13 h)', 'Soir (19 h)'],
      tz: 'Fuseau horaire',
    },
    s3: {
      title: 'Quels sujets abordez-vous ?',
      subtitle: 'Choisissez au moins 2 — ContentAI alternera entre eux.',
      topics: ['📦 Produits & services', '💡 Conseils sectoriels', '🎬 Dans les coulisses', '🎁 Promotions', '📰 Actualités', '🤝 Témoignages clients'],
    },
    s4: {
      title: 'Configurez votre voix de marque',
      subtitle: 'Optionnel — aide ContentAI à écrire comme vous.',
      name: 'Nom de la marque',
      tone: 'Ton',
      tones: ['Professionnel', 'Amical', 'Ludique', 'Autoritaire'],
      about: 'Une phrase sur ce que vous faites',
      aboutPlaceholder: 'ex. Nous aidons les PME à croître grâce aux réseaux sociaux',
      skip: 'Passer pour l\'instant',
    },
    s5: {
      title: 'Voici votre premier post',
      subtitle: 'Généré selon vos sujets et votre voix de marque.',
      approve: '✅ Approuver & Planifier',
      regen: '🔄 Régénérer (1 crédit)',
      edit: '✏️ Modifier avant approbation',
      scheduled: (day: string, time: string) => `Votre premier post est planifié pour le ${day} à ${time}. Nous vous enverrons un email avant qu'il soit publié.`,
    },
  },
  ar: {
    steps: ['ربط', 'جدولة', 'مواضيع', 'صوت العلامة', 'أول منشور'],
    step: 'خطوة',
    of: 'من',
    skip: 'سأفعل هذا لاحقاً',
    next: 'متابعة ←',
    back: '→ رجوع',
    done: 'تم! 🎉',

    s1: {
      title: 'اربط أول حساب اجتماعي',
      subtitle: 'سيطلب ContentAI الإذن للنشر نيابةً عنك. تعتمد كل منشور قبل نشره.',
      igNote: 'اربط Facebook أولاً لفتح نشر Instagram.',
      igMeta: 'لم يُعثر على حساب Instagram Business مرتبط بصفحتك. أعدّه في Meta Business Suite.',
    },
    s2: {
      title: 'متى تريد النشر؟',
      subtitle: 'اختر الأيام والأوقات. سيقترح ContentAI محتوى لهذه الفترات.',
      days: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
      slots: ['صباحاً (10 ص)', 'ظهراً (1 م)', 'مساءً (7 م)'],
      tz: 'المنطقة الزمنية',
    },
    s3: {
      title: 'عمَّ تنشر؟',
      subtitle: 'اختر على الأقل 2 — سيتناوب ContentAI بينها.',
      topics: ['📦 المنتجات والخدمات', '💡 نصائح القطاع', '🎬 خلف الكواليس', '🎁 العروض', '📰 الأخبار والتحديثات', '🤝 قصص العملاء'],
    },
    s4: {
      title: 'أعدّ صوت علامتك',
      subtitle: 'اختياري — يساعد ContentAI على الكتابة بأسلوبك.',
      name: 'اسم العلامة',
      tone: 'النبرة',
      tones: ['احترافي', 'ودّي', 'مرح', 'موثوق'],
      about: 'جملة واحدة عمّا تفعله',
      aboutPlaceholder: 'مثال: نساعد الشركات الصغيرة على النمو عبر التسويق الاجتماعي',
      skip: 'تخطّي الآن',
    },
    s5: {
      title: 'هذا أول منشور لك',
      subtitle: 'تم توليده بناءً على مواضيعك وصوت علامتك.',
      approve: '✅ اعتماد وجدولة',
      regen: '🔄 إعادة توليد (رصيد واحد)',
      edit: '✏️ تحرير قبل الاعتماد',
      scheduled: (day: string, time: string) => `تمت جدولة أول منشور ليوم ${day} الساعة ${time}. سنراسلك قبل نشره.`,
    },
  },
  es: {
    steps: ['Conectar', 'Programar', 'Temas', 'Voz de marca', 'Primer post'],
    step: 'Paso',
    of: 'de',
    skip: 'Lo haré más tarde',
    next: 'Continuar →',
    back: '← Volver',
    done: '¡Listo! 🎉',

    s1: {
      title: 'Conecta tu primera cuenta social',
      subtitle: 'ContentAI pedirá permiso para publicar en tu nombre. Apruebas cada publicación antes de que salga.',
      igNote: 'Conecta Facebook primero para desbloquear Instagram.',
      igMeta: 'No se encontró cuenta de Instagram Business en tu Página de Facebook. Configúrala en Meta Business Suite.',
    },
    s2: {
      title: '¿Cuándo quieres publicar?',
      subtitle: 'Elige días y horarios. ContentAI sugerirá contenido para estos momentos.',
      days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      slots: ['Mañana (9 AM)', 'Tarde (1 PM)', 'Noche (7 PM)'],
      tz: 'Zona horaria',
    },
    s3: {
      title: '¿Sobre qué publicas?',
      subtitle: 'Elige al menos 2 — ContentAI alternará entre ellos.',
      topics: ['📦 Productos y servicios', '💡 Consejos del sector', '🎬 Detrás de cámaras', '🎁 Promociones', '📰 Noticias', '🤝 Testimonios'],
    },
    s4: {
      title: 'Configura tu voz de marca',
      subtitle: 'Opcional — ayuda a ContentAI a sonar como tú.',
      name: 'Nombre de la marca',
      tone: 'Tono',
      tones: ['Profesional', 'Amigable', 'Juguetón', 'Autoritario'],
      about: 'Una frase sobre lo que haces',
      aboutPlaceholder: 'ej. Ayudamos a pymes a crecer con marketing en redes sociales',
      skip: 'Omitir por ahora',
    },
    s5: {
      title: 'Aquí está tu primer post',
      subtitle: 'Generado según tus temas y voz de marca.',
      approve: '✅ Aprobar y programar',
      regen: '🔄 Regenerar (1 crédito)',
      edit: '✏️ Editar antes de aprobar',
      scheduled: (day: string, time: string) => `Tu primer post está programado para el ${day} a las ${time}. Te enviaremos un email antes de que se publique.`,
    },
  },
  zh: {
    steps: ['连接', '计划', '主题', '品牌声音', '第一篇'],
    step: '第',
    of: '步，共',
    skip: '稍后再说',
    next: '继续 →',
    back: '← 返回',
    done: '完成！🎉',

    s1: {
      title: '连接您的第一个社交账号',
      subtitle: 'ContentAI 将请求代表您发布内容的权限。每篇帖子在发布前都需要您审核。',
      igNote: '请先连接 Facebook，再解锁 Instagram 发布功能。',
      igMeta: '未找到与您的 Facebook 主页关联的 Instagram Business 账号。请在 Meta Business Suite 中设置。',
    },
    s2: {
      title: '您希望何时发布？',
      subtitle: '选择日期和时间，ContentAI 将为这些时段生成内容。',
      days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      slots: ['上午（9点）', '下午（1点）', '晚上（7点）'],
      tz: '时区',
    },
    s3: {
      title: '您发布什么内容？',
      subtitle: '至少选择 2 个 — ContentAI 将在这些主题间轮换。',
      topics: ['📦 产品与服务', '💡 行业技巧', '🎬 幕后故事', '🎁 促销活动', '📰 新闻动态', '🤝 客户案例'],
    },
    s4: {
      title: '设置您的品牌声音',
      subtitle: '可选 — 帮助 ContentAI 以您的风格写作。',
      name: '品牌名称',
      tone: '语调',
      tones: ['专业', '友好', '活泼', '权威'],
      about: '一句话描述您做什么',
      aboutPlaceholder: '例如：我们帮助小企业通过社交媒体营销实现增长',
      skip: '暂时跳过',
    },
    s5: {
      title: '这是您的第一篇帖子',
      subtitle: '根据您的主题和品牌声音生成。',
      approve: '✅ 批准并安排发布',
      regen: '🔄 重新生成（消耗1次额度）',
      edit: '✏️ 编辑后再批准',
      scheduled: (day: string, time: string) => `您的第一篇帖子已安排在 ${day} ${time} 发布。发布前我们会发邮件通知您审核。`,
    },
  },
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', icon: '𝕏', label: 'Twitter/X', connectPath: '/api/social/twitter/connect' },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', connectPath: '/social' },
  { id: 'facebook', icon: '👍', label: 'Facebook', connectPath: '/social' },
  { id: 'instagram', icon: '📷', label: 'Instagram', connectPath: '/social', requiresFacebook: true },
]

const TIMEZONES = [
  'America/Toronto', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'America/Vancouver', 'Europe/London', 'Europe/Paris', 'Africa/Casablanca',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Shanghai',
]

// ── Smart defaults by language ────────────────────────────────────────────────

function getSmartDefaults(lang: string) {
  if (lang === 'ar') return { days: [0, 2, 4], slots: [0], tz: 'Asia/Riyadh' }       // Sun/Tue/Thu 10AM Gulf
  if (lang === 'fr') return { days: [1, 3], slots: [0], tz: 'America/Toronto' }       // Tue/Thu 9AM Montreal
  return { days: [0, 2, 4], slots: [0], tz: 'America/Toronto' }                       // Mon/Wed/Fri 9AM
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  plan: string
  onboardingCompleted: boolean
  onComplete: () => void
}

// ── Wizard component ──────────────────────────────────────────────────────────

export default function OnboardingWizard({ plan, onboardingCompleted, onComplete }: Props) {
  const { lang, isRTL } = useUILang()
  const t = T[lang]
  const defaults = getSmartDefaults(lang)

  const [step, setStep] = useState(1)
  const [connections, setConnections] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>(defaults.days)
  const [selectedSlots, setSelectedSlots] = useState<number[]>(defaults.slots)
  const [timezone, setTimezone] = useState(defaults.tz)
  const [topics, setTopics] = useState<number[]>([0, 1])
  const [brandName, setBrandName] = useState('')
  const [brandTone, setBrandTone] = useState(0)
  const [brandAbout, setBrandAbout] = useState('')
  const [generatedPost, setGeneratedPost] = useState('')
  const [editedPost, setEditedPost] = useState('')
  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [approved, setApproved] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)

  const isPaid = plan !== 'free'

  // Don't show wizard if already completed or user is free
  if (onboardingCompleted || !isPaid) return null

  // Check if dismissed this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('wizard_dismissed') === '1') return null

  function dismiss() {
    if (typeof window !== 'undefined') sessionStorage.setItem('wizard_dismissed', '1')
    onComplete()
  }

  function toggleDay(i: number) {
    setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])
  }
  function toggleSlot(i: number) {
    setSelectedSlots(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i])
  }
  function toggleTopic(i: number) {
    setTopics(prev => prev.includes(i) ? prev.filter(t => t !== i) : [...prev, i])
  }

  async function generateFirstPost() {
    setGenerating(true)
    try {
      const topicLabels = topics.map(i => t.s3.topics[i]).join(', ')
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social_media',
          topic: topicLabels,
          tone: t.s4.tones[brandTone].toLowerCase(),
          language: lang,
          platform: 'twitter',
          brand_name: brandName,
        }),
      })
      const data = await res.json() as { content?: string; error?: string }
      const content = data.content ?? 'Could not generate content. Please try again.'
      setGeneratedPost(content)
      setEditedPost(content)
    } catch {
      setGeneratedPost('Unable to generate content. Please try again.')
    }
    setGenerating(false)
  }

  async function completeWizard() {
    const supabase = createClient()
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    setApproved(true)
    setTimeout(() => onComplete(), 2000)
  }

  const TOTAL_STEPS = 5

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div className="bg-[#026676] px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">✦ ContentAI</span>
            <button onClick={dismiss} className="text-white/60 hover:text-white text-sm transition-colors">
              {t.skip}
            </button>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
            <p className="text-white/70 text-xs">
              {t.step} {step} {t.of} {TOTAL_STEPS} — {t.steps[step - 1]}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* ── Step 1: Connect social ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.s1.title}</h2>
              <p className="text-sm text-gray-500 mb-6">{t.s1.subtitle}</p>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map(p => {
                  const isConnected = connections.includes(p.id)
                  const isLocked = p.requiresFacebook && !fbConnected

                  return (
                    <div key={p.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.label}</p>
                          {isLocked && <p className="text-xs text-amber-600">{t.s1.igNote}</p>}
                        </div>
                      </div>
                      {isConnected
                        ? <span className="text-green-600 text-sm font-medium">✓ Connected</span>
                        : isLocked
                          ? <span className="text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-gray-100">🔒 Locked</span>
                          : (
                            <Link
                              href={p.connectPath}
                              className="text-sm font-medium text-[#026676] px-3 py-1.5 rounded-lg border border-[#026676] hover:bg-[#026676] hover:text-white transition-colors"
                            >
                              Connect
                            </Link>
                          )
                      }
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                You can connect platforms later from Settings → Social Connections.
              </p>
            </div>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.s2.title}</h2>
              <p className="text-sm text-gray-500 mb-5">{t.s2.subtitle}</p>

              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Days</p>
                <div className="flex flex-wrap gap-2">
                  {t.s2.days.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${selectedDays.includes(i) ? 'bg-[#026676] text-white border-[#026676]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#026676]'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Time slots</p>
                <div className="flex flex-col gap-2">
                  {t.s2.slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => toggleSlot(i)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${selectedSlots.includes(i) ? 'bg-[#026676] text-white border-[#026676]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#026676]'}`}
                    >
                      <span>{i === 0 ? '🌅' : i === 1 ? '☀️' : '🌙'}</span>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">{t.s2.tz}</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#026676]"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ').replace('/', ' / ')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 3: Topics ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.s3.title}</h2>
              <p className="text-sm text-gray-500 mb-5">{t.s3.subtitle}</p>
              <div className="grid grid-cols-2 gap-2">
                {t.s3.topics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTopic(i)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${topics.includes(i) ? 'bg-[#026676] text-white border-[#026676]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#026676]'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              {topics.length < 2 && (
                <p className="text-xs text-amber-600 mt-3">Select at least 2 topics to continue.</p>
              )}
            </div>
          )}

          {/* ── Step 4: Brand Voice ── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.s4.title}</h2>
              <p className="text-sm text-gray-500 mb-5">{t.s4.subtitle}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{t.s4.name}</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Co."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#026676]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{t.s4.tone}</label>
                  <div className="flex flex-wrap gap-2">
                    {t.s4.tones.map((tone, i) => (
                      <button
                        key={i}
                        onClick={() => setBrandTone(i)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${brandTone === i ? 'bg-[#026676] text-white border-[#026676]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#026676]'}`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{t.s4.about}</label>
                  <textarea
                    value={brandAbout}
                    onChange={e => setBrandAbout(e.target.value.slice(0, 100))}
                    placeholder={t.s4.aboutPlaceholder}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#026676]"
                  />
                  <p className="text-xs text-gray-400 text-right">{brandAbout.length}/100</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: First post ── */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.s5.title}</h2>
              <p className="text-sm text-gray-500 mb-5">{t.s5.subtitle}</p>

              {approved ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="font-bold text-gray-900 text-lg">{t.done}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t.s5.scheduled(t.s2.days[selectedDays[0]] ?? 'Soon', t.s2.slots[selectedSlots[0]] ?? '9 AM')}
                  </p>
                </div>
              ) : generatedPost ? (
                <div>
                  {editing ? (
                    <textarea
                      value={editedPost}
                      onChange={e => setEditedPost(e.target.value)}
                      rows={5}
                      className="w-full border border-[#026676] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none mb-4"
                      autoFocus
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 border-l-4 border-l-[#026676] rounded-xl px-4 py-3 mb-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {editedPost}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={completeWizard}
                      className="w-full bg-[#026676] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#024f5c] transition-colors"
                    >
                      {t.s5.approve}
                    </button>
                    <button
                      onClick={generateFirstPost}
                      disabled={generating}
                      className="w-full bg-white text-[#026676] border-2 border-[#026676] py-3 rounded-xl font-semibold text-sm hover:bg-[#026676]/5 transition-colors disabled:opacity-50"
                    >
                      {generating ? '...' : t.s5.regen}
                    </button>
                    <button
                      onClick={() => setEditing(!editing)}
                      className="w-full bg-white text-gray-600 border border-gray-200 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                      {editing ? '← Back to preview' : t.s5.edit}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateFirstPost}
                  disabled={generating}
                  className="w-full bg-[#026676] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#024f5c] transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Generating…
                    </span>
                  ) : '✨ Generate my first post'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* Footer navigation */}
        {!approved && (
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {t.back}
              </button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => {
                  if (step === 3 && topics.length < 2) return
                  if (step === TOTAL_STEPS - 1) generateFirstPost()
                  setStep(s => s + 1)
                }}
                disabled={step === 3 && topics.length < 2}
                className="bg-[#026676] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#024f5c] transition-colors disabled:opacity-40"
              >
                {step === TOTAL_STEPS - 1 ? '✨ Generate my first post →' : t.next}
              </button>
            ) : null}
          </div>
        )}

      </div>
    </div>
  )
}
