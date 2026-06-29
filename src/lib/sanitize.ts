const HTML_TAGS = /<[^>]*>/g
const NULL_BYTES = /\0/g
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

export function sanitize(value: unknown, maxLength = 5000): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(NULL_BYTES, '')
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAGS, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeShort(value: unknown): string {
  return sanitize(value, 500)
}

export function sanitizeMedium(value: unknown): string {
  return sanitize(value, 2000)
}

export function sanitizeObj<T extends Record<string, unknown>>(
  obj: T,
  limits: Partial<Record<keyof T, number>> = {},
): { [K in keyof T]: string } {
  const result = {} as { [K in keyof T]: string }
  for (const key in obj) {
    const limit = limits[key] ?? 5000
    result[key] = sanitize(obj[key], limit)
  }
  return result
}
