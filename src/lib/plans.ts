// Client-safe plan data — no Stripe SDK, no secret env vars.
// Import this in client components that need to display plan info.

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    generations: 5,
    autoPostSlots: 0,
    features: ['5 generations/month', 'All content types', '5 languages', 'Standard quality'],
  },
  basic: {
    name: 'Basic',
    price: 9,
    generations: 30,
    autoPostSlots: 1,
    features: ['30 generations/month', 'All content types', '5 languages', 'Brand voice', 'Priority generation'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    generations: 100,
    autoPostSlots: 3,
    features: [
      'ContentAI writes your content automatically',
      'Email preview — approve in one tap',
      'Auto-posts to any 3 Buffer channels',
      '5 languages + Brand voice profiles',
      'Weekly planner',
    ],
  },
  agency: {
    name: 'Agency',
    price: 79,
    generations: 500,
    autoPostSlots: 5,
    features: [
      'VIP — 500 gen/month',
      'Everything in Pro',
      'Auto-posts to any 5 Buffer channels',
      'Multi-workspace (manage client accounts)',
      'Client approval flow',
      'Priority support',
      'White-label ready',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS

export const ADD_ONS = {
  content_pack: {
    name: 'Content Pack',
    price: 4.99,
    description: '20 extra generations, one-time',
  },
  brand_voice_setup: {
    name: 'Brand Voice Setup',
    price: 19,
    description: 'Professional brand voice configuration, delivered within 48h',
  },
} as const

export type AddOnId = keyof typeof ADD_ONS
