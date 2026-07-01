import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabase/env'
import { sendEmail } from '@/lib/resend'
import type Stripe from 'stripe'

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — webhook cannot update DB')
  return createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
}

const PLAN_PRICE_MAP: Record<string, string> = {
  [process.env.STRIPE_BASIC_PRICE_ID  ?? '__none__']: 'basic',
  [process.env.STRIPE_PRO_PRICE_ID    ?? '__none__']: 'pro',
  [process.env.STRIPE_AGENCY_PRICE_ID ?? '__none__']: 'agency',
}

const CONTENT_PACK_CREDITS = 20

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  let supabase: ReturnType<typeof getAdminClient>
  try {
    supabase = getAdminClient()
  } catch (err) {
    console.error('[webhook] Service client init failed:', err)
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  console.log('[webhook] event:', event.type, event.id)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.userId
      const planId  = session.metadata?.planId
      const addOnId = session.metadata?.addOnId

      if (!userId) {
        console.warn('[webhook] checkout.session.completed — no userId in metadata', event.id)
        break
      }

      if (planId) {
        // Subscription plan purchase
        const { error } = await supabase
          .from('profiles')
          .update({ plan: planId, stripe_subscription_id: session.subscription as string })
          .eq('id', userId)
        if (error) console.error('[webhook] plan update failed:', error.message)
        else console.log('[webhook] plan upgraded to', planId, 'for user', userId)
      } else if (addOnId === 'content_pack') {
        // Content pack — add credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('extra_credits')
          .eq('id', userId)
          .single()
        const current = (profile?.extra_credits as number | null) ?? 0
        const { error } = await supabase
          .from('profiles')
          .update({ extra_credits: current + CONTENT_PACK_CREDITS })
          .eq('id', userId)
        if (error) console.error('[webhook] extra_credits update failed:', error.message)
        else console.log('[webhook] +', CONTENT_PACK_CREDITS, 'credits for user', userId)
      } else if (addOnId === 'brand_voice_setup') {
        // Brand voice setup — notify admin to fulfil manually
        await sendEmail({
          from: 'ContentAI <support@contentai.ca>',
          to: 'tanker.zero0@gmail.com',
          subject: '[ContentAI] Brand Voice Setup purchase — manual fulfilment needed',
          html: `<p>User <strong>${userId}</strong> purchased Brand Voice Setup (${session.customer_email ?? 'no email'}). Please fulfil within 48h.</p><p>Stripe session: ${session.id}</p>`,
        }).catch(err => console.error('[webhook] brand voice notify email error:', err))
        console.log('[webhook] brand_voice_setup purchased by user', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id
      const newPlan = priceId ? PLAN_PRICE_MAP[priceId] : undefined

      if (newPlan) {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: newPlan })
          .eq('stripe_subscription_id', sub.id)
        if (error) console.error('[webhook] subscription update failed:', error.message)
        else console.log('[webhook] plan updated to', newPlan, 'via subscription', sub.id)
      } else {
        console.warn('[webhook] subscription.updated — unrecognised price ID:', priceId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_subscription_id', sub.id)
      if (error) console.error('[webhook] subscription delete failed:', error.message)
      else console.log('[webhook] subscription deleted, user dropped to free:', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (profile) {
        await sendEmail({
          from: 'ContentAI <support@contentai.ca>',
          to: invoice.customer_email ?? 'tanker.zero0@gmail.com',
          subject: '[ContentAI] Payment failed — please update your payment method',
          html: `<p>Hi there,</p><p>Your last payment to ContentAI failed. Please update your payment method at <a href="https://contentai.ca/billing">contentai.ca/billing</a> to keep your plan active.</p>`,
        }).catch(err => console.error('[webhook] payment failed email error:', err))
      }
      console.log('[webhook] invoice.payment_failed for customer', customerId)
      break
    }

    default:
      console.log('[webhook] unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
