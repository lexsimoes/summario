import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { hashPassword, startSession } from '@/lib/auth'
import { grantCredits } from '@/lib/credits'
import { claimInviteForNewUser, emailTaken, getInviteByHash } from '@/lib/db'
import { hashToken, isClaimable } from '@/lib/invites'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/** A token is 32 random bytes; nobody guesses one. This is here for the flood. */
const MAX_ATTEMPTS = 10
const WINDOW_MS = 10 * 60 * 1000

export const MIN_PASSWORD = 10

export async function POST(req: Request) {
  const ip = clientIp(req)
  if (!rateLimit(`join:ip:${ip}`, MAX_ATTEMPTS, WINDOW_MS).allowed) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 })
  }

  const body = (await req.json()) as {
    token?: string; email?: string; name?: string; password?: string
  }
  const token = body.token?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const name = (body.name ?? '').trim().slice(0, 80)

  if (!token || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: 'weak_password' }, { status: 400 })
  }

  const invite = getInviteByHash(hashToken(token))
  if (!invite || !isClaimable(invite)) {
    return NextResponse.json({ error: 'invite_invalid' }, { status: 400 })
  }
  // An invite addressed to someone is for that person, not for whoever the link
  // reached. An invite with no email accepts any.
  if (invite.email && invite.email !== email) {
    return NextResponse.json({ error: 'invite_wrong_email' }, { status: 400 })
  }
  // An invite must never touch an account that already exists. The insert would
  // fail on the UNIQUE index anyway; this turns a 500 into an honest answer.
  if (emailTaken(email)) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }

  const id = randomUUID()

  // One transaction: the account exists and the invite is spent, or neither.
  if (!claimInviteForNewUser(invite.id, { id, email, name, passwordHash: hashPassword(password) })) {
    return NextResponse.json({ error: 'invite_invalid' }, { status: 400 })
  }

  if (invite.credits > 0) grantCredits(id, invite.credits, 'grant:invite')

  await startSession(id)
  recordAudit({ event: 'invite_claimed', userId: id, ip, detail: `${email} — ${invite.credits} credits` })
  return NextResponse.json({ ok: true })
}
