'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUILang } from '@/contexts/UILanguageContext'

// ── Types ────────────────────────────────────────────────────────────────────

interface Generation {
  id: string
  content_type: string
  topic: string
  tone: string
  language: string
  content: string
  is_favorite: boolean
  source: string
  platform: string | null
  created_at: string
}

interface BrandProfileRow {
  id: string
  profile_name: string
  company_name: string | null
  industry: string | null
  values: string | null
  writing_style: string | null
  tone_examples: string | null
  is_default: boolean
  updated_at: string
}

type Tab = 'content' | 'calendar' | 'analytics' | 'export' | 'brand'
type ViewMode = 'grid' | 'list'
type DateFilter = 'all' | '7d' | '30d' | '90d'

// ── Colors ───────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  blog_post: 'bg-brand-500',
  social_media: 'bg-pink-400',
  email: 'bg-blue-400',
  product_description: 'bg-orange-400',
  ad_copy: 'bg-purple-400',
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-500',
  LinkedIn: 'bg-blue-600',
  'Twitter / X': 'bg-gray-800',
  Facebook: 'bg-indigo-600',
  TikTok: 'bg-black',
}

const TYPE_DOT_COLOR = (type: string, platform: string | null): string => {
  if (platform && PLATFORM_COLORS[platform]) return PLATFORM_COLORS[platform]
  return TYPE_COLORS[type] ?? 'bg-gray-400'
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const UI = {
  en: {
    tabs: { content: 'My Content', calendar: 'Calendar', analytics: 'Analytics', export: 'Export', brand: 'Brand Profiles' },
    search: 'Search content…',
    filters: { all: 'All', blog: 'Blog', social: 'Social', email: 'Email', product: 'Product', ad: 'Ad', favs: '★ Favorites' },
    langs: { all: 'All', en: '🇬🇧 EN', fr: '🇫🇷 FR', ar: '🇸🇦 AR' },
    dates: { all: 'All time', '7d': 'Last 7d', '30d': 'Last 30d', '90d': 'Last 90d' },
    view: { grid: 'Grid', list: 'List' },
    actions: { copy: 'Copy', copied: '✓', delete: 'Delete', setDefault: 'Set default', default: 'Default' },
    bulk: { select: 'Select all', deselect: 'Deselect', deleteSelected: 'Delete selected', exportSelected: 'Export selected' },
    empty: 'No content found.', emptyFav: 'No favorites yet.',
    calendar: { title: 'Calendar', noContent: 'No content on this day.' },
    analytics: {
      title: 'Analytics', credits: 'Credits used', creditsOf: 'of', thisMonth: 'This month',
      total: 'Total', favorites: 'Favorites', topType: 'Top type', topLang: 'Top language',
      topPlatform: 'Top platform', chart: 'Last 30 days',
    },
    export: {
      title: 'Export', subtitle: 'Download your content as CSV.',
      btnAll: 'Export all as CSV', btnSelected: 'Export selected as CSV',
      proPlan: 'Pro plan required', proNote: 'Upgrade to Pro or Agency to export your content.',
      columns: 'Columns: date, type, platform, language, topic, content',
    },
    brand: {
      title: 'Brand Profiles', addBtn: 'New profile',
      noProfiles: 'No brand profiles yet.',
      proLock: 'Upgrade to Pro for multiple profiles',
      industry: 'Industry', style: 'Writing style',
      editBtn: 'Edit', deleteBtn: 'Delete',
      profileName: 'Profile name', save: 'Save', saving: 'Saving…', saved: '✓ Saved',
      cancel: 'Cancel', newProfile: 'New profile',
    },
    loading: 'Loading…',
  },
  fr: {
    tabs: { content: 'Mon Contenu', calendar: 'Calendrier', analytics: 'Statistiques', export: 'Export', brand: 'Profils Marque' },
    search: 'Rechercher…',
    filters: { all: 'Tout', blog: 'Blog', social: 'Social', email: 'Email', product: 'Produit', ad: 'Pub', favs: '★ Favoris' },
    langs: { all: 'Tout', en: '🇬🇧 EN', fr: '🇫🇷 FR', ar: '🇸🇦 AR' },
    dates: { all: 'Tout', '7d': '7 derniers j', '30d': '30 derniers j', '90d': '90 derniers j' },
    view: { grid: 'Grille', list: 'Liste' },
    actions: { copy: 'Copier', copied: '✓', delete: 'Supprimer', setDefault: 'Définir par défaut', default: 'Par défaut' },
    bulk: { select: 'Tout sélect.', deselect: 'Désélect.', deleteSelected: 'Supprimer sélect.', exportSelected: 'Exporter sélect.' },
    empty: 'Aucun contenu.', emptyFav: 'Aucun favori.',
    calendar: { title: 'Calendrier', noContent: 'Aucun contenu ce jour.' },
    analytics: {
      title: 'Statistiques', credits: 'Crédits utilisés', creditsOf: 'sur', thisMonth: 'Ce mois',
      total: 'Total', favorites: 'Favoris', topType: 'Type principal', topLang: 'Langue principale',
      topPlatform: 'Plateforme principale', chart: '30 derniers jours',
    },
    export: {
      title: 'Export', subtitle: 'Téléchargez votre contenu en CSV.',
      btnAll: 'Exporter tout en CSV', btnSelected: 'Exporter sélect. en CSV',
      proPlan: 'Forfait Pro requis', proNote: 'Passez au Pro ou Agency pour exporter.',
      columns: 'Colonnes : date, type, plateforme, langue, sujet, contenu',
    },
    brand: {
      title: 'Profils de Marque', addBtn: 'Nouveau profil',
      noProfiles: 'Aucun profil de marque.',
      proLock: 'Passez au Pro pour plusieurs profils',
      industry: 'Secteur', style: 'Style',
      editBtn: 'Modifier', deleteBtn: 'Supprimer',
      profileName: 'Nom du profil', save: 'Enregistrer', saving: 'Enreg.…', saved: '✓ Enregistré',
      cancel: 'Annuler', newProfile: 'Nouveau profil',
    },
    loading: 'Chargement…',
  },
  ar: {
    tabs: { content: 'محتواي', calendar: 'التقويم', analytics: 'الإحصائيات', export: 'تصدير', brand: 'ملفات العلامة' },
    search: 'بحث…',
    filters: { all: 'الكل', blog: 'مقال', social: 'اجتماعي', email: 'بريد', product: 'منتج', ad: 'إعلان', favs: '★ المفضلة' },
    langs: { all: 'الكل', en: '🇬🇧 EN', fr: '🇫🇷 FR', ar: '🇸🇦 AR' },
    dates: { all: 'الكل', '7d': 'آخر 7 أيام', '30d': 'آخر 30 يوم', '90d': 'آخر 90 يوم' },
    view: { grid: 'شبكة', list: 'قائمة' },
    actions: { copy: 'نسخ', copied: '✓', delete: 'حذف', setDefault: 'تعيين افتراضي', default: 'افتراضي' },
    bulk: { select: 'تحديد الكل', deselect: 'إلغاء التحديد', deleteSelected: 'حذف المحدد', exportSelected: 'تصدير المحدد' },
    empty: 'لا يوجد محتوى.', emptyFav: 'لا مفضلات بعد.',
    calendar: { title: 'التقويم', noContent: 'لا محتوى في هذا اليوم.' },
    analytics: {
      title: 'الإحصائيات', credits: 'الاعتمادات المستخدمة', creditsOf: 'من', thisMonth: 'هذا الشهر',
      total: 'الإجمالي', favorites: 'المفضلة', topType: 'النوع الأكثر', topLang: 'اللغة الأكثر',
      topPlatform: 'المنصة الأكثر', chart: 'آخر 30 يوم',
    },
    export: {
      title: 'تصدير', subtitle: 'حمّل محتواك كملف CSV.',
      btnAll: 'تصدير الكل CSV', btnSelected: 'تصدير المحدد CSV',
      proPlan: 'يتطلب خطة Pro', proNote: 'انتقل إلى Pro أو Agency للتصدير.',
      columns: 'الأعمدة: التاريخ، النوع، المنصة، اللغة، الموضوع، المحتوى',
    },
    brand: {
      title: 'ملفات العلامة التجارية', addBtn: 'ملف جديد',
      noProfiles: 'لا توجد ملفات علامة تجارية.',
      proLock: 'انتقل إلى Pro لملفات متعددة',
      industry: 'القطاع', style: 'الأسلوب',
      editBtn: 'تعديل', deleteBtn: 'حذف',
      profileName: 'اسم الملف', save: 'حفظ', saving: 'جارٍ الحفظ…', saved: '✓ محفوظ',
      cancel: 'إلغاء', newProfile: 'ملف جديد',
    },
    loading: 'جارٍ التحميل…',
  },
} as const

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_NAMES_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

const DAY_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_NAMES_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const DAY_NAMES_AR = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت']

// ── Helpers ──────────────────────────────────────────────────────────────────

function exportCSV(rows: Generation[]) {
  const header = ['date', 'type', 'platform', 'language', 'topic', 'content']
  const escape = (s: string) => `"${(s ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  const lines = [
    header.join(','),
    ...rows.map(g => [
      new Date(g.created_at).toISOString().slice(0, 10),
      g.content_type,
      g.platform ?? '',
      g.language,
      escape(g.topic),
      escape(g.content),
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contentai-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function topEntry(map: Map<string, number>): string {
  let best = '', count = 0
  map.forEach((v, k) => { if (v > count) { count = v; best = k } })
  return best
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ContentPage() {
  const { lang, isRTL } = useUILang()
  const uiLang: 'en' | 'fr' | 'ar' = (lang === 'es' || lang === 'zh') ? 'en' : lang
  const ui = UI[uiLang]
  const dir = isRTL ? 'rtl' : 'ltr'

  // Data
  const [generations, setGenerations] = useState<Generation[]>([])
  const [brandProfiles, setBrandProfiles] = useState<BrandProfileRow[]>([])
  const [plan, setPlan] = useState<string>('free')
  const [genLimit, setGenLimit] = useState(5)
  const [loading, setLoading] = useState(true)

  // UI state
  const [tab, setTab] = useState<Tab>('content')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [langFilter, setLangFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [favsOnly, setFavsOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Calendar
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calDay, setCalDay] = useState<number | null>(null)

  // Brand profile form
  const [editingProfile, setEditingProfile] = useState<Partial<BrandProfileRow> | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: gens }, { data: profileData }, { data: brands }] = await Promise.all([
      supabase
        .from('generations')
        .select('id, content_type, topic, tone, language, content, is_favorite, source, platform, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false }),
    ])

    const planId = (profileData?.plan ?? 'free') as string
    const LIMITS: Record<string, number> = { free: 5, basic: 30, pro: 100, agency: 500 }
    setGenerations((gens ?? []) as Generation[])
    setPlan(planId)
    setGenLimit(LIMITS[planId] ?? 5)
    setBrandProfiles((brands ?? []) as BrandProfileRow[])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Filtered content ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = generations
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(g => g.topic.toLowerCase().includes(q) || g.content.toLowerCase().includes(q))
    }
    if (typeFilter !== 'all') {
      const MAP: Record<string, string> = { blog: 'blog_post', social: 'social_media', email: 'email', product: 'product_description', ad: 'ad_copy' }
      list = list.filter(g => g.content_type === (MAP[typeFilter] ?? typeFilter))
    }
    if (langFilter !== 'all') list = list.filter(g => g.language === langFilter)
    if (favsOnly) list = list.filter(g => g.is_favorite)
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter)
      const cutoff = new Date(Date.now() - days * 86400000).toISOString()
      list = list.filter(g => g.created_at >= cutoff)
    }
    return list
  }, [generations, search, typeFilter, langFilter, favsOnly, dateFilter])

  // ── Bulk actions ──────────────────────────────────────────────────────────

  async function deleteSelected() {
    if (!selected.size) return
    const ids = Array.from(selected)
    await fetch('/api/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setGenerations(prev => prev.filter(g => !selected.has(g.id)))
    setSelected(new Set())
  }

  async function deleteSingle(id: string) {
    await fetch('/api/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setGenerations(prev => prev.filter(g => g.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function toggleFavorite(g: Generation) {
    const next = !g.is_favorite
    setGenerations(prev => prev.map(x => x.id === g.id ? { ...x, is_favorite: next } : x))
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, is_favorite: next }),
    })
  }

  async function copyItem(g: Generation) {
    await navigator.clipboard.writeText(g.content)
    setCopiedId(g.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(g => g.id)))
    }
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────

  const gensByDate = useMemo(() => {
    const map = new Map<string, Generation[]>()
    generations.forEach(g => {
      const key = g.created_at.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(g)
    })
    return map
  }, [generations])

  const calDays = useMemo(() => getMonthDays(calYear, calMonth), [calYear, calMonth])

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setCalDay(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setCalDay(null)
  }

  const MONTH_NAMES = lang === 'ar' ? MONTH_NAMES_AR : lang === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN
  const DAY_NAMES   = lang === 'ar' ? DAY_NAMES_AR   : lang === 'fr' ? DAY_NAMES_FR   : DAY_NAMES_EN

  // ── Analytics helpers ─────────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonth = generations.filter(g => g.created_at >= startOfMonth).length
    const favorites = generations.filter(g => g.is_favorite).length

    const typeMap = new Map<string, number>()
    const langMap = new Map<string, number>()
    const platMap = new Map<string, number>()

    generations.forEach(g => {
      typeMap.set(g.content_type, (typeMap.get(g.content_type) ?? 0) + 1)
      langMap.set(g.language,     (langMap.get(g.language)     ?? 0) + 1)
      if (g.platform) platMap.set(g.platform, (platMap.get(g.platform) ?? 0) + 1)
    })

    // 30-day daily chart
    const days30: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      days30.push({ date: key, count: gensByDate.get(key)?.length ?? 0 })
    }
    const maxCount = Math.max(...days30.map(d => d.count), 1)

    return { thisMonth, favorites, typeMap, langMap, platMap, days30, maxCount }
  }, [generations, gensByDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Brand profile handlers ────────────────────────────────────────────────

  async function saveBrandProfile() {
    if (!editingProfile) return
    setSavingProfile(true)
    setSavedProfile(false)
    await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProfile),
    })
    setSavedProfile(true)
    setSavingProfile(false)
    await loadAll()
    setTimeout(() => { setEditingProfile(null); setSavedProfile(false) }, 1000)
  }

  async function deleteBrandProfile(id: string) {
    await fetch('/api/brand', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadAll()
  }

  async function setDefaultProfile(id: string) {
    await fetch('/api/brand', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadAll()
  }

  const canAddProfile = plan === 'pro' || plan === 'agency'

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`p-8 flex items-center gap-3 text-gray-400 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        {ui.loading}
      </div>
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'content',   label: ui.tabs.content },
    { id: 'calendar',  label: ui.tabs.calendar },
    { id: 'analytics', label: ui.tabs.analytics },
    { id: 'export',    label: ui.tabs.export },
    { id: 'brand',     label: ui.tabs.brand },
  ]

  return (
    <div className={`p-6 max-w-7xl ${isRTL ? 'font-arabic' : ''}`} dir={dir}>

      {/* Tab bar */}
      <div className={`flex gap-1 mb-7 border-b border-gray-100 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MY CONTENT TAB ──────────────────────────────────────────── */}
      {tab === 'content' && (
        <div>
          {/* Search + view toggle */}
          <div className={`flex items-center gap-3 mb-5 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative flex-1 min-w-48">
              <span className={`absolute top-2.5 text-gray-300 text-sm ${isRTL ? 'right-3' : 'left-3'}`}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={ui.search}
                className={`w-full border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white ${isRTL ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'}`}
              />
            </div>
            <div className={`flex gap-1 bg-gray-100 rounded-lg p-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {(['grid', 'list'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}
                >
                  {v === 'grid' ? '⊞' : '≡'} {ui.view[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className={`flex flex-wrap gap-2 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {[
              { key: 'all', label: ui.filters.all }, { key: 'blog', label: ui.filters.blog },
              { key: 'social', label: ui.filters.social }, { key: 'email', label: ui.filters.email },
              { key: 'product', label: ui.filters.product }, { key: 'ad', label: ui.filters.ad },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === f.key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px bg-gray-200 self-stretch" />
            {(['all', 'en', 'fr', 'ar'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLangFilter(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${langFilter === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {ui.langs[l]}
              </button>
            ))}
            <div className="w-px bg-gray-200 self-stretch" />
            {(['all', '7d', '30d', '90d'] as DateFilter[]).map(d => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${dateFilter === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {ui.dates[d]}
              </button>
            ))}
            <div className="w-px bg-gray-200 self-stretch" />
            <button
              onClick={() => setFavsOnly(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${favsOnly ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {ui.filters.favs}
            </button>
          </div>

          {/* Bulk actions bar */}
          {filtered.length > 0 && (
            <div className={`flex items-center gap-3 mb-4 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button onClick={selectAll} className="text-brand-600 hover:text-brand-700 font-medium">
                {selected.size === filtered.length && selected.size > 0 ? ui.bulk.deselect : ui.bulk.select}
              </button>
              {selected.size > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">{selected.size} selected</span>
                  <button
                    onClick={deleteSelected}
                    className="text-red-500 hover:text-red-600 font-medium"
                  >
                    {ui.bulk.deleteSelected}
                  </button>
                  {(plan === 'pro' || plan === 'agency') && (
                    <button
                      onClick={() => exportCSV(filtered.filter(g => selected.has(g.id)))}
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {ui.bulk.exportSelected}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Content grid/list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">{favsOnly ? ui.emptyFav : ui.empty}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(g => (
                <ContentCard
                  key={g.id}
                  g={g}
                  isSelected={selected.has(g.id)}
                  copiedId={copiedId}
                  onSelect={() => toggleSelect(g.id)}
                  onCopy={() => copyItem(g)}
                  onFav={() => toggleFavorite(g)}
                  onDelete={() => deleteSingle(g.id)}
                  isRTL={isRTL}
                  actions={ui.actions}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(g => (
                <ContentRow
                  key={g.id}
                  g={g}
                  isSelected={selected.has(g.id)}
                  copiedId={copiedId}
                  onSelect={() => toggleSelect(g.id)}
                  onCopy={() => copyItem(g)}
                  onFav={() => toggleFavorite(g)}
                  onDelete={() => deleteSingle(g.id)}
                  isRTL={isRTL}
                  actions={ui.actions}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR TAB ────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div>
          {/* Month nav */}
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 text-sm">←</button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 text-sm">→</button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayGens = gensByDate.get(dateKey) ?? []
              const isToday = dateKey === new Date().toISOString().slice(0, 10)
              const isSelected = calDay === day

              return (
                <button
                  key={idx}
                  onClick={() => setCalDay(isSelected ? null : day)}
                  className={`min-h-16 p-1.5 rounded-xl border text-left transition-colors ${
                    isSelected ? 'border-brand-500 bg-brand-50' :
                    isToday ? 'border-brand-200 bg-brand-50/30' :
                    'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-brand-700' : 'text-gray-500'}`}>
                    {day}
                  </span>
                  <div className={`flex flex-wrap gap-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {dayGens.slice(0, 4).map((g, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${TYPE_DOT_COLOR(g.content_type, g.platform)}`}
                        title={g.topic}
                      />
                    ))}
                    {dayGens.length > 4 && (
                      <span className="text-gray-400" style={{ fontSize: '8px' }}>+{dayGens.length - 4}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day detail panel */}
          {calDay !== null && (() => {
            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(calDay).padStart(2, '0')}`
            const dayGens = gensByDate.get(dateKey) ?? []
            return (
              <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">
                  {MONTH_NAMES[calMonth]} {calDay}, {calYear}
                </h3>
                {dayGens.length === 0 ? (
                  <p className="text-gray-400 text-sm">{ui.calendar.noContent}</p>
                ) : (
                  <div className="space-y-3">
                    {dayGens.map(g => (
                      <div key={g.id} className={`flex items-start gap-3 p-3 bg-gray-50 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${TYPE_DOT_COLOR(g.content_type, g.platform)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-gray-700 truncate ${isRTL && g.language === 'ar' ? 'text-right font-arabic' : ''}`}>{g.topic}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{g.content_type.replace('_', ' ')} {g.platform ? `· ${g.platform}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── ANALYTICS TAB ───────────────────────────────────────────── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Credits progress */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{ui.analytics.credits}</h3>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (analytics.thisMonth / genLimit) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 shrink-0">
                {analytics.thisMonth} {ui.analytics.creditsOf} {genLimit}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {ui.analytics.thisMonth} · {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: ui.analytics.total,    value: generations.length },
              { label: ui.analytics.thisMonth, value: analytics.thisMonth },
              { label: ui.analytics.favorites, value: analytics.favorites },
              { label: ui.analytics.topType,   value: (topEntry(analytics.typeMap) || '—').replace('_', ' ') },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Platform + language breakdown */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{ui.analytics.topLang}</h3>
              {(['en', 'fr', 'ar'] as const).map(l => {
                const count = analytics.langMap.get(l) ?? 0
                const pct = generations.length ? Math.round((count / generations.length) * 100) : 0
                const flags: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦' }
                return (
                  <div key={l} className={`flex items-center gap-3 mb-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm w-6">{flags[l]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{ui.analytics.topType}</h3>
              {['blog_post', 'social_media', 'email', 'product_description', 'ad_copy'].map(t => {
                const count = analytics.typeMap.get(t) ?? 0
                const pct = generations.length ? Math.round((count / generations.length) * 100) : 0
                return (
                  <div key={t} className={`flex items-center gap-3 mb-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_COLORS[t] ?? 'bg-gray-300'}`} />
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-full rounded-full ${TYPE_COLORS[t] ?? 'bg-gray-300'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 30-day bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{ui.analytics.chart}</h3>
            <div className="flex items-end gap-1 h-24">
              {analytics.days30.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-brand-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity min-h-0.5"
                  style={{ height: `${Math.max(2, (d.count / analytics.maxCount) * 96)}px` }}
                  title={`${d.date}: ${d.count}`}
                />
              ))}
            </div>
            <div className={`flex justify-between text-xs text-gray-400 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{analytics.days30[0]?.date.slice(5)}</span>
              <span>{analytics.days30[29]?.date.slice(5)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPORT TAB ──────────────────────────────────────────────── */}
      {tab === 'export' && (
        <div className="max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{ui.export.title}</h2>
            <p className="text-gray-500 text-sm mb-6">{ui.export.subtitle}</p>

            {plan === 'pro' || plan === 'agency' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">{ui.export.columns}</p>
                <div className={`flex gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => exportCSV(generations)}
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                  >
                    {ui.export.btnAll} ({generations.length})
                  </button>
                  {selected.size > 0 && (
                    <button
                      onClick={() => exportCSV(filtered.filter(g => selected.has(g.id)))}
                      className="border border-brand-300 text-brand-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors"
                    >
                      {ui.export.btnSelected} ({selected.size})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="text-amber-800 font-semibold text-sm mb-1">🔒 {ui.export.proPlan}</p>
                <p className="text-amber-600 text-xs">{ui.export.proNote}</p>
                <a href="/billing" className="inline-block mt-3 bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">
                  Upgrade →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BRAND PROFILES TAB ──────────────────────────────────────── */}
      {tab === 'brand' && (
        <div className="max-w-2xl">
          {/* Header */}
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-lg font-bold text-gray-900">{ui.brand.title}</h2>
            {canAddProfile ? (
              <button
                onClick={() => setEditingProfile({ profile_name: '' })}
                className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                + {ui.brand.addBtn}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                🔒 {ui.brand.proLock}
              </div>
            )}
          </div>

          {/* Profile list */}
          {brandProfiles.length === 0 && !editingProfile ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm">{ui.brand.noProfiles}</p>
              <button
                onClick={() => setEditingProfile({ profile_name: '' })}
                className="mt-3 text-brand-600 text-sm font-medium hover:underline"
              >
                + {ui.brand.addBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {brandProfiles.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {p.is_default && (
                      <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full border border-brand-200 shrink-0">
                        {ui.actions.default}
                      </span>
                    )}
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-semibold text-gray-800">{p.profile_name || 'Default'}</p>
                      <p className="text-xs text-gray-400">{p.company_name ?? ''} {p.industry ? `· ${p.industry}` : ''}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {!p.is_default && (
                      <button
                        onClick={() => setDefaultProfile(p.id)}
                        className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        {ui.actions.setDefault}
                      </button>
                    )}
                    <button
                      onClick={() => setEditingProfile(p)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {ui.brand.editBtn}
                    </button>
                    {!p.is_default && (
                      <button
                        onClick={() => deleteBrandProfile(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        {ui.brand.deleteBtn}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit/create form */}
          {editingProfile !== null && (
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">
                {editingProfile.id ? ui.brand.editBtn : ui.brand.newProfile}
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{ui.brand.profileName}</label>
                <input
                  type="text"
                  value={editingProfile.profile_name ?? ''}
                  onChange={e => setEditingProfile(p => ({ ...p, profile_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Main Brand, Client A…"
                />
              </div>
              {(['company_name', 'industry', 'values', 'writing_style', 'tone_examples'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {field.replace('_', ' ')}
                  </label>
                  {field === 'tone_examples' ? (
                    <textarea
                      rows={3}
                      value={(editingProfile as Record<string, string | null>)[field] ?? ''}
                      onChange={e => setEditingProfile(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(editingProfile as Record<string, string | null>)[field] ?? ''}
                      onChange={e => setEditingProfile(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
              ))}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={saveBrandProfile}
                  disabled={savingProfile}
                  className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
                >
                  {savingProfile ? ui.brand.saving : ui.brand.save}
                </button>
                {savedProfile && <span className="text-sm text-green-600">{ui.brand.saved}</span>}
                <button
                  onClick={() => setEditingProfile(null)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  {ui.brand.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ContentCard({
  g, isSelected, copiedId, onSelect, onCopy, onFav, onDelete, isRTL, actions,
}: {
  g: Generation
  isSelected: boolean
  copiedId: string | null
  onSelect: () => void
  onCopy: () => void
  onFav: () => void
  onDelete: () => void
  isRTL: boolean
  actions: { copy: string; copied: string; delete: string; setDefault: string; default: string }
}) {
  const isAr = g.language === 'ar'
  const dotColor = TYPE_DOT_COLOR(g.content_type, g.platform)
  const LANG_FLAGS: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦' }

  return (
    <div className={`bg-white rounded-2xl border transition-colors ${isSelected ? 'border-brand-400' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className={`flex items-start gap-2.5 p-4 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-0.5 accent-brand-600 shrink-0"
        />
        <div className={`flex items-center gap-2 flex-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-xs text-gray-400 truncate capitalize">{g.content_type.replace('_', ' ')}</span>
          {g.platform && <span className="text-xs text-gray-300">· {g.platform}</span>}
          <span className="text-xs text-gray-300">{LANG_FLAGS[g.language] ?? ''}</span>
        </div>
      </div>
      <div className="px-4 pb-2">
        <p className={`text-sm font-medium text-gray-800 mb-1 truncate ${isAr ? 'font-arabic text-right' : ''}`}>
          {g.topic}
        </p>
        <p className={`text-xs text-gray-400 leading-relaxed line-clamp-3 ${isAr ? 'font-arabic text-right' : ''}`}
           dir={isAr ? 'rtl' : 'ltr'}>
          {g.content.slice(0, 140)}
        </p>
      </div>
      <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-xs text-gray-300">
          {new Date(g.created_at).toLocaleDateString()}
        </span>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={onCopy} className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
            {copiedId === g.id ? actions.copied : actions.copy}
          </button>
          <button onClick={onFav} className={`text-base leading-none transition-colors ${g.is_favorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}>★</button>
          <button onClick={onDelete} className="text-gray-200 hover:text-red-400 transition-colors text-xs">✕</button>
        </div>
      </div>
    </div>
  )
}

function ContentRow({
  g, isSelected, copiedId, onSelect, onCopy, onFav, onDelete, isRTL, actions,
}: {
  g: Generation
  isSelected: boolean
  copiedId: string | null
  onSelect: () => void
  onCopy: () => void
  onFav: () => void
  onDelete: () => void
  isRTL: boolean
  actions: { copy: string; copied: string; delete: string; setDefault: string; default: string }
}) {
  const isAr = g.language === 'ar'
  const dotColor = TYPE_DOT_COLOR(g.content_type, g.platform)
  const LANG_FLAGS: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦' }

  return (
    <div className={`bg-white rounded-xl border transition-colors px-4 py-3 flex items-center gap-3 ${isSelected ? 'border-brand-400' : 'border-gray-100 hover:border-gray-200'} ${isRTL ? 'flex-row-reverse' : ''}`}>
      <input type="checkbox" checked={isSelected} onChange={onSelect} className="accent-brand-600 shrink-0" />
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-xs text-gray-400 shrink-0 capitalize">{g.content_type.replace('_', ' ')}</span>
      {g.platform && <span className="text-xs text-gray-300 shrink-0">· {g.platform}</span>}
      <span className="text-xs shrink-0">{LANG_FLAGS[g.language] ?? ''}</span>
      <span className={`text-sm text-gray-700 truncate flex-1 ${isAr ? 'font-arabic text-right' : ''}`}>{g.topic}</span>
      <span className="text-xs text-gray-300 shrink-0">{new Date(g.created_at).toLocaleDateString()}</span>
      <button onClick={onCopy} className="text-xs text-gray-400 hover:text-brand-600 shrink-0">
        {copiedId === g.id ? actions.copied : actions.copy}
      </button>
      <button onClick={onFav} className={`text-base leading-none shrink-0 ${g.is_favorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}>★</button>
      <button onClick={onDelete} className="text-gray-200 hover:text-red-400 text-xs shrink-0">✕</button>
    </div>
  )
}
