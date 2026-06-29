// In-memory rate limiter. For multi-instance production, swap for Redis (Upstash).
const store = new Map<string, number[]>()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  store.forEach((timestamps, key) => {
    const filtered = timestamps.filter(t => now - t < windowMs)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  })
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  cleanup(now, windowMs)

  const timestamps = (store.get(key) ?? []).filter(t => now - t < windowMs)
  const remaining = Math.max(0, maxRequests - timestamps.length)
  const allowed = timestamps.length < maxRequests

  if (allowed) {
    timestamps.push(now)
    store.set(key, timestamps)
  }

  return { allowed, remaining: allowed ? remaining - 1 : 0, resetAt: now + windowMs }
}

export function rateLimitKey(userId: string, route: string) {
  return `${userId}:${route}`
}
