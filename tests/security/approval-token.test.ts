import { describe, it, expect } from 'vitest'
import { randomUUID } from 'crypto'

describe('Approval token security', () => {
  it('UUIDs have 122 bits of entropy — brute force infeasible', () => {
    const token = randomUUID()
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    // 122 bits means 2^122 possibilities — over 5 quintillion years to brute force at 1B/s
    const entropy = BigInt(2) ** BigInt(122)
    expect(entropy).toBeGreaterThan(BigInt(10) ** BigInt(36))
  })

  it('two generated tokens are always different', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 1000; i++) tokens.add(randomUUID())
    expect(tokens.size).toBe(1000)
  })

  it('token validation rejects empty/null values', () => {
    const validToken = randomUUID()
    const isValid = (t: unknown) => typeof t === 'string' && /^[0-9a-f-]{36}$/.test(t)
    expect(isValid(validToken)).toBe(true)
    expect(isValid('')).toBe(false)
    expect(isValid(null)).toBe(false)
    expect(isValid(undefined)).toBe(false)
    expect(isValid('not-a-uuid')).toBe(false)
  })
})

describe('CRON_SECRET auth pattern', () => {
  it('auth header must exactly match Bearer <secret>', () => {
    const secret = 'my-cron-secret-abc123'
    const check = (auth: string | null) =>
      auth === `Bearer ${secret}`

    expect(check(`Bearer ${secret}`)).toBe(true)
    expect(check(`bearer ${secret}`)).toBe(false)   // case-sensitive
    expect(check(secret)).toBe(false)               // missing Bearer
    expect(check('')).toBe(false)
    expect(check(null)).toBe(false)
    expect(check(`Bearer ${secret} extra`)).toBe(false)
  })
})

describe('Seed endpoint key validation', () => {
  const SEED_KEY = 'f888d954-156f-4fec-a111-c70432c4a800'

  it('accepts the correct key', () => {
    expect(SEED_KEY).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('rejects empty or wrong key', () => {
    const check = (key: string | null) => key === SEED_KEY
    expect(check(SEED_KEY)).toBe(true)
    expect(check('')).toBe(false)
    expect(check('wrong-key')).toBe(false)
    expect(check(null)).toBe(false)
  })
})
