import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { listInvites, listUsers } from '@/lib/db'
import { inviteState } from '@/lib/invites'
import { tr } from '@/lib/i18n'
import { AdminPanel } from './admin-panel'

export const dynamic = 'force-dynamic'

/**
 * Owner-only, and `notFound()` rather than a 403 so the page's existence stays
 * quiet. The API routes behind it check the same thing for themselves — a UI
 * that hides a button is not access control.
 */
export default async function Admin() {
  const user = await requireUser()
  if (user.plan !== 'owner') notFound()

  const { t, locale } = await tr()

  // The token hash never leaves the server. Nothing here is a secret, but there
  // is no reason to ship a table of hashes to the browser either.
  const invites = listInvites().map((i) => ({
    id: i.id,
    email: i.email,
    note: i.note,
    credits: i.credits,
    created_at: i.created_at,
    state: inviteState(i),
  }))

  const users = listUsers().map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    status: u.status,
    materials: u.materials,
    balance: u.balance,
    last_seen: u.last_seen,
    isSelf: u.id === user.id,
  }))

  return <AdminPanel t={t} locale={locale} users={users} invites={invites} />
}
