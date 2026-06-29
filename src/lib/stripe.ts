import 'server-only'
import Stripe from 'stripe'

export type { PlanId, AddOnId } from './plans'
export { PLANS, ADD_ONS } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
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
