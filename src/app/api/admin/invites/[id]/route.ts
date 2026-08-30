import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { currentOwner } from '@/lib/auth'
import { getInvite, revokeInvite } from '@/lib/db'
import { clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/** Revoking is an UPDATE, not a DELETE: the record that it existed is the point. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await currentOwner()
  if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { id } = await ctx.params
  const invite = getInvite(id)
  if (!invite) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'already_used' }, { status: 409 })

  revokeInvite(id)
  recordAudit({
    event: 'invite_revoked',
    userId: owner.id,
    ip: clientIp(req),
    detail: invite.email || 'open link',
  })
  return NextResponse.json({ ok: true })
}
