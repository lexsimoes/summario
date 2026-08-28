import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { config } from './config'
import { getUserByEmail, getUserById, type UserRow } from './db'

const COOKIE = 'summario_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

let cachedSecret: string | null = null

/**
 * SESSION_SECRET if it is set; otherwise one generated on first boot and kept on
 * the data volume.
 *
 * Self-hosting should not require inventing a secret before the app will start —
 * that is a setup step people get wrong or skip. Sessions survive restarts
 * because the file does, and deleting it signs everyone out. Set the env var
 * instead when you want the secret managed outside the volume.
 */
function secret() {
  const fromEnv = process.env.SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 24) return fromEnv
  if (cachedSecret) return cachedSecret

  const file = path.join(config.dataDir, '.session-secret')
  try {
    const existing = fs.readFileSync(file, 'utf8').trim()
    if (existing.length >= 24) return (cachedSecret = existing)
  } catch {
    /* first boot */
  }

  fs.mkdirSync(config.dataDir, { recursive: true })
  cachedSecret = randomBytes(32).toString('base64url')
  fs.writeFileSync(file, cachedSecret, { mode: 0o600 })
  return cachedSecret
}

/* ------------------------------------------------------------- passwords */

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${key}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(key, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

/* -------------------------------------------------------------- sessions */

/** `userId.expiry.hmac` — stateless, signed, and revocable by rotating the secret. */
function sign(userId: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`
  const mac = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

function verify(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, exp, mac] = parts
  const expected = createHmac('sha256', secret()).update(`${userId}.${exp}`).digest('base64url')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  if (Number(exp) < Date.now()) return null
  return userId
}

export async function startSession(userId: string) {
  const expiresAt = Date.now() + MAX_AGE * 1000
  ;(await cookies()).set(COOKIE, sign(userId, expiresAt), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function currentUser(): Promise<UserRow | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const userId = verify(token)
  if (!userId) return null
  return getUserById(userId) ?? null
}

/** For protected server components. Redirects instead of throwing. */
export async function requireUser(): Promise<UserRow> {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}

export async function authenticate(email: string, password: string): Promise<UserRow | null> {
  const user = getUserByEmail(email)
  // Hash a dummy anyway so a missing account and a wrong password take the
  // same time — otherwise the response time enumerates valid emails.
  if (!user) {
    verifyPassword(password, `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`)
    return null
  }
  return verifyPassword(password, user.password_hash) ? user : null
}
