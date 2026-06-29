'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'
import { createClient } from '@/lib/supabase/client'

const NAV_T = {
  en: {
    dashboard: 'Dashboard',  generate: 'Generate',     history: 'History',
    content:   'My Content', planner: 'Planner',        earn: 'Earn',
    brandSection: 'Brand',   signOut: 'Sign out',
    brand:   'Brand Voice',  billing: 'Billing',        social: 'Social',
    marketing: 'Marketing',
  },
  fr: {
    dashboard: 'Dashboard',  generate: 'Générer',       history: 'Historique',
    content:   'Mon Contenu',planner: 'Planificateur',  earn: 'Gagner',
    brandSection: 'Marque',  signOut: 'Déconnexion',
    brand:   'Ton de marque',billing: 'Abonnement',     social: 'Social',
    marketing: 'Marketing',
  },
  ar: {
    dashboard: 'الرئيسية',  generate: 'توليد',          history: 'السجل',
    content:   'محتواي',    planner:  'المخطط',          earn: 'الكسب',
    brandSection: 'العلامة', signOut: 'تسجيل خروج',
    brand:   'صوت العلامة', billing: 'الاشتراك',        social: 'التواصل',
    marketing: 'تسويق',
  },
}

const LANG_LABELS: { value: UILang; label: string; flag: string }[] = [
  { value: 'en', label: 'EN', flag: '🇬🇧' },
  { value: 'fr', label: 'FR', flag: '🇫🇷' },
  { value: 'ar', label: 'AR', flag: '🇸🇦' },
]

export default function NavSidebar({ email }: { email: string }) {
  const { lang, setLang, isRTL } = useUILang()
  const t = NAV_T[lang]
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isRTL ? 'flex-row-reverse' : ''
        } ${
          active
            ? 'bg-brand-50 text-brand-700 font-semibold'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`}
      >
        <span className="text-base leading-none shrink-0">{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <aside
      className={`w-60 bg-white flex flex-col shrink-0 ${isRTL ? 'border-l' : 'border-r'} border-gray-100`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <path
              d="M9 1 L10.8 6.4 L16.5 6.4 L12 9.8 L13.8 15.2 L9 11.8 L4.2 15.2 L6 9.8 L1.5 6.4 L7.2 6.4 Z"
              fill="none" stroke="#0D7377" strokeWidth="1.2" strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold text-brand-700 tracking-tight">ContentAI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavLink href="/dashboard" label={t.dashboard} icon="🏠" />
        <NavLink href="/generate"  label={t.generate}  icon="✨" />
        <NavLink href="/content"   label={t.content}   icon="📂" />
        <NavLink href="/history"   label={t.history}   icon="📜" />
        <NavLink href="/planner"   label={t.planner}   icon="📅" />

        <div className={`pt-4 pb-1 px-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1 bg-gray-100" />
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">{t.brandSection}</p>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <NavLink href="/social"    label={t.social}    icon="📱" />
        <NavLink href="/marketing" label={t.marketing} icon="📣" />
        <NavLink href="/brand"     label={t.brand}     icon="🎨" />
        <NavLink href="/billing"   label={t.billing}   icon="💳" />
        <NavLink href="/earn"      label={t.earn}      icon="💸" />
      </nav>

      {/* Language switcher */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className={`flex gap-1 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {LANG_LABELS.map(l => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === l.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 px-1 mb-2 truncate">{email}</p>
        <button
          onClick={handleSignOut}
          className={`w-full text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
        >
          {t.signOut}
        </button>
      </div>
    </aside>
  )
}
