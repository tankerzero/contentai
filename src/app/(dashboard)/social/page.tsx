'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

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
    subtitle: 'Connect your social accounts to post content directly',
    connected: 'Connected',
    notConnected: 'Not connected',
    connect: 'Connect',
    disconnect: 'Disconnect',
    copyOpen: 'Copy & Open',
    postHistory: 'Post History',
    noHistory: 'No posts yet.',
    platform: 'Platform',
    status: 'Status',
    date: 'Date',
    content: 'Content',
    posted: 'Posted',
    pending: 'Pending',
    failed: 'Failed',
    bufferLink: 'Schedule with Buffer',
    twitterNote: 'Direct posting via API',
    manualNote: 'Manual posting (Copy & Open)',
    connectTwitter: 'Connect Twitter/X',
    retry: 'Retry',
    copySuccess: 'Copied!',
  },
  fr: {
    title: 'Réseaux Sociaux',
    subtitle: 'Connectez vos comptes pour publier directement',
    connected: 'Connecté',
    notConnected: 'Non connecté',
    connect: 'Connecter',
    disconnect: 'Déconnecter',
    copyOpen: 'Copier & Ouvrir',
    postHistory: 'Historique des publications',
    noHistory: 'Aucune publication.',
    platform: 'Plateforme',
    status: 'Statut',
    date: 'Date',
    content: 'Contenu',
    posted: 'Publié',
    pending: 'En attente',
    failed: 'Échoué',
    bufferLink: 'Programmer avec Buffer',
    twitterNote: 'Publication directe via API',
    manualNote: 'Publication manuelle (Copier & Ouvrir)',
    connectTwitter: 'Connecter Twitter/X',
    retry: 'Réessayer',
    copySuccess: 'Copié !',
  },
  ar: {
    title: 'الشبكات الاجتماعية',
    subtitle: 'ربط حساباتك للنشر مباشرة',
    connected: 'متصل',
    notConnected: 'غير متصل',
    connect: 'ربط',
    disconnect: 'قطع الاتصال',
    copyOpen: 'نسخ وفتح',
    postHistory: 'سجل المنشورات',
    noHistory: 'لا توجد منشورات بعد.',
    platform: 'المنصة',
    status: 'الحالة',
    date: 'التاريخ',
    content: 'المحتوى',
    posted: 'منشور',
    pending: 'قيد الانتظار',
    failed: 'فشل',
    bufferLink: 'جدولة مع Buffer',
    twitterNote: 'نشر مباشر عبر API',
    manualNote: 'نشر يدوي (نسخ وفتح)',
    connectTwitter: 'ربط تويتر/X',
    retry: 'إعادة المحاولة',
    copySuccess: 'تم النسخ!',
  },
}

interface SocialConnection {
  id: string
  platform: string
  username?: string
  avatar_url?: string
  connected_at: string
  posted_count: number
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
}

const PLATFORMS = [
  {
    key: 'twitter',
    label: 'Twitter / X',
    icon: '𝕏',
    color: 'bg-black',
    url: 'https://twitter.com',
    method: 'oauth',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'in',
    color: 'bg-blue-600',
    url: 'https://www.linkedin.com/feed/',
    method: 'manual',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-pink-500 to-purple-600',
    url: 'https://www.instagram.com',
    method: 'manual',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'f',
    color: 'bg-blue-700',
    url: 'https://www.facebook.com',
    method: 'manual',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: '♪',
    color: 'bg-black',
    url: 'https://www.tiktok.com/upload',
    method: 'manual',
  },
]

export default function SocialPage() {
  const { lang } = useUILang()
  const uiLang: 'en' | 'fr' | 'ar' = (lang === 'es' || lang === 'zh') ? 'en' : lang
  const t = T[uiLang]

  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)

  // Schedule state
  const [schedule, setSchedule] = useState<PostingSchedule | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    platform: 'twitter', frequency: '1x_week', post_hour: 9,
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
    setScheduleForm({ platform: 'twitter', frequency: '1x_week', post_hour: 9, timezone: 'America/Toronto', content_type: 'social_media', language: 'en', topic: '' })
  }

  function nextPostLabel(s: PostingSchedule): string {
    const hourLabel = HOURS.find(h => h.value === s.post_hour)?.label ?? `${s.post_hour}:00`
    const freqLabel = { '1x_day': 'Daily', '3x_week': 'Mon/Wed/Fri', '1x_week': 'Weekly' }[s.frequency] ?? s.frequency
    return `${freqLabel} at ${hourLabel} (${s.timezone})`
  }

  const connectedMap = new Map(connections.map(c => [c.platform, c]))

  const handleDisconnect = async (platform: string) => {
    await fetch('/api/social', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    load()
  }

  const handleCopyOpen = async (platform: typeof PLATFORMS[0], post?: SocialPost) => {
    const content = post?.content ?? ''
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopying(platform.key)
      setTimeout(() => setCopying(null), 2000)
    }
    window.open(platform.url, '_blank')
  }

  const statusColor = (s: SocialPost['status']) =>
    s === 'posted' ? 'text-green-600 bg-green-50' :
    s === 'failed' ? 'text-red-600 bg-red-50' :
    'text-yellow-600 bg-yellow-50'

  const statusLabel = (s: SocialPost['status']) =>
    s === 'posted' ? t.posted : s === 'failed' ? t.failed : t.pending

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
      <p className="text-gray-500 mb-8">{t.subtitle}</p>

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {PLATFORMS.map(p => {
          const conn = connectedMap.get(p.key)
          const isConnected = !!conn
          return (
            <div key={p.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`${p.color} w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{p.label}</div>
                {isConnected ? (
                  <div className="text-sm text-green-600">@{conn.username} · {conn.posted_count} posts</div>
                ) : (
                  <div className="text-sm text-gray-400">
                    {p.method === 'oauth' ? t.twitterNote : t.manualNote}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                {isConnected ? (
                  <>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t.connected}</span>
                    <button
                      onClick={() => handleDisconnect(p.key)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t.disconnect}
                    </button>
                  </>
                ) : (
                  p.method === 'oauth' ? (
                    <a
                      href="/api/social/twitter"
                      className="text-sm font-medium bg-[#0D7377] text-white px-3 py-1.5 rounded-lg hover:bg-[#0a5d61] transition"
                    >
                      {t.connectTwitter}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCopyOpen(p)}
                      className="text-sm font-medium border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      {copying === p.key ? t.copySuccess : t.copyOpen}
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Buffer link */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center justify-between mb-10">
        <div>
          <div className="font-semibold text-orange-800">Buffer</div>
          <div className="text-sm text-orange-600">{t.bufferLink}</div>
        </div>
        <a
          href="https://buffer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Open Buffer →
        </a>
      </div>

      {/* ── Auto-Post Schedule ───────────────────────────── */}
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
                <option value="twitter">Twitter / X (direct posting)</option>
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
        {posts.filter(p => (p as SocialPost & { is_scheduled?: boolean }).is_scheduled).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Last auto-posts</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {posts.filter(p => (p as SocialPost & { is_scheduled?: boolean }).is_scheduled).slice(0, 5).map(post => (
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
                  <td className="px-4 py-3 capitalize font-medium text-gray-700">{post.platform}</td>
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
