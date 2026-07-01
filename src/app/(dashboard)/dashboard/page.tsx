'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUILang } from '@/contexts/UILanguageContext'
import { createClient } from '@/lib/supabase/client'
import OnboardingWizard from '@/components/OnboardingWizard'

// ── Translations ─────────────────────────────────────────────────────────────

const UI = {
  en: {
    autoHub: {
      title: 'Your content. Automatically posted.',
      titleLocked: 'Auto-posting',
      queue: (n: number) => `${n} post${n !== 1 ? 's' : ''} approved and scheduled`,
      nextFires: 'Next scheduled:',
      noScheduled: 'No posts scheduled yet',
      setupCta: 'Set up your first auto-post in 2 minutes →',
      generateCta: 'Generate & Schedule a Post →',
      connect: 'Connect',
      connected: 'Connected',
      basicUsed: (used: number) => `${used} of 3 auto-posts used this month`,
      basicUpgrade: 'Running low — upgrade to Pro for unlimited auto-posting',
      lockedMsg: 'Auto-posting is available on Basic and above.',
      unlockCta: 'Upgrade to Basic →',
      recentTitle: 'Recent auto-posts',
      statusPosted: 'Posted',
      statusPending: 'Awaiting approval',
      statusFailed: 'Failed',
    },
    quickGen: 'Quick Generate',
    quickGenDesc: 'Generate new content in seconds.',
    quickGenCta: 'New generation →',
    history: 'Content History',
    noGen: 'No generations yet.',
    noGenCta: 'Create your first one →',
    stats: { total: 'Total generations', month: 'This month', plan: 'Plan' },
    welcome: 'Welcome back',
  },
  fr: {
    autoHub: {
      title: 'Votre contenu. Publié automatiquement.',
      titleLocked: 'Publication automatique',
      queue: (n: number) => `${n} publication${n !== 1 ? 's' : ''} approuvée${n !== 1 ? 's' : ''} et planifiée${n !== 1 ? 's' : ''}`,
      nextFires: 'Prochaine planifiée :',
      noScheduled: 'Aucune publication planifiée',
      setupCta: 'Configurer votre première publication en 2 minutes →',
      generateCta: 'Générer & Planifier un post →',
      connect: 'Connecter',
      connected: 'Connecté',
      basicUsed: (used: number) => `${used} sur 3 publications automatiques utilisées ce mois`,
      basicUpgrade: 'Presque épuisé — passez à Pro pour des publications illimitées',
      lockedMsg: 'La publication automatique est disponible à partir du plan Basic.',
      unlockCta: 'Passer à Basic →',
      recentTitle: 'Publications récentes',
      statusPosted: 'Publié',
      statusPending: 'En attente d\'approbation',
      statusFailed: 'Échoué',
    },
    quickGen: 'Génération rapide',
    quickGenDesc: 'Créez du contenu en quelques secondes.',
    quickGenCta: 'Nouvelle génération →',
    history: 'Historique du contenu',
    noGen: 'Aucune génération pour l\'instant.',
    noGenCta: 'Créez votre première →',
    stats: { total: 'Total générations', month: 'Ce mois', plan: 'Forfait' },
    welcome: 'Bon retour',
  },
  ar: {
    autoHub: {
      title: 'محتواك. يُنشر تلقائياً.',
      titleLocked: 'النشر التلقائي',
      queue: (n: number) => `${n} منشور${n !== 1 ? 'ات' : ''} معتمد${n !== 1 ? 'ة' : ''} ومجدول${n !== 1 ? 'ة' : ''}`,
      nextFires: 'الموعد التالي:',
      noScheduled: 'لا توجد منشورات مجدولة بعد',
      setupCta: 'إعداد أول منشور تلقائي في دقيقتين ←',
      generateCta: 'توليد وجدولة منشور ←',
      connect: 'ربط',
      connected: 'مرتبط',
      basicUsed: (used: number) => `${used} من 3 نشرات تلقائية مستخدمة هذا الشهر`,
      basicUpgrade: 'اقتربت من الحد — ترقّ إلى Pro للنشر غير المحدود',
      lockedMsg: 'النشر التلقائي متاح من الخطة Basic فما فوق.',
      unlockCta: 'الترقية إلى Basic ←',
      recentTitle: 'آخر المنشورات التلقائية',
      statusPosted: 'نُشر',
      statusPending: 'بانتظار الموافقة',
      statusFailed: 'فشل',
    },
    quickGen: 'توليد سريع',
    quickGenDesc: 'أنشئ محتواك في ثوانٍ.',
    quickGenCta: 'توليد جديد ←',
    history: 'سجل المحتوى',
    noGen: 'لا توليدات بعد.',
    noGenCta: 'أنشئ أول توليد →',
    stats: { total: 'إجمالي التوليدات', month: 'هذا الشهر', plan: 'الخطة' },
    welcome: 'أهلاً بعودتك',
  },
  es: {
    autoHub: {
      title: 'Tu contenido. Publicado automáticamente.',
      titleLocked: 'Publicación automática',
      queue: (n: number) => `${n} publicación${n !== 1 ? 'es' : ''} aprobada${n !== 1 ? 's' : ''} y programada${n !== 1 ? 's' : ''}`,
      nextFires: 'Próxima programada:',
      noScheduled: 'No hay publicaciones programadas',
      setupCta: 'Configura tu primera publicación en 2 minutos →',
      generateCta: 'Generar y programar un post →',
      connect: 'Conectar',
      connected: 'Conectado',
      basicUsed: (used: number) => `${used} de 3 publicaciones automáticas usadas este mes`,
      basicUpgrade: 'Casi al límite — actualiza a Pro para publicaciones ilimitadas',
      lockedMsg: 'La publicación automática está disponible en Basic y superiores.',
      unlockCta: 'Actualizar a Basic →',
      recentTitle: 'Publicaciones recientes',
      statusPosted: 'Publicado',
      statusPending: 'Pendiente de aprobación',
      statusFailed: 'Fallido',
    },
    quickGen: 'Generación rápida',
    quickGenDesc: 'Genera contenido en segundos.',
    quickGenCta: 'Nueva generación →',
    history: 'Historial de contenido',
    noGen: 'Sin generaciones aún.',
    noGenCta: 'Crea la primera →',
    stats: { total: 'Total generaciones', month: 'Este mes', plan: 'Plan' },
    welcome: 'Bienvenido de nuevo',
  },
  zh: {
    autoHub: {
      title: '您的内容。自动发布。',
      titleLocked: '自动发布',
      queue: (n: number) => `${n} 篇帖子已批准并计划发布`,
      nextFires: '下次计划:',
      noScheduled: '尚无计划帖子',
      setupCta: '2分钟内设置第一篇自动帖子 →',
      generateCta: '生成并安排发布 →',
      connect: '连接',
      connected: '已连接',
      basicUsed: (used: number) => `本月已使用 ${used}/3 次自动发布`,
      basicUpgrade: '快到限制了 — 升级到 Pro 享受无限自动发布',
      lockedMsg: '自动发布功能需要 Basic 及以上套餐。',
      unlockCta: '升级到 Basic →',
      recentTitle: '最近自动发布',
      statusPosted: '已发布',
      statusPending: '待审批',
      statusFailed: '失败',
    },
    quickGen: '快速生成',
    quickGenDesc: '几秒内生成内容。',
    quickGenCta: '新建生成 →',
    history: '内容历史',
    noGen: '暂无生成记录。',
    noGenCta: '创建第一篇 →',
    stats: { total: '总生成数', month: '本月', plan: '套餐' },
    welcome: '欢迎回来',
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Generation {
  id: string
  content_type: string
  topic: string
  created_at: string
}

interface Profile {
  plan: string
  auto_posts_this_month: number
  auto_posts_reset_at: string | null
  onboarding_completed: boolean
  auto_approve_mode: boolean
}

interface SocialConnection {
  platform: string
  username: string
}

interface MarketingPost {
  id: string
  platform: string
  content: string
  status: string
  approval_status: string
  scheduled_for: string | null
  posted_at: string | null
}

// ── Platform status helpers ───────────────────────────────────────────────────

const PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram']

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏', linkedin: '💼', facebook: '👍', instagram: '📷',
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter/X', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [monthCount, setMonthCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [recentPosts, setRecentPosts] = useState<MarketingPost[]>([])
  const [scheduledCount, setScheduledCount] = useState(0)
  const [nextScheduled, setNextScheduled] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { data: gens },
        { count: total },
        { count: month },
        { data: prof },
        { data: conns },
        { data: posts },
        { count: scheduled },
        { data: nextPost },
      ] = await Promise.all([
        supabase.from('generations').select('id, content_type, topic, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('generations').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', startOfMonth),
        supabase.from('profiles')
          .select('plan, auto_posts_this_month, auto_posts_reset_at, onboarding_completed, auto_approve_mode')
          .eq('id', user.id).single(),
        supabase.from('social_connections').select('platform, username').eq('user_id', user.id),
        supabase.from('marketing_posts')
          .select('id, platform, content, status, approval_status, scheduled_for, posted_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('marketing_posts').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('approval_status', 'approved').eq('status', 'draft'),
        supabase.from('marketing_posts')
          .select('scheduled_for').eq('user_id', user.id)
          .eq('approval_status', 'approved').eq('status', 'draft')
          .order('scheduled_for', { ascending: true }).limit(1),
      ])

      setGenerations((gens as Generation[]) ?? [])
      setTotalCount(total ?? 0)
      setMonthCount(month ?? 0)
      const p = prof as Profile | null
      setProfile(p)
      setConnections((conns as SocialConnection[]) ?? [])
      setRecentPosts((posts as MarketingPost[]) ?? [])
      setScheduledCount(scheduled ?? 0)
      setNextScheduled((nextPost?.[0] as { scheduled_for?: string } | undefined)?.scheduled_for ?? null)
      setLoading(false)
      // Show wizard for paid users who haven't completed onboarding
      if (p && p.plan !== 'free' && !p.onboarding_completed) {
        setShowWizard(true)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-40" />
        <div className="h-40 bg-gray-50 rounded-2xl" />
        <div className="h-24 bg-gray-50 rounded-xl" />
      </div>
    )
  }

  const plan = profile?.plan ?? 'free'
  const isPaid = plan !== 'free'
  const isBasic = plan === 'basic'
  const isPro = plan === 'pro' || plan === 'agency' || plan === 'unlimited'
  const connectedPlatforms = new Set(connections.map(c => c.platform.toLowerCase()))
  const autoPostsUsed = profile?.auto_posts_this_month ?? 0

  function statusBadge(post: MarketingPost) {
    if (post.status === 'posted') {
      return <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{ui.autoHub.statusPosted} ✅</span>
    }
    if (post.approval_status === 'pending' || post.status === 'draft') {
      return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{ui.autoHub.statusPending} ⏳</span>
    }
    return <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{ui.autoHub.statusFailed} ❌</span>
  }

  return (
    <>
    {showWizard && (
      <OnboardingWizard
        plan={plan}
        onboardingCompleted={profile?.onboarding_completed ?? false}
        onComplete={() => { setShowWizard(false); setProfile(p => p ? { ...p, onboarding_completed: true } : p) }}
      />
    )}
    <div className={`p-6 max-w-4xl space-y-6 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Auto-Post Hub ──────────────────────────────── */}
      <section className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {/* Header band */}
        <div className="bg-[#026676] px-6 py-4">
          <h2 className="text-white font-bold text-lg">
            {isPaid ? ui.autoHub.title : ui.autoHub.titleLocked}
          </h2>
        </div>

        {/* Free locked state */}
        {!isPaid && (
          <div className="bg-white px-6 py-8 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-gray-600 mb-4 text-sm">{ui.autoHub.lockedMsg}</p>
            <Link href="/billing" className="inline-block bg-[#026676] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#024f5c] transition-colors">
              {ui.autoHub.unlockCta}
            </Link>
          </div>
        )}

        {/* Paid state */}
        {isPaid && (
          <div className="bg-white px-6 py-5 space-y-5">
            {/* Queue status */}
            {scheduledCount === 0 ? (
              <div className="flex items-center justify-between py-3 bg-gray-50 px-4 rounded-xl">
                <span className="text-sm text-gray-500">{ui.autoHub.noScheduled}</span>
                <Link href="/generate" className="text-sm font-medium text-[#026676] hover:underline">
                  {ui.autoHub.setupCta}
                </Link>
              </div>
            ) : (
              <div className="bg-brand-50 px-4 py-3 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-brand-700">{ui.autoHub.queue(scheduledCount)}</span>
                {nextScheduled && (
                  <span className="text-xs text-brand-600">
                    {ui.autoHub.nextFires} {new Date(nextScheduled).toLocaleString(lang === 'fr' ? 'fr-CA' : lang === 'ar' ? 'ar' : lang === 'zh' ? 'zh-CN' : lang === 'es' ? 'es' : 'en-CA', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Platform status */}
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const isConnected = connectedPlatforms.has(p)
                return (
                  <div key={p} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span>{PLATFORM_ICONS[p]}</span>
                    <span>{PLATFORM_LABELS[p]}</span>
                    {isConnected
                      ? <span>✓</span>
                      : (
                        <Link href="/social" className="text-brand-600 hover:underline">
                          {ui.autoHub.connect}
                        </Link>
                      )
                    }
                  </div>
                )
              })}
            </div>

            {/* Basic plan progress */}
            {isBasic && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{ui.autoHub.basicUsed(autoPostsUsed)}</span>
                  {autoPostsUsed >= 2 && (
                    <Link href="/billing" className="text-xs text-amber-600 font-medium hover:underline">{ui.autoHub.basicUpgrade}</Link>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${autoPostsUsed >= 3 ? 'bg-red-500' : autoPostsUsed >= 2 ? 'bg-amber-500' : 'bg-brand-600'}`}
                    style={{ width: `${Math.min(100, (autoPostsUsed / 3) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent auto-posts */}
            {recentPosts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{ui.autoHub.recentTitle}</p>
                <div className="space-y-2">
                  {recentPosts.map(post => (
                    <div key={post.id} className={`flex items-center justify-between gap-3 py-2.5 px-3 bg-gray-50 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-base">{PLATFORM_ICONS[post.platform.toLowerCase()] ?? '📄'}</span>
                        <span className="text-sm text-gray-700 truncate">{post.content.slice(0, 60)}{post.content.length > 60 ? '…' : ''}</span>
                      </div>
                      {statusBadge(post)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main CTA */}
            <Link
              href="/generate"
              className="block text-center bg-[#026676] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#024f5c] transition-colors"
            >
              {isPro ? ui.autoHub.generateCta : ui.autoHub.setupCta}
            </Link>
          </div>
        )}
      </section>

      {/* ── Stats row ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={ui.stats.total} value={totalCount} />
        <StatCard label={ui.stats.month} value={monthCount} />
        <StatCard label={ui.stats.plan} value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
      </div>

      {/* ── Quick Generate ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-1">{ui.quickGen}</h2>
        <p className="text-brand-100 text-sm mb-4">{ui.quickGenDesc}</p>
        <Link
          href="/generate"
          className="inline-block bg-white text-brand-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          {ui.quickGenCta}
        </Link>
      </div>

      {/* ── Auto-approve mode (Pro/Agency) ─────────────── */}
      {isPro && (
        <AutoApproveToggle initialValue={profile?.auto_approve_mode ?? false} isRTL={isRTL} lang={lang} />
      )}

      {/* ── Content History ────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{ui.history}</h2>
        {generations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">{ui.noGen}</p>
            <Link href="/generate" className="text-brand-600 text-sm font-medium hover:underline mt-2 inline-block">
              {ui.noGenCta}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map(g => (
              <div key={g.id} className={`bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                    {g.content_type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{g.topic}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-3">
                  {new Date(g.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
    </>
  )
}

function AutoApproveToggle({ initialValue, isRTL, lang }: { initialValue: boolean; isRTL: boolean; lang: string }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const labels = {
    en: { title: 'Auto-approve mode', desc: 'Posts go live automatically without your review.', warn: 'Posts will publish without email confirmation.' },
    fr: { title: 'Mode auto-approbation', desc: 'Les posts sont publiés automatiquement sans votre révision.', warn: 'Les posts seront publiés sans confirmation par email.' },
    ar: { title: 'وضع الموافقة التلقائية', desc: 'تُنشر المنشورات تلقائياً دون مراجعتك.', warn: 'ستُنشر المنشورات بدون تأكيد عبر البريد الإلكتروني.' },
    es: { title: 'Modo auto-aprobación', desc: 'Los posts se publican automáticamente sin tu revisión.', warn: 'Los posts se publicarán sin confirmación por email.' },
    zh: { title: '自动批准模式', desc: '帖子将自动发布，无需您审核。', warn: '帖子将在无需邮件确认的情况下发布。' },
  }
  const l = labels[lang as keyof typeof labels] ?? labels.en

  async function toggle() {
    setSaving(true)
    const next = !enabled
    await fetch('/api/profile/auto-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
    setEnabled(next)
    setSaving(false)
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`${isRTL ? 'text-right' : ''}`}>
        <p className="font-medium text-gray-900 text-sm">{l.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{l.desc}</p>
        {enabled && <p className="text-xs text-amber-600 mt-1">⚠️ {l.warn}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${enabled ? 'bg-[#026676]' : 'bg-gray-200'} disabled:opacity-50`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
