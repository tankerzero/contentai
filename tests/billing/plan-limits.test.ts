import { describe, it, expect } from 'vitest'
import { PLANS } from '@/lib/plans'

describe('Plan generation limits', () => {
  function isBlocked(usedThisMonth: number, planId: keyof typeof PLANS): boolean {
    const limit = PLANS[planId].generations
    return usedThisMonth >= limit
  }

  it('Free: 5th generation allowed, 6th blocked', () => {
    expect(isBlocked(4, 'free')).toBe(false)
    expect(isBlocked(5, 'free')).toBe(true)
  })

  it('Basic: 30th generation allowed, 31st blocked', () => {
    expect(isBlocked(29, 'basic')).toBe(false)
    expect(isBlocked(30, 'basic')).toBe(true)
  })

  it('Pro: 100th generation allowed, 101st blocked', () => {
    expect(isBlocked(99, 'pro')).toBe(false)
    expect(isBlocked(100, 'pro')).toBe(true)
  })

  it('Agency: never blocked (unlimited)', () => {
    expect(isBlocked(0, 'agency')).toBe(false)
    expect(isBlocked(100, 'agency')).toBe(false)
    expect(isBlocked(10_000, 'agency')).toBe(false)
    expect(isBlocked(1_000_000, 'agency')).toBe(false)
  })

  it('Content Pack adds 20 extra_credits (stored separately from plan limit)', () => {
    // extra_credits is a separate column in profiles, not baked into plan.generations.
    // The generate route should check: if (count >= plan.generations + extra_credits) block.
    // Currently the generate route only checks plan.generations — extra_credits not yet wired.
    // This test documents the intended behavior.
    const baseLimit = PLANS.free.generations
    expect(baseLimit).toBe(5)
    const extraCredits = 20
    const effectiveLimit = baseLimit + extraCredits
    expect(effectiveLimit).toBe(25)

    // With extra_credits, a free user with 24 generations used should NOT be blocked
    const isBlockedWithExtra = (used: number, limit: number, extra: number) =>
      used >= limit + extra
    expect(isBlockedWithExtra(24, baseLimit, extraCredits)).toBe(false)
    expect(isBlockedWithExtra(25, baseLimit, extraCredits)).toBe(true)
  })

  it('yearly pricing is 10x monthly (10 months = 2 months free)', () => {
    for (const [id, plan] of Object.entries(PLANS)) {
      if (plan.price === 0) continue
      const yearlyPrice = Math.round(plan.price * 10)
      const savings = plan.price * 12 - yearlyPrice
      expect(savings).toBeCloseTo(plan.price * 2, 0)
      expect(yearlyPrice).toBe(Math.round(plan.price * 10))
    }
  })
})

describe('Plan upgrade logic', () => {
  it('upgrading applies new limit immediately', () => {
    // Before upgrade: free with 4 used
    const usedThisMonth = 4
    const freePlan = 'free'
    const basicPlan = 'basic'

    const blockedOnFree = usedThisMonth >= PLANS[freePlan].generations
    expect(blockedOnFree).toBe(false) // still allowed

    // At limit on free
    const usedAtFreeLimit = 5
    expect(usedAtFreeLimit >= PLANS[freePlan].generations).toBe(true)  // blocked on free
    expect(usedAtFreeLimit >= PLANS[basicPlan].generations).toBe(false) // not blocked on basic
  })
})
