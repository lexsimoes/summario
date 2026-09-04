import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config'
import type {
  DerivativesStatus, DocumentType, JobKind, LanguageMode, SourceKind, Status, StudySet, Theme,
} from './types'

let db: Database.Database | null = null

export function getDb() {
  if (db) return db
  fs.mkdirSync(config.dataDir, { recursive: true })
  db = new Database(path.join(config.dataDir, 'summario.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  migrate(db)
  return db
}

/**
 * Idempotent schema changes for databases created by an earlier version.
 * `CREATE TABLE IF NOT EXISTS` never alters an existing table, so anything added
 * after the first deploy has to be applied here or a live instance keeps the old
 * shape and the app breaks on a column that is not there.
 */
function migrate(db: Database.Database) {
  const columns = new Set(
    (db.prepare('PRAGMA table_info(materials)').all() as { name: string }[]).map((c) => c.name),
  )

  // `family` was a machine-learning taxonomy the user had to pick from; it only
  // ever chose an accent colour, and the colour is derived from the topic now.
  if (columns.has('family') && !columns.has('theme')) {
    db.exec("ALTER TABLE materials RENAME COLUMN family TO theme")
    db.exec("UPDATE materials SET theme = 'violet' WHERE theme NOT IN ('violet','teal','cyan','crimson')")
  }
  if (!columns.has('source_kind')) {
    db.exec("ALTER TABLE materials ADD COLUMN source_kind TEXT NOT NULL DEFAULT 'upload'")
  }
  if (!columns.has('sources')) {
    db.exec('ALTER TABLE materials ADD COLUMN sources TEXT')
  }
  if (!columns.has('model')) {
    db.exec("ALTER TABLE materials ADD COLUMN model TEXT NOT NULL DEFAULT ''")
    db.exec('DROP INDEX IF EXISTS materials_identity')
    db.exec('CREATE UNIQUE INDEX materials_identity ON materials(user_id, topic, language, document_type, model)')
  }
  if (!columns.has('api_cost_usd')) {
    db.exec('ALTER TABLE materials ADD COLUMN api_cost_usd REAL')
  }
  if (!columns.has('searches')) {
    db.exec('ALTER TABLE materials ADD COLUMN searches INTEGER NOT NULL DEFAULT 0')
  }
  if (!columns.has('sandbox')) {
    db.exec('ALTER TABLE materials ADD COLUMN sandbox INTEGER NOT NULL DEFAULT 0')
  }

  // The derived study set (flashcards + quiz + project briefs) is generated on
  // demand from a finished guide, so a material tracks its own derivative state.
  if (!columns.has('derivatives_status')) {
    db.exec("ALTER TABLE materials ADD COLUMN derivatives_status TEXT NOT NULL DEFAULT 'none'")
  }
  if (!columns.has('derivatives_error')) {
    db.exec('ALTER TABLE materials ADD COLUMN derivatives_error TEXT')
  }

  const userColumns = new Set(
    (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name),
  )
  if (!userColumns.has('status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'")
  }

  const quizColumns = new Set(
    (db.prepare('PRAGMA table_info(quiz_questions)').all() as { name: string }[]).map((c) => c.name),
  )
  // Concept tag, shared with the flashcards, so a missed question can weight the deck.
  if (!quizColumns.has('concept')) {
    db.exec("ALTER TABLE quiz_questions ADD COLUMN concept TEXT DEFAULT ''")
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  -- 'owner' is never blocked by balance; every other plan is.
  plan TEXT NOT NULL DEFAULT 'member',
  -- 'disabled' keeps every row the account owns and refuses the login. It is the
  -- reversible half of removing someone; deleting is the other, and is separate
  -- on purpose.
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL,
  document_type TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'violet',
  source_kind TEXT NOT NULL DEFAULT 'upload',
  sources TEXT,
  source_file_ref TEXT,
  model TEXT NOT NULL DEFAULT '',
  api_cost_usd REAL,
  searches INTEGER NOT NULL DEFAULT 0,
  sandbox INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  stage_detail TEXT DEFAULT '',
  error TEXT,
  html TEXT,
  pdf_path TEXT,
  page_count INTEGER DEFAULT 0,
  credits_cost INTEGER NOT NULL DEFAULT 1,
  validation TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A material is identified by topic + language + type: the same chapter can
-- exist in several language modes side by side, per user.
CREATE UNIQUE INDEX IF NOT EXISTS materials_identity
  ON materials(user_id, topic, language, document_type, model);
CREATE INDEX IF NOT EXISTS materials_by_user ON materials(user_id, created_at DESC);

-- Append-only. The balance is the sum of deltas, never a mutable column, so
-- the history and the number on screen can never disagree.
CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  material_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ledger_by_user ON credit_ledger(user_id, id DESC);

-- The free allowance is an entitlement, not a credit: it renews every UTC month
-- and never mixes with purchased credits, which remain non-expiring.
CREATE TABLE IF NOT EXISTS free_guide_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  material_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, period)
);

CREATE TABLE IF NOT EXISTS flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  front TEXT NOT NULL, back TEXT NOT NULL, tags TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  question TEXT NOT NULL, answer TEXT NOT NULL,
  explanation TEXT DEFAULT '', trap TEXT DEFAULT '',
  is_multi_select INTEGER DEFAULT 0,
  concept TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  title TEXT NOT NULL, brief TEXT NOT NULL, concepts TEXT NOT NULL DEFAULT ''
);

-- One row per self-graded quiz answer. "Most recent per question" decides which
-- concepts are still weak, which orders the flashcard deck and fills the quiz
-- end screen.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS quiz_attempts_by_material ON quiz_attempts(material_id, user_id, id DESC);

-- Durable work queue. Jobs used to live in the server process's memory, so a
-- restart — a deploy, a crash, an OOM — lost the worker while the material row
-- still said "generating". A row here survives the restart; requeueInterruptedJobs
-- puts anything left mid-flight back on the queue instead of stranding it.
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS jobs_by_status ON jobs(status, id);

-- Fixed-window rate limiting. In the database rather than in a Map so the count
-- survives a restart: an in-memory limiter hands an attacker a fresh budget every
-- time the container recycles, and a redeploy is a routine event here.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- Append-only record of the things worth being able to reconstruct after the
-- fact: who signed in, what was generated, where credits moved.
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  actor_ip TEXT,
  event TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS audit_by_time ON audit_log(id DESC);

-- An invite is a one-time right to create one account with a set credit grant.
-- Only the SHA-256 of the token is stored: the link the owner copies exists in
-- exactly one place, their clipboard, and a database dump grants nobody entry.
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  credits INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  used_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS invites_by_time ON invites(created_at DESC);
`

export interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  plan: 'owner' | 'member'
  status: 'active' | 'disabled'
  created_at: string
}

export interface MaterialRow {
  id: string
  user_id: string
  topic: string
  description: string
  language: LanguageMode
  document_type: DocumentType
  theme: Theme
  source_kind: SourceKind
  sources: string | null
  source_file_ref: string | null
  model: string
  api_cost_usd: number | null
  searches: number
  sandbox: number
  status: Status
  stage_detail: string
  error: string | null
  html: string | null
  pdf_path: string | null
  page_count: number
  credits_cost: number
  validation: string | null
  input_tokens: number
  output_tokens: number
  cached_tokens: number
  derivatives_status: DerivativesStatus
  derivatives_error: string | null
  created_at: string
  updated_at: string
}

export interface LedgerRow {
  id: number
  user_id: string
  delta: number
  reason: string
  material_id: string | null
  created_at: string
}

/* ------------------------------------------------------------------ users */

export const getUserByEmail = (email: string) =>
  getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined

export const getUserById = (id: string) =>
  getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined

export function createUser(u: { id: string; email: string; name: string; passwordHash: string; plan?: 'owner' | 'member' }) {
  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, plan)
       VALUES (@id, @email, @name, @passwordHash, @plan)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name, password_hash = excluded.password_hash, plan = excluded.plan`,
    )
    .run({ ...u, email: u.email.toLowerCase(), plan: u.plan ?? 'member' })
}

/* ------------------------------------------------------- users: admin view */

export interface AdminUserRow extends UserRow {
  materials: number
  balance: number
  last_seen: string | null
}

/**
 * One row per account with the three numbers the owner actually decides on:
 * how much they have made, what they have left, and when they were last here.
 * Correlated subqueries rather than joins — with GROUP BY, a user with two
 * materials and three ledger rows would multiply into six and the sums would
 * both be wrong.
 */
export const listUsers = () =>
  getDb()
    .prepare(
      `SELECT u.*,
              (SELECT COUNT(*) FROM materials m WHERE m.user_id = u.id) AS materials,
              (SELECT COALESCE(SUM(l.delta), 0) FROM credit_ledger l WHERE l.user_id = u.id) AS balance,
              (SELECT MAX(a.created_at) FROM audit_log a WHERE a.user_id = u.id AND a.event = 'login') AS last_seen
         FROM users u
        ORDER BY u.created_at ASC`,
    )
    .all() as AdminUserRow[]

export const emailTaken = (email: string) =>
  Boolean(
    getDb().prepare('SELECT 1 FROM users WHERE email = ?').get(email.toLowerCase().trim()),
  )

export const countOwners = () =>
  (getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE plan = 'owner'").get() as { n: number }).n

export const setUserStatus = (id: string, status: 'active' | 'disabled') =>
  getDb().prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id)

/**
 * Returns the material ids that were removed, because their rendered PDFs live
 * on the volume and the caller has to delete those too. Everything else goes
 * with the row: `ON DELETE CASCADE` plus `foreign_keys = ON` takes the
 * materials, the ledger, the cards and the questions.
 */
export function deleteUser(id: string): string[] {
  const db = getDb()
  const ids = (
    db.prepare('SELECT id FROM materials WHERE user_id = ?').all(id) as { id: string }[]
  ).map((r) => r.id)
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return ids
}

/* ---------------------------------------------------------------- invites */

export interface InviteRow {
  id: string
  token_hash: string
  email: string
  note: string
  credits: number
  created_by: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  revoked_at: string | null
}

export function createInvite(i: {
  id: string; tokenHash: string; email: string; note: string; credits: number
  createdBy: string; expiresAt: string
}) {
  getDb()
    .prepare(
      `INSERT INTO invites (id, token_hash, email, note, credits, created_by, expires_at)
       VALUES (@id, @tokenHash, @email, @note, @credits, @createdBy, @expiresAt)`,
    )
    .run({ ...i, email: i.email.toLowerCase().trim() })
}

export const listInvites = (limit = 100) =>
  getDb().prepare('SELECT * FROM invites ORDER BY created_at DESC LIMIT ?').all(limit) as InviteRow[]

export const getInviteByHash = (tokenHash: string) =>
  getDb().prepare('SELECT * FROM invites WHERE token_hash = ?').get(tokenHash) as InviteRow | undefined

export const getInvite = (id: string) =>
  getDb().prepare('SELECT * FROM invites WHERE id = ?').get(id) as InviteRow | undefined

export const revokeInvite = (id: string) =>
  getDb()
    .prepare("UPDATE invites SET revoked_at = datetime('now') WHERE id = ? AND used_at IS NULL")
    .run(id)

/**
 * Create the account and burn the invite, or do neither.
 *
 * The claim is a conditional UPDATE rather than a read-then-write, because two
 * people opening the same link at the same moment would both pass a separate
 * check and only one of them can have the credits. The insert comes first
 * inside the transaction because `used_by` is a foreign key to the row it
 * creates, and SQLite checks that immediately.
 *
 * Returns false when somebody else got there first; nothing is written.
 */
export function claimInviteForNewUser(
  inviteId: string,
  u: { id: string; email: string; name: string; passwordHash: string },
): boolean {
  const db = getDb()
  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, plan) VALUES (?, ?, ?, ?, 'member')`,
    ).run(u.id, u.email.toLowerCase().trim(), u.name, u.passwordHash)

    const claimed = db
      .prepare(
        `UPDATE invites SET used_at = datetime('now'), used_by = ?
          WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')`,
      )
      .run(u.id, inviteId).changes

    if (!claimed) throw new InviteRaceLost()
    return true
  })

  try {
    return run()
  } catch (err) {
    if (err instanceof InviteRaceLost) return false
    throw err
  }
}

/** Internal signal, used only to roll the transaction above back. */
class InviteRaceLost extends Error {}

/* -------------------------------------------------------------- materials */

export function createMaterial(m: {
  id: string; userId: string; topic: string; description: string; language: LanguageMode
  documentType: DocumentType; theme: Theme; sourceKind: SourceKind
  sourceFileRef?: string; creditsCost: number; model?: string; sandbox?: boolean
}) {
  getDb()
    .prepare(
      `INSERT INTO materials (id, user_id, topic, description, language, document_type, theme, source_kind, source_file_ref, credits_cost, model, sandbox)
       VALUES (@id, @userId, @topic, @description, @language, @documentType, @theme, @sourceKind, @sourceFileRef, @creditsCost, @model, @sandbox)
       ON CONFLICT(user_id, topic, language, document_type, model) DO UPDATE SET
         description = excluded.description, theme = excluded.theme,
         source_kind = excluded.source_kind, sources = NULL,
         source_file_ref = excluded.source_file_ref, credits_cost = excluded.credits_cost,
         sandbox = excluded.sandbox,
         status = 'pending', error = NULL, stage_detail = '', validation = NULL,
         api_cost_usd = NULL, searches = 0,
         updated_at = datetime('now')`,
    )
    .run({ ...m, sourceFileRef: m.sourceFileRef ?? null, model: m.model ?? '', sandbox: m.sandbox ? 1 : 0 })
}

export function updateMaterial(id: string, patch: Partial<MaterialRow>) {
  const keys = Object.keys(patch)
  if (!keys.length) return
  const set = keys.map((k) => `${k} = @${k}`).join(', ')
  getDb().prepare(`UPDATE materials SET ${set}, updated_at = datetime('now') WHERE id = @id`).run({ ...patch, id })
}

export const getMaterial = (id: string) =>
  getDb().prepare('SELECT * FROM materials WHERE id = ?').get(id) as MaterialRow | undefined

export const listMaterials = (userId: string, limit = 200) =>
  getDb()
    .prepare('SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit) as MaterialRow[]

/**
 * Materials sitting in a running state. Called on boot, where the answer is by
 * definition "these were interrupted" — a process that just started cannot have
 * anything in flight.
 */
export const listRunningMaterials = () =>
  getDb()
    .prepare(
      `SELECT * FROM materials
        WHERE status IN ('pending','researching','extracting','planning','generating','rendering','validating')`,
    )
    .all() as MaterialRow[]

export function materialStats(userId: string) {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS docs,
              COALESCE(SUM(page_count), 0) AS pages,
              COALESCE(SUM(input_tokens), 0) AS input_tokens,
              COALESCE(SUM(output_tokens), 0) AS output_tokens,
              COALESCE(SUM(cached_tokens), 0) AS cached_tokens
         FROM materials WHERE user_id = ? AND status = 'done'`,
    )
    .get(userId) as { docs: number; pages: number; input_tokens: number; output_tokens: number; cached_tokens: number }
}

/* ----------------------------------------------------------------- ledger */

export function addLedgerEntry(e: { userId: string; delta: number; reason: string; materialId?: string }) {
  getDb()
    .prepare('INSERT INTO credit_ledger (user_id, delta, reason, material_id) VALUES (?, ?, ?, ?)')
    .run(e.userId, e.delta, e.reason, e.materialId ?? null)
}

export const listLedger = (userId: string, limit = 100) =>
  getDb()
    .prepare('SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?')
    .all(userId, limit) as LedgerRow[]

export function ledgerTotals(userId: string) {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(delta), 0) AS balance,
              COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS spent,
              COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0) AS granted
         FROM credit_ledger WHERE user_id = ?`,
    )
    .get(userId) as { balance: number; spent: number; granted: number }
  return row
}

const utcMonth = () => new Date().toISOString().slice(0, 7)

export function hasMonthlyFreeGuide(userId: string) {
  return !getDb()
    .prepare('SELECT 1 FROM free_guide_usage WHERE user_id = ? AND period = ?')
    .get(userId, utcMonth())
}

/** Atomic because the primary key permits only one reservation per user/month. */
export function claimMonthlyFreeGuide(userId: string, materialId: string) {
  return getDb()
    .prepare('INSERT OR IGNORE INTO free_guide_usage (user_id, period, material_id) VALUES (?, ?, ?)')
    .run(userId, utcMonth(), materialId).changes === 1
}

export function releaseMonthlyFreeGuide(userId: string, materialId: string) {
  getDb().prepare('DELETE FROM free_guide_usage WHERE user_id = ? AND material_id = ?').run(userId, materialId)
}

/* ------------------------------------------------------------------- jobs */

/**
 * How many times a job may be started before a restart that interrupts it again
 * gives up and fails it for good. A job that throws inside its handler is not
 * retried at all — retries here exist only for "the process died mid-run".
 */
export const MAX_JOB_ATTEMPTS = 2

export interface JobRow {
  id: number
  kind: JobKind
  material_id: string
  user_id: string
  payload: string
  status: 'queued' | 'running' | 'done' | 'failed'
  attempts: number
  error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export function enqueueJob(j: { kind: JobKind; materialId: string; userId: string; payload?: unknown }): number {
  const info = getDb()
    .prepare('INSERT INTO jobs (kind, material_id, user_id, payload) VALUES (?, ?, ?, ?)')
    .run(j.kind, j.materialId, j.userId, JSON.stringify(j.payload ?? {}))
  return Number(info.lastInsertRowid)
}

/**
 * Atomically take the oldest queued job. The SELECT and the UPDATE are one
 * transaction so two workers — two containers on the same volume — cannot claim
 * the same row.
 */
export function claimNextJob(): JobRow | undefined {
  const db = getDb()
  return db.transaction(() => {
    const row = db
      .prepare("SELECT * FROM jobs WHERE status = 'queued' ORDER BY id LIMIT 1")
      .get() as JobRow | undefined
    if (!row) return undefined
    db.prepare("UPDATE jobs SET status = 'running', attempts = attempts + 1, started_at = datetime('now') WHERE id = ?").run(row.id)
    return { ...row, status: 'running' as const, attempts: row.attempts + 1 }
  })()
}

export function finishJob(id: number, ok: boolean, error?: string) {
  getDb()
    .prepare("UPDATE jobs SET status = ?, error = ?, finished_at = datetime('now') WHERE id = ?")
    .run(ok ? 'done' : 'failed', error ?? null, id)
}

/**
 * Called once on boot. Anything still `running` was interrupted by the restart:
 * put it back on the queue if it has retries left, otherwise fail it. Returns
 * both sets so the caller can fix up the owning material (resume vs. refund).
 */
export function requeueInterruptedJobs(): { requeued: JobRow[]; abandoned: JobRow[] } {
  const db = getDb()
  const running = db.prepare("SELECT * FROM jobs WHERE status = 'running'").all() as JobRow[]
  const requeued: JobRow[] = []
  const abandoned: JobRow[] = []
  db.transaction(() => {
    for (const job of running) {
      if (job.attempts < MAX_JOB_ATTEMPTS) {
        db.prepare("UPDATE jobs SET status = 'queued', started_at = NULL WHERE id = ?").run(job.id)
        requeued.push(job)
      } else {
        db.prepare("UPDATE jobs SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?")
          .run('Interrupted by a server restart after the retry budget was spent.', job.id)
        abandoned.push(job)
      }
    }
  })()
  return { requeued, abandoned }
}

export const activeJobForMaterial = (materialId: string) =>
  getDb()
    .prepare("SELECT * FROM jobs WHERE material_id = ? AND status IN ('queued','running') ORDER BY id DESC LIMIT 1")
    .get(materialId) as JobRow | undefined

/* ------------------------------------------------------------- study set */

export interface FlashcardRow {
  id: number
  material_id: string
  front: string
  back: string
  /** The concept tag lives in `tags` (the column predates this use). */
  tags: string
}
export interface QuizQuestionRow {
  id: number
  material_id: string
  question: string
  answer: string
  explanation: string
  trap: string
  is_multi_select: number
  concept: string
}
export interface ProjectRow {
  id: number
  material_id: string
  title: string
  brief: string
  /** Comma-joined concept tags. */
  concepts: string
}

/**
 * Swap in a freshly generated study set for a material. One transaction: drop
 * the old cards, questions, project briefs and attempt history, then insert the
 * new set — so a regenerate leaves nothing stale behind.
 */
export function replaceStudySet(materialId: string, set: StudySet) {
  const db = getDb()
  db.transaction(() => {
    for (const table of ['flashcards', 'quiz_questions', 'projects', 'quiz_attempts']) {
      db.prepare(`DELETE FROM ${table} WHERE material_id = ?`).run(materialId)
    }
    const card = db.prepare('INSERT INTO flashcards (material_id, front, back, tags) VALUES (?, ?, ?, ?)')
    for (const c of set.flashcards) card.run(materialId, c.front, c.back, c.concept ?? '')

    const q = db.prepare(
      `INSERT INTO quiz_questions (material_id, question, answer, explanation, trap, is_multi_select, concept)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const x of set.quiz) {
      q.run(materialId, x.question, x.answer, x.explanation ?? '', x.trap ?? '', x.is_multi_select ? 1 : 0, x.concept ?? '')
    }

    const p = db.prepare('INSERT INTO projects (material_id, title, brief, concepts) VALUES (?, ?, ?, ?)')
    for (const x of set.projects) p.run(materialId, x.title, x.brief, (x.concepts ?? []).join(', '))
  })()
}

export const getFlashcards = (materialId: string) =>
  getDb().prepare('SELECT * FROM flashcards WHERE material_id = ? ORDER BY id').all(materialId) as FlashcardRow[]

export const getQuizQuestions = (materialId: string) =>
  getDb().prepare('SELECT * FROM quiz_questions WHERE material_id = ? ORDER BY id').all(materialId) as QuizQuestionRow[]

export const getProjects = (materialId: string) =>
  getDb().prepare('SELECT * FROM projects WHERE material_id = ? ORDER BY id').all(materialId) as ProjectRow[]

export function recordQuizAttempt(a: { materialId: string; userId: string; questionId: number; correct: boolean }) {
  getDb()
    .prepare('INSERT INTO quiz_attempts (material_id, user_id, question_id, correct) VALUES (?, ?, ?, ?)')
    .run(a.materialId, a.userId, a.questionId, a.correct ? 1 : 0)
}

/**
 * Concept tags whose most recent attempt (per question) came out wrong. Drives
 * the flashcard order and the quiz end screen.
 */
export function quizWeakConcepts(materialId: string, userId: string): string[] {
  const rows = getDb()
    .prepare(
      `SELECT q.concept AS concept, a.correct AS correct
         FROM quiz_attempts a
         JOIN quiz_questions q ON q.id = a.question_id
        WHERE a.material_id = @m AND a.user_id = @u
          AND a.id IN (
            SELECT MAX(id) FROM quiz_attempts
             WHERE material_id = @m AND user_id = @u
             GROUP BY question_id
          )`,
    )
    .all({ m: materialId, u: userId }) as { concept: string; correct: number }[]

  const weak = new Set<string>()
  for (const r of rows) if (!r.correct && r.concept) weak.add(r.concept)
  return [...weak]
}
