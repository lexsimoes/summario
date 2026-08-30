import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { InviteRow } from './db'

/** Days a link stays good. Long enough to be read, short enough to expire. */
export const INVITE_DAYS = 7

export const MIN_INVITE_CREDITS = 0
export const MAX_INVITE_CREDITS = 500

/**
 * 32 bytes of randomness, url-safe. Only the hash is stored, so this string
 * exists in the owner's clipboard and nowhere else — losing it means revoking
 * the invite and making another, which is the correct trade.
 */
export function newInviteToken() {
  const token = randomBytes(32).toString('base64url')
  return { id: randomUUID(), token, tokenHash: hashToken(token) }
}

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export function expiryFromNow(days = INVITE_DAYS) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  // SQLite's datetime() format, so string comparison in SQL is chronological.
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export type InviteState = 'pending' | 'used' | 'revoked' | 'expired'

export function inviteState(row: InviteRow, now = new Date()): InviteState {
  if (row.used_at) return 'used'
  if (row.revoked_at) return 'revoked'
  // The column is UTC without a zone marker; say so before parsing it.
  return new Date(row.expires_at.replace(' ', 'T') + 'Z') < now ? 'expired' : 'pending'
}

export const isClaimable = (row: InviteRow) => inviteState(row) === 'pending'
