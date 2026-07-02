import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, PLAN_PRICE_IDS, ADD_ONS, ADD_ON_PRICE_IDS, type PlanId, type AddOnId } from '@/lib/stripe'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  console.log('[checkout] called')
  if (process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true') {
    return NextResponse.json(
      { error: 'ContentAI is not yet open for payments. Join the waitlist at contentai.ca!' },
      { status: 503 }
    )
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = checkRateLimit(rateLimitKey(user.id, 'stripe-checkout'), 5)
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

    const body = await req.json()
    const addOnId = body.addOnId ? sanitizeShort(body.addOnId) as AddOnId : null

    // Derive the base URL from the request so it's always correct in all environments
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'contentai.ca'
    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    const appUrl = host.startsWith('localhost') ? `http://${host}` : `${proto}://${host}`

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

    // ── Add-on one-time purchase ──────────────────────────────────────────────
    if (addOnId) {
      const addOn = ADD_ONS[addOnId]
      if (!addOn) {
        return NextResponse.json({ error: 'Invalid add-on' }, { status: 400 })
      }
      const priceId = ADD_ON_PRICE_IDS[addOnId]
      if (!priceId) {
        return NextResponse.json(
          { error: 'Add-on price not configured. Add the price ID env var to Vercel.' },
          { status: 500 }
        )
      }

      const sessionParams = {
        customer: customerId,
        mode: 'payment' as const,
        payment_method_types: ['card' as const],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing?success=true`,
        cancel_url: `${appUrl}/billing?canceled=true`,
        metadata: { userId: user.id, addOnId },
        custom_text: {
          submit: { message: 'You will be charged in CAD.' },
        },
      }

      let session
      try {
        session = await stripe.checkout.sessions.create(sessionParams)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'resource_missing') {
          const newCustomer = await stripe.customers.create({ email: user.email! })
          await supabase.from('profiles').update({ stripe_customer_id: newCustomer.id }).eq('id', user.id)
          session = await stripe.checkout.sessions.create({ ...sessionParams, customer: newCustomer.id })
        } else {
          const msg = (err as Error).message ?? 'Stripe error'
          console.error('[checkout] Stripe add-on error:', msg)
          return NextResponse.json({ error: msg }, { status: 502 })
        }
      }

      console.log('[checkout] add-on session created:', session.id, '| user:', user.id, '| addOn:', addOnId)
      return NextResponse.json({ url: session.url })
    }

    // ── Subscription plan ─────────────────────────────────────────────────────
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
      if ((err as { code?: string }).code === 'resource_missing') {
        console.log('[checkout] stale customer ID, creating new customer for user:', user.id)
        const newCustomer = await stripe.customers.create({ email: user.email! })
        await supabase.from('profiles').update({ stripe_customer_id: newCustomer.id }).eq('id', user.id)
        session = await stripe.checkout.sessions.create({ ...sessionParams, customer: newCustomer.id })
      } else {
        const msg = (err as Error).message ?? 'Stripe error'
        console.error('[checkout] Stripe error:', msg)
        return NextResponse.json({ error: msg }, { status: 502 })
      }
    }

    console.log('[checkout] returning url:', session.url, '| session:', session.id, '| user:', user.id, '| plan:', planId)
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Internal server error'
    console.error('[checkout] unexpected error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
