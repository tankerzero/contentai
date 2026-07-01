'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const KEY = 'contentai_cookie_consent'

// Module-level guard: if two instances are ever mounted simultaneously (e.g. from
// a duplicate render in a Suspense boundary), only the first one shows.
let instanceMounted = false

export default function CookieBanner() {
  // Three distinct states to avoid conflating SSR/pre-hydration with dismissed:
  //   'pending' → localStorage not yet read (server render + initial hydration frame)
  //   'show'    → no prior consent recorded — show the banner
  //   'hidden'  → consent already recorded, or user just responded
  const [status, setStatus] = useState<'pending' | 'show' | 'hidden'>('pending')

  useEffect(() => {
    // Singleton: if another instance is already active, this one yields silently.
    if (instanceMounted) return
    instanceMounted = true

    // Re-reading localStorage on every mount means re-mounts triggered by
    // language switches or Suspense re-resolutions always reflect persisted state,
    // not stale component state.
    setStatus(localStorage.getItem(KEY) ? 'hidden' : 'show')

    return () => {
      instanceMounted = false
    }
  }, [])

  if (status !== 'show') return null

  const respond = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(KEY, choice)
    setStatus('hidden')
  }

  return (
    // dir="ltr" keeps the banner layout left-to-right even when the page switches
    // to Arabic RTL — otherwise flex reverses and button order flips, which looks
    // like a new banner rendered.
    <div dir="ltr" className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm leading-relaxed text-gray-300">
          <span className="text-white font-semibold">We use cookies</span> to improve your
          experience and analyze usage. See our{' '}
          <Link href="/privacy" className="text-[#4FC3C8] hover:underline">
            Privacy Policy
          </Link>.
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => respond('declined')}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl border border-gray-600 hover:border-gray-400 transition"
          >
            Decline
          </button>
          <button
            onClick={() => respond('accepted')}
            className="text-sm font-semibold bg-[#0D7377] hover:bg-[#0a5d61] text-white px-5 py-2 rounded-xl transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
