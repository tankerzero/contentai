'use client'

import { useState, useEffect } from 'react'
import type { AddOnId } from '@/lib/plans'

interface Props {
  addOnId: AddOnId
  label: string
}

export default function AddOnCheckoutButton({ addOnId, label }: Props) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const reset = () => setLoading(false)
    window.addEventListener('focus', reset)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.removeEventListener('focus', reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [])

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addOnId }),
    })
    const { url, error } = await res.json()
    if (error) {
      alert(error)
      setLoading(false)
      return
    }
    window.location.href = url
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="inline-block bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
    >
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
