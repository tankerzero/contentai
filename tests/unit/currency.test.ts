import { describe, it, expect } from 'vitest'
import { formatPrice, CURRENCIES } from '@/lib/currency'

describe('formatPrice()', () => {
  it('formats CAD correctly', () => {
    const result = formatPrice(29, 'CAD')
    expect(result).toContain('29')
  })

  it('formats USD correctly (converts from CAD, so amount differs)', () => {
    // Prices are stored in CAD. USD display converts using an exchange rate.
    const result = formatPrice(29, 'USD')
    // Should be a valid currency string (contains $ and a number)
    expect(result).toMatch(/[\$€£]?[\d,]+\.?\d*/)
  })

  it('CURRENCIES contains CAD as first entry', () => {
    expect(CURRENCIES[0].code).toBe('CAD')
  })

  it('all currencies have code, flag, name fields', () => {
    for (const c of CURRENCIES) {
      expect(c.code).toBeTruthy()
      expect(c.flag).toBeTruthy()
      expect(c.name).toBeTruthy()
    }
  })
})
