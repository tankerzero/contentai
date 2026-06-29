export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'MAD' | 'SAR' | 'CNY' | 'MXN'

export interface Currency {
  code: CurrencyCode
  symbol: string
  flag: string
  name: string
  rateFromCAD: number
}

export const CURRENCIES: Currency[] = [
  { code: 'CAD', symbol: 'CA$', flag: '🇨🇦', name: 'Canadian Dollar', rateFromCAD: 1.00 },
  { code: 'USD', symbol: '$',   flag: '🇺🇸', name: 'US Dollar',        rateFromCAD: 0.74 },
  { code: 'EUR', symbol: '€',   flag: '🇪🇺', name: 'Euro',             rateFromCAD: 0.68 },
  { code: 'GBP', symbol: '£',   flag: '🇬🇧', name: 'British Pound',    rateFromCAD: 0.58 },
  { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', name: 'UAE Dirham',       rateFromCAD: 2.72 },
  { code: 'MAD', symbol: 'DH',  flag: '🇲🇦', name: 'Moroccan Dirham',  rateFromCAD: 7.40 },
  { code: 'SAR', symbol: 'ر.س', flag: '🇸🇦', name: 'Saudi Riyal',      rateFromCAD: 2.77 },
  { code: 'CNY', symbol: '¥',   flag: '🇨🇳', name: 'Chinese Yuan',     rateFromCAD: 5.30 },
  { code: 'MXN', symbol: 'MX$', flag: '🇲🇽', name: 'Mexican Peso',     rateFromCAD: 12.50 },
]

export function detectCurrency(): CurrencyCode {
  if (typeof navigator === 'undefined') return 'USD'
  const locale = navigator.language ?? 'en-US'
  if (locale.startsWith('fr-MA') || locale.toUpperCase().includes('-MA')) return 'MAD'
  if (locale.startsWith('ar-MA')) return 'MAD'
  if (locale.startsWith('ar-SA') || locale.toUpperCase().includes('-SA')) return 'SAR'
  if (locale.startsWith('ar-AE') || locale.toUpperCase().includes('-AE')) return 'AED'
  if (locale.startsWith('ar')) return 'AED'
  if (locale.startsWith('zh') || locale.toUpperCase().includes('-CN')) return 'CNY'
  if (locale.startsWith('es-MX') || locale.toUpperCase().includes('-MX')) return 'MXN'
  if (locale.startsWith('en-CA') || locale.toUpperCase().includes('-CA')) return 'CAD'
  if (locale.startsWith('en-GB') || locale.toUpperCase().includes('-GB')) return 'GBP'
  if (locale.startsWith('fr') || locale.startsWith('de') || locale.startsWith('it') || locale.startsWith('nl')) return 'EUR'
  return 'USD'
}

export function formatPrice(cadPrice: number, currencyCode: CurrencyCode): string {
  const c = CURRENCIES.find(x => x.code === currencyCode)!
  const converted = cadPrice * c.rateFromCAD
  const isWhole = Math.abs(converted - Math.round(converted)) < 0.005
  return `${c.symbol}${isWhole ? Math.round(converted) : converted.toFixed(2)}`
}

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES.find(c => c.code === code)!
}

export function loadCurrency(): CurrencyCode {
  if (typeof localStorage === 'undefined') return detectCurrency()
  const saved = localStorage.getItem('contentai_currency') as CurrencyCode | null
  if (saved && CURRENCIES.some(c => c.code === saved)) return saved
  const detected = detectCurrency()
  localStorage.setItem('contentai_currency', detected)
  return detected
}

export function saveCurrency(code: CurrencyCode): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('contentai_currency', code)
  }
}
