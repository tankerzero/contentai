'use client'

import { useState } from 'react'
import type { PlanId } from '@/lib/plans'

export default function CheckoutButton({ planId }: { planId: PlanId }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
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
      className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
    >
      {loading ? 'Redirecting…' : 'Upgrade'}
    </button>
  )
}
