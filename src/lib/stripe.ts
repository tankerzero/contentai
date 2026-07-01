import 'server-only'
import Stripe from 'stripe'

export type { PlanId, AddOnId } from './plans'
export { PLANS, ADD_ONS } from './plans'

// Lazy-init so missing key in local builds doesn't crash at module evaluation time.
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  }
  return _stripe
}
// Backwards-compatible named export used by existing call sites.
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) { return (getStripe() as unknown as Record<string, unknown>)[prop as string] },
})

// Server-side price IDs — never exposed to the client bundle.
export const PLAN_PRICE_IDS: Record<string, string | null> = {
  basic:  process.env.STRIPE_BASIC_PRICE_ID  ?? null,
  pro:    process.env.STRIPE_PRO_PRICE_ID    ?? null,
  agency: process.env.STRIPE_AGENCY_PRICE_ID ?? null,
}

export const ADD_ON_PRICE_IDS: Record<string, string | null> = {
  content_pack:      process.env.STRIPE_CONTENT_PACK_PRICE_ID  ?? null,
  brand_voice_setup: process.env.STRIPE_BRAND_VOICE_PRICE_ID   ?? null,
}
