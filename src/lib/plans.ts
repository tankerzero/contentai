// Client-safe plan data — no Stripe SDK, no secret env vars.
// Import this in client components that need to display plan info.

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    generations: 5,
    features: ['5 generations/month', 'All content types', '3 languages', 'Standard quality'],
  },
  basic: {
    name: 'Basic',
    price: 9,
    generations: 30,
    features: ['30 generations/month', 'All content types', '3 languages', 'Brand voice', 'Priority generation'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    generations: 100,
    features: ['100 generations/month', 'All content types', '3 languages', 'Brand voice', 'Weekly planner', 'CSV export'],
  },
  agency: {
    name: 'Agency',
    price: 79,
    generations: 500,
    features: ['500 generations/month', 'Unlimited brand profiles', '10 client workspaces', 'White-label PDF reports', 'Priority support'],
  },
} as const

export type PlanId = keyof typeof PLANS

export const ADD_ONS = {
  content_pack: {
    name: 'Content Pack',
    price: 4.99,
    description: '500 extra generations',
  },
  brand_voice_setup: {
    name: 'Brand Voice Setup',
    price: 19,
    description: 'Manual onboarding service',
  },
} as const

export type AddOnId = keyof typeof ADD_ONS
