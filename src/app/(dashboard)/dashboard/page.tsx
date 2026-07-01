'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUILang } from '@/contexts/UILanguageContext'
import { createClient } from '@/lib/supabase/client'

const UI = {
  en: {
    title: 'Dashboard', welcome: 'Welcome back',
    stats: { total: 'Total generations', month: 'This month', plan: 'Plan' },
    ready: 'Ready to create?',
    readyDesc: 'Generate your next piece of content in seconds.',
    readyCta: 'New generation →',
    recent: 'Recent generations', noGen: 'No generations yet.',
    noGenCta: 'Create your first one →',
  },
  fr: {
    title: 'Dashboard', welcome: 'Bon retour',
    stats: { total: 'Total générations', month: 'Ce mois', plan: 'Forfait' },
    ready: 'Prêt à créer ?',
    readyDesc: 'Générez votre prochain contenu en quelques secondes.',
    readyCta: 'Nouvelle génération →',
    recent: 'Générations récentes', noGen: 'Aucune génération pour l\'instant.',
    noGenCta: 'Créez votre première →',
  },
  ar: {
    title: 'الرئيسية', welcome: 'أهلاً بعودتك',
    stats: { total: 'إجمالي التوليدات', month: 'هذا الشهر', plan: 'الخطة' },
    ready: 'جاهز للإبداع؟',
    readyDesc: 'أنشئ محتواك التالي في ثوانٍ.',
    readyCta: 'توليد جديد ←',
    recent: 'آخر التوليدات', noGen: 'لا توليدات بعد.',
    noGenCta: 'أنشئ أول توليد →',
  },
  es: {
    title: 'Panel', welcome: 'Bienvenido de nuevo',
    stats: { total: 'Total generaciones', month: 'Este mes', plan: 'Plan' },
    ready: '¿Listo para crear?',
    readyDesc: 'Genera tu próximo contenido en segundos.',
    readyCta: 'Nueva generación →',
    recent: 'Generaciones recientes', noGen: 'Sin generaciones aún.',
    noGenCta: 'Crea la primera →',
  },
  zh: {
    title: '控制台', welcome: '欢迎回来',
    stats: { total: '总生成数', month: '本月', plan: '套餐' },
    ready: '准备好创作了吗？',
    readyDesc: '几秒钟内生成您的下一篇内容。',
    readyCta: '新建生成 →',
    recent: '最近生成', noGen: '暂无生成记录。',
    noGenCta: '创建第一篇 →',
  },
}

interface Generation {
  id: string
  content_type: string
  topic: string
  created_at: string
}

interface Profile {
  plan: string
}

export default function DashboardPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]

  const [email, setEmail] = useState('')
  const [generations, setGenerations] = useState<Generation[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const [{ data: gens }, { count }, { data: profile }] = await Promise.all([
        supabase.from('generations').select('id, content_type, topic, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('generations').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
      ])

      setGenerations((gens as Generation[]) ?? [])
      setTotalCount(count ?? 0)
      setPlan((profile as Profile | null)?.plan ?? 'free')
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-40" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-8 max-w-5xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{ui.welcome}, {email}</p>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label={ui.stats.total} value={totalCount} />
        <StatCard label={ui.stats.month} value={0} />
        <StatCard label={ui.stats.plan} value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
      </div>

      {/* Quick action */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white mb-10">
        <h2 className="text-lg font-semibold mb-2">{ui.ready}</h2>
        <p className="text-brand-100 text-sm mb-4">{ui.readyDesc}</p>
        <Link
          href="/generate"
          className="inline-block bg-white text-brand-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          {ui.readyCta}
        </Link>
      </div>

      {/* Recent */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{ui.recent}</h2>
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
