// Simple in-memory rate limiter — replace with Redis in production
// (e.g., Upstash Redis) for multi-instance deployments

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Fresh window
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: maxRequests - 1, resetAt }
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return {
    success: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  }
}

// Cleanup stale entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
          store.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
}
