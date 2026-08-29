import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { authenticate, startSession } from '@/lib/auth'
import { clearRateLimit, clientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Generous enough that a person who forgot their password never notices, tight
// enough that guessing is pointless. Keyed on the address and on the account, so
// neither a single source nor a distributed attempt on one account gets a free
// run.
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string }
  if (!email || !password) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const ip = clientIp(req)
  const account = email.toLowerCase().trim()
  const limits = [rateLimit(`login:ip:${ip}`, MAX_ATTEMPTS, WINDOW_MS), rateLimit(`login:account:${account}`, MAX_ATTEMPTS, WINDOW_MS)]
  const blocked = limits.find((l) => !l.allowed)

  if (blocked) {
    recordAudit({ event: 'login_throttled', ip, detail: account })
    return NextResponse.json(
      { error: 'too_many_attempts', retryAfterSeconds: blocked.retryAfterSeconds },
      { status: 429, headers: { 'retry-after': String(blocked.retryAfterSeconds) } },
    )
  }

  const user = await authenticate(account, password)
  if (!user) {
    recordAudit({ event: 'login_failed', ip, detail: account })
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  clearRateLimit(`login:ip:${ip}`)
  clearRateLimit(`login:account:${account}`)

  await startSession(user.id)
  recordAudit({ event: 'login', userId: user.id, ip, detail: account })
  return NextResponse.json({ ok: true })
}
