import { getDb } from './db'

/**
 * A small fixed-window limiter, backed by SQLite.
 *
 * It used to live in a Map in the server process, which was wrong in a way that
 * mattered: this app redeploys on every push to `main`, and an in-memory counter
 * hands whoever is guessing a fresh budget on every restart. The table is on the
 * same data volume the rest of the state uses, so the count survives a restart —
 * and two containers sharing that volume now count together rather than
 * separately.
 *
 * Still synchronous: better-sqlite3 is, so callers need no change.
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const db = getDb()
  const now = Date.now()

  return db.transaction(() => {
    const row = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as
      | { count: number; reset_at: number }
      | undefined

    if (!row || row.reset_at <= now) {
      db.prepare(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
      ).run(key, now + windowMs)
      sweep(now)
      return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 }
    }

    const count = row.count + 1
    db.prepare('UPDATE rate_limits SET count = ? WHERE key = ?').run(count, key)
    const allowed = count <= max
    return {
      allowed,
      remaining: Math.max(0, max - count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((row.reset_at - now) / 1000),
    }
  })()
}

/** Clears the key after a success, so a legitimate login does not stay penalised. */
export function clearRateLimit(key: string) {
  getDb().prepare('DELETE FROM rate_limits WHERE key = ?').run(key)
}

/** Expired rows would otherwise accumulate for the life of the database. */
function sweep(now: number) {
  getDb().prepare('DELETE FROM rate_limits WHERE reset_at <= ?').run(now)
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
