'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/dashboard', icon: '🏠' },
  { href: '/generate',  icon: '✨' },
  { href: '/history',   icon: '📜' },
  { href: '/billing',   icon: '💳' },
  { href: '/support',   icon: '💬' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex md:hidden safe-area-pb">
      {ITEMS.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex items-center justify-center min-h-[56px] transition-colors ${
              active ? 'text-brand-700' : 'text-gray-400 active:text-brand-600'
            }`}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
          </Link>
        )
      })}
    </nav>
  )
}
