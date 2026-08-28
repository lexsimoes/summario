import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config'
import type { DocumentType, LanguageMode, SourceKind, Status, Theme } from './types'

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
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  -- 'owner' is never blocked by balance; every other plan is.
  plan TEXT NOT NULL DEFAULT 'member',
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
  ON materials(user_id, topic, language, document_type);
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
  is_multi_select INTEGER DEFAULT 0
);
`

export interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  plan: 'owner' | 'member'
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

/* -------------------------------------------------------------- materials */

export function createMaterial(m: {
  id: string; userId: string; topic: string; description: string; language: LanguageMode
  documentType: DocumentType; theme: Theme; sourceKind: SourceKind
  sourceFileRef?: string; creditsCost: number
}) {
  getDb()
    .prepare(
      `INSERT INTO materials (id, user_id, topic, description, language, document_type, theme, source_kind, source_file_ref, credits_cost)
       VALUES (@id, @userId, @topic, @description, @language, @documentType, @theme, @sourceKind, @sourceFileRef, @creditsCost)
       ON CONFLICT(user_id, topic, language, document_type) DO UPDATE SET
         description = excluded.description, theme = excluded.theme,
         source_kind = excluded.source_kind, sources = NULL,
         source_file_ref = excluded.source_file_ref, credits_cost = excluded.credits_cost,
         status = 'pending', error = NULL, stage_detail = '', validation = NULL,
         updated_at = datetime('now')`,
    )
    .run({ ...m, sourceFileRef: m.sourceFileRef ?? null })
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
