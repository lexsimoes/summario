/**
 * A small fixed-window limiter, in memory.
 *
 * In process on purpose: the app runs as a single container, so a shared store
 * would be a dependency bought for nothing. It is also the honest limit of this
 * design — the day summario runs on two containers, this counts per container
 * and has to move to the database or a cache. That day is the same day the job
 * runner has to become a queue.
 */
interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    sweep(now)
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  const allowed = existing.count <= max
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  }
}

/** Clears the key after a success, so a legitimate login does not stay penalised. */
export function clearRateLimit(key: string) {
  windows.delete(key)
}

/** Expired windows would otherwise accumulate for the life of the process. */
function sweep(now: number) {
  if (windows.size < 500) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

/**
 * Behind Traefik the socket address is the proxy, so the client address comes
 * from the forwarded header. It is spoofable by anyone talking to the app
 * directly, which is why the limiter also keys on the email being tried.
 */
export function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
