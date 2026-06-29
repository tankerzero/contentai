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

  // Derive the base URL from the request so it's always correct in all environments
  // (avoids .env.local NEXT_PUBLIC_APP_URL=localhost overriding Vercel env vars)
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'contentai.ca'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const appUrl = host.startsWith('localhost') ? `http://${host}` : `${proto}://${host}`

  const sessionParams = {
    customer: customerId,
    mode: 'subscription' as const,
    payment_method_types: ['card' as const],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing?canceled=true`,
    metadata: { userId: user.id, planId },
    custom_text: {
      submit: { message: 'You will be charged in CAD. Cancel anytime from your Billing page.' },
    },
  }

  let session
  try {
    session = await stripe.checkout.sessions.create(sessionParams)
  } catch (err: unknown) {
    // Stored customer ID is from test mode and doesn't exist in live mode — create a fresh one
    if ((err as { code?: string }).code === 'resource_missing') {
      console.log('[stripe] customer not found in live mode (stale test-mode ID), creating new customer for user:', user.id)
      const newCustomer = await stripe.customers.create({ email: user.email! })
      await supabase.from('profiles').update({ stripe_customer_id: newCustomer.id }).eq('id', user.id)
      session = await stripe.checkout.sessions.create({ ...sessionParams, customer: newCustomer.id })
    } else {
      throw err
    }
  }

  console.log('[stripe] checkout session created:', session.id, '| user:', user.id, '| plan:', planId)

  return NextResponse.json({ url: session.url })
}
