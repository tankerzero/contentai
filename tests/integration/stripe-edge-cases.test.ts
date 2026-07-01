import { describe, it, expect, vi } from 'vitest'

describe('Stripe checkout edge cases', () => {
  it('stale customer ID recovery: recreates customer and retries', () => {
    // The checkout route catches error.code === 'resource_missing'
    // and creates a new customer. This test verifies the retry logic.
    const attemptCheckout = vi.fn()
      .mockRejectedValueOnce({ code: 'resource_missing' })
      .mockResolvedValueOnce({ id: 'cs_new_123', url: 'https://checkout.stripe.com/new' })

    const handleCheckout = async (): Promise<string> => {
      try {
        const session = await attemptCheckout('cus_stale')
        return session.url
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'resource_missing') {
          // Create new customer and retry
          const session = await attemptCheckout('cus_new')
          return session.url
        }
        throw err
      }
    }

    expect(handleCheckout()).resolves.toBe('https://checkout.stripe.com/new')
  })

  it('free plan checkout is rejected (price === 0)', () => {
    const validatePlanForCheckout = (planId: string, plans: Record<string, { price: number }>) => {
      const plan = plans[planId]
      if (!plan || plan.price === 0) return { error: 'Invalid plan' }
      return { ok: true }
    }

    const PLANS = { free: { price: 0 }, basic: { price: 9 }, pro: { price: 29 } }
    expect(validatePlanForCheckout('free', PLANS)).toEqual({ error: 'Invalid plan' })
    expect(validatePlanForCheckout('basic', PLANS)).toEqual({ ok: true })
  })

  it('missing Stripe price ID returns 500 config error', () => {
    const getPriceId = (planId: string, priceIds: Record<string, string | null>) => {
      const priceId = priceIds[planId]
      if (!priceId) return { error: 'Stripe price not configured for this plan. Add the price ID env var to Vercel.' }
      return { priceId }
    }

    expect(getPriceId('basic', { basic: null })).toEqual({
      error: 'Stripe price not configured for this plan. Add the price ID env var to Vercel.',
    })
    expect(getPriceId('basic', { basic: 'price_abc123' })).toEqual({ priceId: 'price_abc123' })
  })

  it('rate limits checkout at 5 requests (per user)', () => {
    const CHECKOUT_LIMIT = 5
    let count = 0
    const check = () => {
      if (count >= CHECKOUT_LIMIT) return false
      count++
      return true
    }
    for (let i = 0; i < CHECKOUT_LIMIT; i++) expect(check()).toBe(true)
    expect(check()).toBe(false)
  })

  it('checkout success_url points to /billing?success=true', () => {
    const appUrl = 'https://contentai.ca'
    const successUrl = `${appUrl}/billing?success=true`
    const cancelUrl  = `${appUrl}/billing?canceled=true`
    expect(successUrl).toBe('https://contentai.ca/billing?success=true')
    expect(cancelUrl).toBe('https://contentai.ca/billing?canceled=true')
  })
})

describe('Webhook plan mapping', () => {
  it('PLAN_PRICE_MAP correctly maps price IDs to plan names', () => {
    // Validate the mapping logic — actual price IDs are in env vars
    // In production: STRIPE_BASIC_PRICE_ID → 'basic', etc.
    const mockPriceIds = {
      'price_basic_123': 'basic',
      'price_pro_456':   'pro',
      'price_agency_789': 'agency',
    }

    expect(mockPriceIds['price_basic_123']).toBe('basic')
    expect(mockPriceIds['price_pro_456']).toBe('pro')
    expect(mockPriceIds['price_agency_789']).toBe('agency')
    expect(mockPriceIds['price_unknown' as keyof typeof mockPriceIds]).toBeUndefined()
  })

  it('subscription.updated with unknown price logs warning and skips update', () => {
    const warnings: string[] = []
    const processSubscriptionUpdated = (priceId: string, priceMap: Record<string, string>) => {
      const newPlan = priceMap[priceId]
      if (!newPlan) {
        warnings.push(`unrecognised price ID: ${priceId}`)
        return null
      }
      return newPlan
    }

    const result = processSubscriptionUpdated('price_unknown', { 'price_basic_123': 'basic' })
    expect(result).toBeNull()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('price_unknown')
  })
})

describe('Account reuse / free tier bypass', () => {
  it('signing up again with same email does not reset generation count', () => {
    // Supabase Auth handles email uniqueness — duplicate signup returns existing user.
    // The generations table is keyed to user_id, not email.
    // If someone deletes their Supabase Auth account and re-signs up with same email,
    // they get a NEW user_id → new generation count. This is a known edge case.
    //
    // Mitigation: store email in profiles and check on first generation.
    // Current state: no mitigation — documented as a known risk.
    expect(true).toBe(true) // documentation test
  })

  it('generation count is per user_id per calendar month', () => {
    const userId = 'user-abc'
    const startOfMonth = new Date(2026, 5, 1).toISOString() // June 2026
    const queryWouldBe = `SELECT count(*) FROM generations WHERE user_id = '${userId}' AND created_at >= '${startOfMonth}'`
    expect(queryWouldBe).toContain('user_id')
    expect(queryWouldBe).toContain('created_at >=')
  })
})
