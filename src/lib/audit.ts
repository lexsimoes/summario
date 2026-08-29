import { getDb } from './db'

/**
 * Append-only audit trail.
 *
 * The security posture had a hole shaped like "something happened and there is
 * no way to find out what": sign-ins, generations and credit movements left no
 * record beyond the rows they changed. This is the cheapest fix that makes an
 * incident reconstructable — same volume, same lifetime as everything else.
 *
 * Never write a secret, a password or an API key into `detail`. It is meant to
 * be readable by whoever owns the instance, and it is displayed in the app.
 */
export type AuditEvent =
  | 'login'
  | 'login_failed'
  | 'login_throttled'
  | 'logout'
  | 'generate'
  | 'derive'
  | 'refund'
  | 'grant'

export interface AuditRow {
  id: number
  user_id: string | null
  actor_ip: string | null
  event: AuditEvent
  detail: string | null
  created_at: string
}

export function recordAudit(e: {
  event: AuditEvent
  userId?: string | null
  ip?: string | null
  detail?: string | null
}) {
  try {
    getDb()
      .prepare('INSERT INTO audit_log (user_id, actor_ip, event, detail) VALUES (?, ?, ?, ?)')
      .run(e.userId ?? null, e.ip ?? null, e.event, e.detail ?? null)
  } catch (err) {
    // An audit write must never take down the action it is recording.
    console.error('[summario] audit write failed', err)
  }
}

export const listAudit = (limit = 200) =>
  getDb().prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit) as AuditRow[]
