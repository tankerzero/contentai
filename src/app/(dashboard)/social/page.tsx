'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUILang } from '@/contexts/UILanguageContext'
import { PLANS } from '@/lib/plans'

const TIMEZONES = [
  { value: 'UTC',                  label: 'UTC' },
  { value: 'America/Toronto',      label: 'Toronto (ET)' },
  { value: 'America/New_York',     label: 'New York (ET)' },
  { value: 'America/Chicago',      label: 'Chicago (CT)' },
  { value: 'America/Los_Angeles',  label: 'Los Angeles (PT)' },
  { value: 'America/Vancouver',    label: 'Vancouver (PT)' },
  { value: 'America/Sao_Paulo',    label: 'São Paulo (BRT)' },
  { value: 'Europe/London',        label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',         label: 'Paris (CET)' },
  { value: 'Africa/Casablanca',    label: 'Casablanca (WET)' },
  { value: 'Asia/Dubai',           label: 'Dubai (GST)' },
  { value: 'Asia/Riyadh',          label: 'Riyadh (AST)' },
  { value: 'Asia/Shanghai',        label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo',           label: 'Tokyo (JST)' },
  { value: 'Asia/Kolkata',         label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney',     label: 'Sydney (AEDT)' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}))

// All platforms that Buffer can connect
const PLATFORM_DISPLAY: Record<string, { label: string; icon: string; color: string; url?: string }> = {
  facebook:  { label: 'Facebook',    icon: '📘', color: 'bg-blue-600',  url: 'https://www.facebook.com' },
  instagram: { label: 'Instagram',   icon: '📷', color: 'bg-pink-500',  url: 'https://www.instagram.com' },
  twitter:   { label: 'Twitter / X', icon: '𝕏',  color: 'bg-gray-900', url: 'https://twitter.com' },
  linkedin:  { label: 'LinkedIn',    icon: 'in', color: 'bg-blue-700',  url: 'https://www.linkedin.com/feed' },
  tiktok:    { label: 'TikTok',      icon: '♪',  color: 'bg-gray-900',  url: 'https://www.tiktok.com/upload' },
  pinterest: { label: 'Pinterest',   icon: '📌', color: 'bg-red-600',   url: 'https://www.pinterest.com' },
  youtube:   { label: 'YouTube',     icon: '▶',  color: 'bg-red-700',   url: 'https://studio.youtube.com' },
}

// All 7 Buffer platforms — used for bulk-disconnect
const BUFFER_PLATFORM_KEYS = Object.keys(PLATFORM_DISPLAY)

interface PostingSchedule {
  id: string
  platform: string
  frequency: string
  post_hour: number
  timezone: string
  content_type: string
  language: string
  topic: string
  is_active: boolean
  last_posted_at: string | null
  created_at: string
}

const T = {
  en: {
    title: 'Social Connections',
    subtitle: 'Manage your social channels and auto-posting preferences',
    connected: 'Connected',
    notConnected: 'Not connected',
    connect: 'Connect',
    disconnect: 'Disconnect',
    disconnectBuffer: 'Disconnect Buffer',
    autoPosting: 'Auto-posting',
    manualLabel: 'Manual — Copy & Open',
    postHistory: 'Post History',
    noHistory: 'No posts yet.',
    platform: 'Platform',
    status: 'Status',
    date: 'Date',
    content: 'Content',
    posted: 'Posted',
    pending: 'Pending',
    failed: 'Failed',
    retry: 'Retry',
    copySuccess: 'Copied!',
    yourChannels: 'Your Buffer Channels',
    slotsUsed: (n: number, max: number) => `${n} of ${max} auto-post slot${max !== 1 ? 's' : ''} used`,
    slotsFull: (plan: string) => {
      if (plan === 'free') return 'Upgrade to Basic for 1 auto-post slot →'
      if (plan === 'basic') return 'Upgrade to Pro for 3 auto-post slots →'
      if (plan === 'pro')   return 'Upgrade to Agency for 5 auto-post slots →'
      return ''
    },
    connectBuffer: 'Connect via Buffer',
    connectBufferSub: 'Auto-post to Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest, and YouTube from one connection.',
    bufferFreeNote: "Buffer's free plan supports up to 3 channels. Connect the platforms you want at buffer.com, then select which ones auto-post here.",
    bufferLimitError: 'Your Buffer account is on the Free plan (3 channels max). To connect more channels,',
    bufferLimitLink: 'upgrade your Buffer plan →',
  },
  fr: {
    title: 'Réseaux Sociaux',
    subtitle: 'Gérez vos chaînes sociales et vos préférences de publication',
    connected: 'Connecté',
    notConnected: 'Non connecté',
    connect: 'Connecter',
    disconnect: 'Déconnecter',
    disconnectBuffer: 'Déconnecter Buffer',
    autoPosting: 'Publication auto',
    manualLabel: 'Manuel — Copier & Ouvrir',
    postHistory: 'Historique des publications',
    noHistory: 'Aucune publication.',
    platform: 'Plateforme',
    status: 'Statut',
    date: 'Date',
    content: 'Contenu',
    posted: 'Publié',
    pending: 'En attente',
    failed: 'Échoué',
    retry: 'Réessayer',
    copySuccess: 'Copié !',
    yourChannels: 'Vos chaînes Buffer',
    slotsUsed: (n: number, max: number) => `${n} sur ${max} slot${max !== 1 ? 's' : ''} utilisé${max !== 1 ? 's' : ''}`,
    slotsFull: (plan: string) => {
      if (plan === 'free')  return 'Passez au Basic pour 1 slot de publication →'
      if (plan === 'basic') return 'Passez au Pro pour 3 slots de publication →'
      if (plan === 'pro')   return 'Passez à Agency pour 5 slots de publication →'
      return ''
    },
    connectBuffer: 'Connecter via Buffer',
    connectBufferSub: 'Publiez sur Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest et YouTube depuis une seule connexion.',
    bufferFreeNote: "Le plan gratuit de Buffer prend en charge jusqu'à 3 chaînes. Connectez vos plateformes sur buffer.com, puis choisissez lesquelles publient automatiquement ici.",
    bufferLimitError: 'Votre compte Buffer est sur le plan gratuit (3 chaînes max). Pour en ajouter,',
    bufferLimitLink: 'mettez à niveau votre plan Buffer →',
  },
  ar: {
    title: 'الشبكات الاجتماعية',
    subtitle: 'إدارة قنواتك الاجتماعية وتفضيلات النشر التلقائي',
    connected: 'متصل',
    notConnected: 'غير متصل',
    connect: 'ربط',
    disconnect: 'قطع الاتصال',
    disconnectBuffer: 'قطع اتصال Buffer',
    autoPosting: 'نشر تلقائي',
    manualLabel: 'يدوي — نسخ وفتح',
    postHistory: 'سجل المنشورات',
    noHistory: 'لا توجد منشورات بعد.',
    platform: 'المنصة',
    status: 'الحالة',
    date: 'التاريخ',
    content: 'المحتوى',
    posted: 'منشور',
    pending: 'قيد الانتظار',
    failed: 'فشل',
    retry: 'إعادة المحاولة',
    copySuccess: 'تم النسخ!',
    yourChannels: 'قنواتك على Buffer',
    slotsUsed: (n: number, max: number) => `${n} من ${max} فتحة مستخدمة`,
    slotsFull: (plan: string) => {
      if (plan === 'free')  return 'ترقية إلى Basic للحصول على فتحة نشر واحدة →'
      if (plan === 'basic') return 'ترقية إلى Pro للحصول على 3 فتحات نشر →'
      if (plan === 'pro')   return 'ترقية إلى Agency للحصول على 5 فتحات نشر →'
      return ''
    },
    connectBuffer: 'ربط عبر Buffer',
    connectBufferSub: 'انشر على Facebook وInstagram وTwitter/X وLinkedIn وTikTok وPinterest وYouTube من اتصال واحد.',
    bufferFreeNote: 'يدعم الخطة المجانية لـ Buffer حتى 3 قنوات. أضف منصاتك على buffer.com ثم اختر أيها تنشر تلقائياً هنا.',
    bufferLimitError: 'حسابك على Buffer مقيد بـ 3 قنوات (الخطة المجانية). لإضافة المزيد،',
    bufferLimitLink: 'ترقية خطة Buffer الخاصة بك →',
  },
  es: {
    title: 'Redes Sociales',
    subtitle: 'Gestiona tus canales sociales y preferencias de publicación',
    connected: 'Conectado',
    notConnected: 'No conectado',
    connect: 'Conectar',
    disconnect: 'Desconectar',
    disconnectBuffer: 'Desconectar Buffer',
    autoPosting: 'Publicación auto',
    manualLabel: 'Manual — Copiar y Abrir',
    postHistory: 'Historial de publicaciones',
    noHistory: 'Sin publicaciones aún.',
    platform: 'Plataforma',
    status: 'Estado',
    date: 'Fecha',
    content: 'Contenido',
    posted: 'Publicado',
    pending: 'Pendiente',
    failed: 'Fallido',
    retry: 'Reintentar',
    copySuccess: '¡Copiado!',
    yourChannels: 'Tus canales de Buffer',
    slotsUsed: (n: number, max: number) => `${n} de ${max} slot${max !== 1 ? 's' : ''} usado${max !== 1 ? 's' : ''}`,
    slotsFull: (plan: string) => {
      if (plan === 'free')  return 'Actualiza a Basic para 1 slot de publicación →'
      if (plan === 'basic') return 'Actualiza a Pro para 3 slots de publicación →'
      if (plan === 'pro')   return 'Actualiza a Agency para 5 slots de publicación →'
      return ''
    },
    connectBuffer: 'Conectar via Buffer',
    connectBufferSub: 'Publica en Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest y YouTube desde una sola conexión.',
    bufferFreeNote: 'El plan gratuito de Buffer admite hasta 3 canales. Conecta tus plataformas en buffer.com, luego elige cuáles publican automáticamente aquí.',
    bufferLimitError: 'Tu cuenta de Buffer está en el plan gratuito (máx. 3 canales). Para conectar más,',
    bufferLimitLink: 'actualiza tu plan de Buffer →',
  },
  zh: {
    title: '社交账号',
    subtitle: '管理您的社交频道和自动发帖偏好',
    connected: '已连接',
    notConnected: '未连接',
    connect: '连接',
    disconnect: '断开连接',
    disconnectBuffer: '断开 Buffer',
    autoPosting: '自动发帖',
    manualLabel: '手动 — 复制并打开',
    postHistory: '发帖历史',
    noHistory: '暂无帖子。',
    platform: '平台',
    status: '状态',
    date: '日期',
    content: '内容',
    posted: '已发布',
    pending: '待处理',
    failed: '失败',
    retry: '重试',
    copySuccess: '已复制！',
    yourChannels: '您的 Buffer 频道',
    slotsUsed: (n: number, max: number) => `已使用 ${max} 个自动发帖配额中的 ${n} 个`,
    slotsFull: (plan: string) => {
      if (plan === 'free')  return '升级到 Basic 获得 1 个自动发帖配额 →'
      if (plan === 'basic') return '升级到 Pro 获得 3 个自动发帖配额 →'
      if (plan === 'pro')   return '升级到 Agency 获得 5 个自动发帖配额 →'
      return ''
    },
    connectBuffer: '通过 Buffer 连接',
    connectBufferSub: '通过一个连接在 Facebook、Instagram、Twitter/X、LinkedIn、TikTok、Pinterest 和 YouTube 上发帖。',
    bufferFreeNote: 'Buffer 免费计划最多支持 3 个频道。在 buffer.com 连接您想要的平台，然后在此处选择哪些平台自动发帖。',
    bufferLimitError: '您的 Buffer 账号处于免费计划（最多 3 个频道）。若需连接更多频道，',
    bufferLimitLink: '升级 Buffer 计划 →',
  },
}

interface SocialConnection {
  id: string
  platform: string
  username?: string
  avatar_url?: string
  connected_at: string
  posted_count: number
  auto_post_enabled: boolean
  connected_via: string
}

interface SocialPost {
  id: string
  platform: string
  content: string
  status: 'pending' | 'posted' | 'failed'
  external_id?: string
  error_message?: string
  posted_at?: string
  created_at: string
  is_scheduled?: boolean
}

export default function SocialPage() {
  const { lang } = useUILang()
  const t = T[lang]
  const searchParams = useSearchParams()

  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [plan, setPlan] = useState<string>('free')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [togglingPlatform, setTogglingPlatform] = useState<string | null>(null)
  const [upgradeNudge, setUpgradeNudge] = useState<string | null>(null)

  // Schedule state
  const [schedule, setSchedule] = useState<PostingSchedule | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    platform: 'facebook', frequency: '1x_week', post_hour: 9,
    timezone: 'America/Toronto', content_type: 'social_media',
    language: 'en', topic: '',
  })
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [connRes, postRes, schedRes] = await Promise.all([
      fetch('/api/social').then(r => r.json()),
      fetch('/api/social/post').then(r => r.json()),
      fetch('/api/schedule').then(r => r.json()),
    ])
    setConnections(connRes.connections ?? [])
    setPlan(connRes.plan ?? 'free')
    setPosts(postRes.posts ?? [])
    const saved: PostingSchedule | undefined = (schedRes.schedules ?? [])[0]
    if (saved) {
      setSchedule(saved)
      setScheduleForm({
        platform: saved.platform, frequency: saved.frequency,
        post_hour: saved.post_hour, timezone: saved.timezone,
        content_type: saved.content_type, language: saved.language,
        topic: saved.topic,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error     = searchParams.get('error')
    if (connected) {
      const names = connected.split(',').map(s => {
        const info = PLATFORM_DISPLAY[s]
        return info ? `${info.icon} ${info.label}` : s.charAt(0).toUpperCase() + s.slice(1)
      }).join(', ')
      setFeedbackMsg({ text: `Connected: ${names}`, ok: true })
      setTimeout(() => setFeedbackMsg(null), 8000)
    } else if (error) {
      const affiliateId = process.env.NEXT_PUBLIC_BUFFER_AFFILIATE_LINK_ID ?? ''
      const bufferBillingUrl = affiliateId
        ? `https://buffer.com/settings/billing?ref=${affiliateId}`
        : 'https://buffer.com/settings/billing'

      const errorMap: Record<string, string> = {
        buffer_not_configured:   'Buffer connection is not configured yet — check back later.',
        buffer_token_failed:     'Could not connect to Buffer — please try again.',
        buffer_channels_failed:  'Connected to Buffer but could not fetch your channels. Try again.',
        buffer_no_channels:      'No supported social channels found in your Buffer account. Add them at buffer.com first.',
        buffer_channel_limit:    '', // handled inline below with link
        buffer_save_failed:      'Connected to Buffer but could not save your connection — please try again or contact support.',
        invalid_state:           'Connection session expired — please try again.',
        unexpected:              'Something went wrong — please try again.',
      }
      if (error === 'buffer_channel_limit') {
        setFeedbackMsg({
          text: `${t.bufferLimitError} ${t.bufferLimitLink}|${bufferBillingUrl}`,
          ok: false,
        })
      } else {
        setFeedbackMsg({ text: errorMap[error] ?? `Connection error: ${error}`, ok: false })
      }
      setTimeout(() => setFeedbackMsg(null), 12000)
    }
  }, [searchParams, t.bufferLimitError, t.bufferLimitLink])

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault()
    setScheduleSaving(true)
    setScheduleMsg('')
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scheduleForm, is_active: schedule?.is_active ?? true }),
      })
      const d = await res.json()
      if (!res.ok) { setScheduleMsg(d.error ?? 'Failed to save'); return }
      setSchedule(d.schedule)
      setScheduleMsg('Schedule saved!')
      setTimeout(() => setScheduleMsg(''), 3000)
    } finally {
      setScheduleSaving(false)
    }
  }

  async function toggleSchedule() {
    if (!schedule) return
    const res = await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: schedule.id, is_active: !schedule.is_active }),
    })
    const d = await res.json()
    if (res.ok) setSchedule(d.schedule)
  }

  async function deleteSchedule() {
    if (!schedule) return
    if (!confirm('Delete this auto-post schedule?')) return
    await fetch('/api/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: schedule.id }),
    })
    setSchedule(null)
    setScheduleForm({ platform: 'facebook', frequency: '1x_week', post_hour: 9, timezone: 'America/Toronto', content_type: 'social_media', language: 'en', topic: '' })
  }

  function nextPostLabel(s: PostingSchedule): string {
    const hourLabel = HOURS.find(h => h.value === s.post_hour)?.label ?? `${s.post_hour}:00`
    const freqLabel = { '1x_day': 'Daily', '3x_week': 'Mon/Wed/Fri', '1x_week': 'Weekly' }[s.frequency] ?? s.frequency
    return `${freqLabel} at ${hourLabel} (${s.timezone})`
  }

  async function toggleAutoPost(platform: string, newValue: boolean) {
    setTogglingPlatform(platform)
    setUpgradeNudge(null)
    try {
      const res = await fetch('/api/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, auto_post_enabled: newValue }),
      })
      const data = await res.json() as { error?: string; limit?: number; plan?: string }
      if (res.ok) {
        setConnections(prev => prev.map(c => c.platform === platform ? { ...c, auto_post_enabled: newValue } : c))
      } else if (data.error === 'slot_limit_exceeded') {
        setUpgradeNudge(platform)
      } else {
        setFeedbackMsg({ text: data.error ?? 'Failed to update', ok: false })
        setTimeout(() => setFeedbackMsg(null), 6000)
      }
    } finally {
      setTogglingPlatform(null)
    }
  }

  async function handleDisconnectBuffer() {
    if (!confirm('Disconnect all Buffer channels? You can reconnect at any time.')) return
    await Promise.all(BUFFER_PLATFORM_KEYS.map(platform =>
      fetch('/api/social', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
    ))
    load()
  }

  async function handleCopyOpen(platform: string, content?: string) {
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopying(platform)
      setTimeout(() => setCopying(null), 2000)
    }
    const url = PLATFORM_DISPLAY[platform]?.url
    if (url) window.open(url, '_blank')
  }

  const statusColor = (s: SocialPost['status']) =>
    s === 'posted' ? 'text-green-600 bg-green-50' :
    s === 'failed' ? 'text-red-600 bg-red-50' :
    'text-yellow-600 bg-yellow-50'

  const statusLabel = (s: SocialPost['status']) =>
    s === 'posted' ? t.posted : s === 'failed' ? t.failed : t.pending

  const bufferChannels = connections.filter(c => c.connected_via === 'buffer')
  const hasBufferConnections = bufferChannels.length > 0
  const slotLimit = (PLANS[plan as keyof typeof PLANS] ?? PLANS.free).autoPostSlots
  const slotsUsed = bufferChannels.filter(c => c.auto_post_enabled).length
  const atSlotLimit = slotsUsed >= slotLimit

  const affiliateId = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BUFFER_AFFILIATE_LINK_ID ?? '')
    : ''
  const bufferBillingUrl = affiliateId
    ? `https://buffer.com/settings/billing?ref=${affiliateId}`
    : 'https://buffer.com/settings/billing'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
      <p className="text-gray-500 mb-6">{t.subtitle}</p>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${feedbackMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedbackMsg.ok ? '✓ ' : '⚠ '}
          {feedbackMsg.text.includes('|') ? (
            <>
              {feedbackMsg.text.split('|')[0]}
              {' '}
              <a href={feedbackMsg.text.split('|')[1]} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                {t.bufferLimitLink}
              </a>
            </>
          ) : feedbackMsg.text}
        </div>
      )}

      {/* ── Buffer Channels Section ── */}
      <div className="mb-10">
        {hasBufferConnections ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.yourChannels}</h2>
                {slotLimit > 0 ? (
                  <p className="text-sm text-gray-400">{t.slotsUsed(slotsUsed, slotLimit)}</p>
                ) : (
                  <p className="text-sm text-gray-400">
                    <a href="/billing" className="text-[#0D7377] hover:underline">{t.slotsFull('free')}</a>
                  </p>
                )}
              </div>
            </div>

            {/* Slot limit upgrade nudge */}
            {atSlotLimit && slotLimit > 0 && plan !== 'agency' && (
              <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
                <span>⚡</span>
                <a href="/billing" className="hover:underline font-medium">{t.slotsFull(plan)}</a>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {bufferChannels.map(conn => {
                const info = PLATFORM_DISPLAY[conn.platform]
                if (!info) return null
                const isToggling = togglingPlatform === conn.platform
                const isEnabled = conn.auto_post_enabled
                const wouldExceedLimit = !isEnabled && atSlotLimit

                return (
                  <div key={conn.platform} className="flex items-center gap-4 px-5 py-4">
                    <div className={`${info.color} w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{info.label}</div>
                      {conn.username && (
                        <div className="text-xs text-gray-400 truncate">@{conn.username}</div>
                      )}
                    </div>

                    {/* Auto-post toggle */}
                    <div className="flex flex-col items-end gap-1">
                      {upgradeNudge === conn.platform && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <a href="/billing" className="hover:underline">{t.slotsFull(plan)}</a>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (wouldExceedLimit) {
                            setUpgradeNudge(conn.platform)
                          } else {
                            setUpgradeNudge(null)
                            toggleAutoPost(conn.platform, !isEnabled)
                          }
                        }}
                        disabled={isToggling}
                        className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          isEnabled
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : wouldExceedLimit
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        } ${isToggling ? 'opacity-50' : ''}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {isToggling ? '…' : isEnabled ? t.autoPosting : t.manualLabel}
                      </button>

                      {!isEnabled && info.url && (
                        <button
                          onClick={() => handleCopyOpen(conn.platform)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                          {copying === conn.platform ? t.copySuccess : 'Copy & Open'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDisconnectBuffer}
                className="text-sm text-red-500 hover:text-red-700 transition"
              >
                {t.disconnectBuffer}
              </button>
            </div>
          </>
        ) : (
          /* Connect via Buffer card */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#0D7377] to-[#026676] rounded-xl flex items-center justify-center text-white text-xl">
                📡
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{t.connectBuffer}</h2>
                <p className="text-sm text-gray-500">{t.connectBufferSub}</p>
              </div>
            </div>

            {/* Platform icons preview */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(PLATFORM_DISPLAY).map(([key, info]) => (
                <div key={key} className={`${info.color} w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs`}>
                  {info.icon}
                </div>
              ))}
            </div>

            {/* Pre-connect note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4 text-xs text-amber-800">
              💡 {t.bufferFreeNote}
            </div>

            <a
              href="/api/auth/buffer/connect"
              className="inline-flex items-center gap-2 bg-[#0D7377] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0a5d61] transition"
            >
              {t.connectBuffer} →
            </a>
          </div>
        )}
      </div>

      {/* ── Auto-Post Schedule ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Auto-Post Schedule</h2>
            <p className="text-sm text-gray-400">Generate and post content automatically on a schedule</p>
          </div>
          {schedule && (
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${schedule.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {schedule.is_active ? '● Active' : '○ Paused'}
              </span>
              <button onClick={toggleSchedule} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition">
                {schedule.is_active ? 'Pause' : 'Resume'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {schedule && (
            <div className="mb-5 flex items-center gap-2 bg-brand-50 text-brand-700 rounded-xl px-4 py-3 text-sm">
              <span>🕐</span>
              <span><strong>Next post:</strong> {nextPostLabel(schedule)}</span>
              {schedule.last_posted_at && (
                <span className="text-brand-500 ml-auto text-xs">Last: {new Date(schedule.last_posted_at).toLocaleDateString()}</span>
              )}
            </div>
          )}

          <form onSubmit={saveSchedule} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Platform</label>
              <select
                value={scheduleForm.platform}
                onChange={e => setScheduleForm(f => ({ ...f, platform: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {Object.entries(PLATFORM_DISPLAY).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Frequency</label>
              <select
                value={scheduleForm.frequency}
                onChange={e => setScheduleForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="1x_day">Every day (1×/day)</option>
                <option value="3x_week">Mon, Wed & Fri (3×/week)</option>
                <option value="1x_week">Once a week (1×/week)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Post time</label>
              <select
                value={scheduleForm.post_hour}
                onChange={e => setScheduleForm(f => ({ ...f, post_hour: parseInt(e.target.value, 10) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Timezone</label>
              <select
                value={scheduleForm.timezone}
                onChange={e => setScheduleForm(f => ({ ...f, timezone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Content type</label>
              <select
                value={scheduleForm.content_type}
                onChange={e => setScheduleForm(f => ({ ...f, content_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="social_media">Social media post</option>
                <option value="ad_copy">Ad copy</option>
                <option value="blog_post">Blog excerpt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Language</label>
              <select
                value={scheduleForm.language}
                onChange={e => setScheduleForm(f => ({ ...f, language: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="es">Español</option>
                <option value="zh">中文</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Topic / niche</label>
              <input
                type="text"
                value={scheduleForm.topic}
                onChange={e => setScheduleForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. restaurant, fashion, tech startup, real estate…"
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={scheduleSaving}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60"
              >
                {scheduleSaving ? 'Saving…' : schedule ? 'Update schedule' : 'Create schedule'}
              </button>
              {schedule && (
                <button
                  type="button"
                  onClick={deleteSchedule}
                  className="text-sm text-red-500 hover:text-red-700 px-3 py-2.5 transition"
                >
                  Delete
                </button>
              )}
              {scheduleMsg && (
                <span className={`text-sm font-medium ${scheduleMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>
                  {scheduleMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Last 5 auto-posts */}
        {posts.filter(p => p.is_scheduled).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Last auto-posts</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {posts.filter(p => p.is_scheduled).slice(0, 5).map(post => (
                <div key={post.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${post.status === 'posted' ? 'bg-green-400' : post.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <p className="text-sm text-gray-600 flex-1 line-clamp-1">{post.content}</p>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post history */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.postHistory}</h2>
      {loading ? (
        <div className="text-gray-400 text-sm">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-400 text-sm py-8 text-center">{t.noHistory}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.platform}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.content}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.status}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {PLATFORM_DISPLAY[post.platform]?.label ?? post.platform}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="line-clamp-2">{post.content}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(post.status)}`}>
                      {statusLabel(post.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
