import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    generations: 5,
    features: ['5 generations/month', 'All content types', '3 languages', 'Standard quality'],
  },
  basic: {
    name: 'Basic',
    price: 9,
    priceId: process.env.STRIPE_BASIC_PRICE_ID ?? null,
    generations: 30,
    features: ['30 generations/month', 'All content types', '3 languages', 'Brand voice', 'Priority generation'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    generations: 100,
    features: ['100 generations/month', 'All content types', '3 languages', 'Brand voice', 'Weekly planner', 'CSV export'],
  },
  agency: {
    name: 'Agency',
    price: 79,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? null,
    generations: 500,
    features: ['500 generations/month', 'Unlimited brand profiles', '10 client workspaces', 'White-label PDF reports', 'Priority support'],
  },
} as const

export type PlanId = keyof typeof PLANS

// One-time add-ons (mode: 'payment')
export const ADD_ONS = {
  content_pack: {
    name: 'Content Pack',
    price: 4.99,
    priceId: process.env.STRIPE_CONTENT_PACK_PRICE_ID ?? null,
    description: '500 extra generations',
  },
  brand_voice_setup: {
    name: 'Brand Voice Setup',
    price: 19,
    priceId: process.env.STRIPE_BRAND_VOICE_PRICE_ID ?? null,
    description: 'Manual onboarding service',
  },
} as const

export type AddOnId = keyof typeof ADD_ONS
