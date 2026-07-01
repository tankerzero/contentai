'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'

const ITEMS = [
  { href: '/dashboard', icon: '🏠' },
  { href: '/generate',  icon: '✨' },
  { href: '/history',   icon: '📜' },
  { href: '/billing',   icon: '💳' },
  { href: '/support',   icon: '💬' },
]

const LANG_OPTIONS: { value: UILang; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'fr', flag: '🇫🇷', label: 'FR' },
  { value: 'ar', flag: '🇸🇦', label: 'AR' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
  { value: 'zh', flag: '🇨🇳', label: '中' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { lang, setLang } = useUILang()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex flex-col md:hidden safe-area-pb">
      {/* Language switcher row */}
      <div className="flex border-b border-gray-100">
        {LANG_OPTIONS.map(l => (
          <button
            key={l.value}
            onClick={() => setLang(l.value)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors ${
              lang === l.value ? 'bg-teal-50' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-sm leading-none">{l.flag}</span>
            <span className={`text-[9px] font-semibold leading-none ${lang === l.value ? 'text-brand-700' : 'text-gray-400'}`}>
              {l.label}
            </span>
          </button>
        ))}
      </div>

      {/* Nav links */}
      <div className="flex">
        {ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex items-center justify-center min-h-[52px] transition-colors ${
                active ? 'text-brand-700' : 'text-gray-400 active:text-brand-600'
              }`}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
