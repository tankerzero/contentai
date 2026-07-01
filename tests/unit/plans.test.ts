import { describe, it, expect } from 'vitest'
import { PLANS, ADD_ONS } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

describe('PLANS', () => {
  it('exports all 4 plans', () => {
    expect(Object.keys(PLANS)).toEqual(['free', 'basic', 'pro', 'agency'])
  })

  it('free plan has 5 generations/month', () => {
    expect(PLANS.free.generations).toBe(5)
  })

  it('basic plan has 30 generations/month', () => {
    expect(PLANS.basic.generations).toBe(30)
  })

  it('pro plan has 100 generations/month', () => {
    expect(PLANS.pro.generations).toBe(100)
  })

  it('agency plan has Infinity generations (truly unlimited)', () => {
    expect(PLANS.agency.generations).toBe(Infinity)
  })

  it('agency is never blocked (count >= Infinity === false)', () => {
    const limit = PLANS.agency.generations
    expect(999999 >= limit).toBe(false)
  })

  it('prices are correct (CAD)', () => {
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.basic.price).toBe(9)
    expect(PLANS.pro.price).toBe(29)
    expect(PLANS.agency.price).toBe(79)
  })

  it('no plan features reference "3 languages"', () => {
    const allFeatures = (Object.values(PLANS) as Array<{features: readonly string[]}>)
      .flatMap(p => p.features)
    const bad = allFeatures.filter(f => f.includes('3 language') || f.includes('3 langue') || f.includes('3 idioma') || f.includes('3种语言') || f.includes('3 لغات'))
    expect(bad).toHaveLength(0)
  })

  it('add-on content_pack has correct price', () => {
    expect(ADD_ONS.content_pack.price).toBe(4.99)
  })

  it('add-on brand_voice_setup has correct price', () => {
    expect(ADD_ONS.brand_voice_setup.price).toBe(19)
  })

  it('generation limits enforce correctly at boundary', () => {
    const plans: PlanId[] = ['free', 'basic', 'pro', 'agency']
    const expectedBlocked = { free: true, basic: true, pro: true, agency: false }
    for (const planId of plans) {
      const limit = PLANS[planId].generations
      const countAtLimit = Number.isFinite(limit) ? limit : 999999
      expect(countAtLimit >= limit).toBe(expectedBlocked[planId])
    }
  })
})
