/**
 * Create (or reset) the owner account.
 *
 *   npm run seed -- --email you@example.com --password "…" --name "Lex"
 *
 * Re-running it with a new password just resets the password. The session
 * secret is not needed here — the app generates one on first boot and keeps it
 * on the data volume.
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { createUser, getUserByEmail, ledgerTotals } from '../src/lib/db'
import { grantCredits, SIGNUP_GRANT } from '../src/lib/credits'
import { hashPassword } from '../src/lib/auth'

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`)
  const v = i > -1 ? process.argv[i + 1] : undefined
  if (v === undefined && fallback === undefined) throw new Error(`Missing --${name}`)
  return v ?? fallback!
}

const email = arg('email')
const password = arg('password')
const name = arg('name', email.split('@')[0])
const plan = (arg('plan', 'owner') as 'owner' | 'member')

const existing = getUserByEmail(email)
const id = existing?.id ?? randomUUID()
createUser({ id, email, name, passwordHash: hashPassword(password), plan })

if (!existing) {
  grantCredits(id, SIGNUP_GRANT, 'grant:welcome')
  console.log(`granted ${SIGNUP_GRANT} welcome credits`)
}

const totals = ledgerTotals(id)
console.log(`\n${existing ? 'updated' : 'created'} ${plan} account: ${email}`)
console.log(`balance: ${totals.balance} credits${plan === 'owner' ? ' (owner accounts are never blocked by balance)' : ''}`)
console.log('\nsign in at http://localhost:3000/login\n')
