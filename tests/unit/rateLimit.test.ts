import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import fresh module each test suite to reset in-memory store
let checkRateLimit: typeof import('@/lib/rateLimit').checkRateLimit
let rateLimitKey: typeof import('@/lib/rateLimit').rateLimitKey

describe('checkRateLimit()', () => {
  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/lib/rateLimit')
    checkRateLimit = mod.checkRateLimit
    rateLimitKey = mod.rateLimitKey
  })

  it('allows requests under the limit', () => {
    const key = 'test-user:test-route'
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5)
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks on the request that exceeds the limit', () => {
    const key = 'user-block:route'
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5)
    const result = checkRateLimit(key, 5)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('different keys are independent', () => {
    const keyA = 'userA:gen'
    const keyB = 'userB:gen'
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, 5)
    const resultB = checkRateLimit(keyB, 5)
    expect(resultB.allowed).toBe(true)
  })

  it('rateLimitKey builds key from userId and route', () => {
    const key = rateLimitKey('uid-123', 'generate')
    expect(key).toBe('uid-123:generate')
  })

  it('uses a 1-hour window for demo endpoint (3_600_000ms)', () => {
    const key = 'ip-demo:demo'
    const result = checkRateLimit(key, 10, 3_600_000)
    expect(result.allowed).toBe(true)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })
})
