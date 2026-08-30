import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { currentOwner } from '@/lib/auth'
import { createInvite } from '@/lib/db'
import { clientIp } from '@/lib/rate-limit'
import { expiryFromNow, MAX_INVITE_CREDITS, MIN_INVITE_CREDITS, newInviteToken } from '@/lib/invites'

export const runtime = 'nodejs'

/**
 * Creates an invite and returns the raw token exactly once.
 *
 * Only its hash is stored, so this response is the single moment the link
 * exists. The client composes the URL from its own origin — asking the server
 * to guess its public address behind a reverse proxy is how you end up mailing
 * people a link to localhost.
 */
export async function POST(req: Request) {
  const owner = await currentOwner()
  if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = (await req.json()) as { email?: string; note?: string; credits?: number }
  const email = (body.email ?? '').trim().toLowerCase()
  if (email && !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const credits = Math.round(Number(body.credits ?? 4))
  if (!Number.isFinite(credits) || credits < MIN_INVITE_CREDITS || credits > MAX_INVITE_CREDITS) {
    return NextResponse.json({ error: 'invalid_credits' }, { status: 400 })
  }

  const { id, token, tokenHash } = newInviteToken()
  createInvite({
    id,
    tokenHash,
    email,
    note: (body.note ?? '').trim().slice(0, 120),
    credits,
    createdBy: owner.id,
    expiresAt: expiryFromNow(),
  })

  recordAudit({
    event: 'invite_created',
    userId: owner.id,
    ip: clientIp(req),
    detail: `${email || 'open link'} — ${credits} credits`,
  })

  return NextResponse.json({ ok: true, id, token })
}
