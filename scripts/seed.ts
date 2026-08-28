/**
 * Create (or reset) the owner account and make sure SESSION_SECRET exists.
 *
 *   npm run seed -- --email you@example.com --password "…" --name "Lex"
 *
 * Re-running it with a new password just resets the password.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { createUser, getUserByEmail, ledgerTotals } from '../src/lib/db'
import { grantCredits, SIGNUP_GRANT } from '../src/lib/credits'
import { hashPassword } from '../src/lib/auth'

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`)
  const v = i > -1 ? process.argv[i + 1] : undefined
  if (v === undefined && fallback === undefined) throw new Error(`Missing --${name}`)
  return v ?? fallback!
}

// A missing SESSION_SECRET would make every login fail with an unhelpful error,
// so generate one into .env before touching the database.
const envPath = path.resolve('.env')
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
if (!/^SESSION_SECRET=.+/m.test(envText)) {
  const secret = randomBytes(32).toString('base64url')
  fs.writeFileSync(envPath, `${envText.trimEnd()}\n\n# Signs the session cookie. Rotating it logs everyone out.\nSESSION_SECRET=${secret}\n`)
  process.env.SESSION_SECRET = secret
  console.log('SESSION_SECRET generated and written to .env')
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
