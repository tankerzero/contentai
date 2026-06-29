'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-banner-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-banner-dismissed', '1')
    setVisible(false)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
    else setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#0D7377] flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-base">C</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight">Install ContentAI</p>
        <p className="text-xs text-gray-500 leading-tight">Add to your home screen</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 bg-[#0D7377] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0a5f63] transition-colors"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
