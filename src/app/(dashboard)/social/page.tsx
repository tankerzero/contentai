'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

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

  const load = useCallback(async () => {
    setLoading(true)
    const [connRes, postRes] = await Promise.all([
      fetch('/api/social').then(r => r.json()),
      fetch('/api/social/post').then(r => r.json()),
    ])
    setConnections(connRes.connections ?? [])
    setPosts(postRes.posts ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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
