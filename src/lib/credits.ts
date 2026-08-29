import { recordAudit } from './audit'
import { addLedgerEntry, getMaterial, ledgerTotals, type UserRow } from './db'
import type { DocumentType } from './types'

/**
 * One credit is one pocket guide. An exam review is roughly twice the document
 * — more questions, longer theory boxes, a 35–50 row cheat sheet — so it costs
 * two. Deliberately simple: users can predict the price before they click.
 */
export const COST: Record<DocumentType, number> = {
  pocket_guide: 1,
  exam_review: 2,
}

export const SIGNUP_GRANT = 4

export interface CreditState {
  balance: number
  spent: number
  granted: number
  unlimited: boolean
}

export function creditState(user: UserRow): CreditState {
  const totals = ledgerTotals(user.id)
  return { ...totals, unlimited: user.plan === 'owner' }
}

export function canAfford(user: UserRow, cost: number) {
  if (user.plan === 'owner') return true
  return ledgerTotals(user.id).balance >= cost
}

/**
 * Charged when a job starts, not when it finishes: a user who closes the tab
 * mid-generation still consumed the tokens. Failures are refunded by
 * `refundCredits` so nobody pays for our bug.
 */
export function chargeCredits(user: UserRow, materialId: string, cost: number) {
  addLedgerEntry({ userId: user.id, delta: -cost, reason: 'generation', materialId })
}

export function refundCredits(userId: string, materialId: string) {
  const material = getMaterial(materialId)
  if (!material) return
  addLedgerEntry({
    userId,
    delta: material.credits_cost,
    reason: 'refund:failed',
    materialId,
  })
  recordAudit({ event: 'refund', userId, detail: `${materialId} (+${material.credits_cost})` })
}

export function grantCredits(userId: string, amount: number, reason: string) {
  addLedgerEntry({ userId, delta: amount, reason })
  recordAudit({ event: 'grant', userId, detail: `${reason} (+${amount})` })
}
