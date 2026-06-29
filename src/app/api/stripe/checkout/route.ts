import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, PLAN_PRICE_IDS, type PlanId } from '@/lib/stripe'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = checkRateLimit(rateLimitKey(user.id, 'stripe-checkout'), 5)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const planId = sanitizeShort(body.planId) as PlanId
  const plan = PLANS[planId]

  if (!plan || plan.price === 0) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = PLAN_PRICE_IDS[planId]
  if (!priceId) {
    return NextResponse.json(
      { error: 'Stripe price not configured for this plan. Add the price ID env var to Vercel.' },
      { status: 500 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | undefined

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing`,
    metadata: { userId: user.id, planId },
    custom_text: {
      submit: { message: 'You will be charged in CAD. Cancel anytime from your Billing page.' },
    },
  })

  return NextResponse.json({ url: session.url })
}
