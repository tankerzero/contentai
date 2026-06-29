'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const KEY = 'contentai_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm leading-relaxed text-gray-300">
          <span className="text-white font-semibold">We use cookies</span> to improve your experience and analyze usage.
          See our{' '}
          <Link href="/privacy" className="text-[#4FC3C8] hover:underline">Privacy Policy</Link>.
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl border border-gray-600 hover:border-gray-400 transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-sm font-semibold bg-[#0D7377] hover:bg-[#0a5d61] text-white px-5 py-2 rounded-xl transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
