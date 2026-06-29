'use client'

import type { PlanId } from '@/lib/plans'

interface Props {
  planId: PlanId
  isLoading: boolean
  onStart: () => void
  onError: () => void
}

export default function CheckoutButton({ planId, isLoading, onStart, onError }: Props) {
  async function handleCheckout() {
    onStart()
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const { url, error } = await res.json()
    if (error) {
      alert(error)
      onError()
      return
    }
    window.location.href = url
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
    >
      {isLoading ? 'Redirecting…' : 'Upgrade'}
    </button>
  )
}
