import fs from 'node:fs/promises'
import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { currentOwner } from '@/lib/auth'
import { grantCredits } from '@/lib/credits'
import { countOwners, deleteUser, getUserById, setUserStatus } from '@/lib/db'
import { materialDir } from '@/lib/pipeline'
import { clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_GRANT = 500

/** Disable, enable, or add credits. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await currentOwner()
  if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { id } = await ctx.params
  const target = getUserById(id)
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = (await req.json()) as { status?: 'active' | 'disabled'; credits?: number }
  const ip = clientIp(req)

  if (body.status === 'active' || body.status === 'disabled') {
    // Locking yourself out of your own instance is a support call you cannot
    // make to anyone.
    if (target.id === owner.id && body.status === 'disabled') {
      return NextResponse.json({ error: 'cannot_disable_self' }, { status: 400 })
    }
    setUserStatus(id, body.status)
    recordAudit({
      event: body.status === 'disabled' ? 'user_disabled' : 'user_enabled',
      userId: owner.id,
      ip,
      detail: target.email,
    })
  }

  if (typeof body.credits === 'number' && body.credits !== 0) {
    const delta = Math.round(body.credits)
    if (!Number.isFinite(delta) || Math.abs(delta) > MAX_GRANT) {
      return NextResponse.json({ error: 'invalid_credits' }, { status: 400 })
    }
    grantCredits(id, delta, 'grant:admin')
    recordAudit({ event: 'grant', userId: owner.id, ip, detail: `${target.email} ${delta > 0 ? '+' : ''}${delta}` })
  }

  return NextResponse.json({ ok: true })
}

/**
 * Irreversible. The rows go with the account through `ON DELETE CASCADE`; the
 * rendered PDFs do not, because they live on the volume, so they are removed
 * here. A file that fails to delete must not fail the request — the account is
 * already gone and retrying would 404.
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await currentOwner()
  if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { id } = await ctx.params
  const target = getUserById(id)
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (target.id === owner.id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 })
  }
  if (target.plan === 'owner' && countOwners() <= 1) {
    return NextResponse.json({ error: 'last_owner' }, { status: 400 })
  }

  const materialIds = deleteUser(id)
  for (const materialId of materialIds) {
    await fs.rm(materialDir(materialId), { recursive: true, force: true }).catch((err) => {
      console.error(`[summario] could not remove ${materialId} from disk`, err)
    })
  }

  recordAudit({
    event: 'user_deleted',
    userId: owner.id,
    ip: clientIp(req),
    detail: `${target.email} — ${materialIds.length} material(s)`,
  })
  return NextResponse.json({ ok: true })
}
