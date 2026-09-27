/**
 * Storage layer. Server only.
 *
 * The site runs its own product accounts (not Higgsfield accounts), so users,
 * sessions, attempts, answer records and rubric marks all live in this app's own
 * D1 database. The schema is created additively on first use and mirrors
 * migrations/0001_init.sql, so a fresh database is correct whether the platform
 * migration ran or not.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { bindings } from "./bindings.server";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  salt: string;
  iterations: number;
  created_at: string;
  target_band: number | null;
  onboarded: number | null;
  provider: string | null;
  provider_id: string | null;
};

export type AttemptDb = {
  id: string;
  user_id: string;
  module: string;
  mock_id: string;
  mock_title: string;
  status: string;
  raw_score: number | null;
  total: number | null;
  band: number | null;
  band_text: string | null;
  duration_sec: number | null;
  started_at: string;
  finished_at: string | null;
  summary: string | null;
  /** "mock", "diagnostic" or "drill". */
  kind?: string | null;
};

export type AttemptItemDb = {
  id: string;
  attempt_id: string;
  user_id: string;
  module: string;
  question_no: number;
  task_type: string;
  question_group: string | null;
  stem: string | null;
  given: string | null;
  correct: string | null;
  is_correct: number;
  trap: string | null;
  evidence: string | null;
};

export type WritingMarkDb = {
  attempt_id: string;
  user_id: string;
  task: number;
  words: number | null;
  meets_minimum: number | null;
  band: number | null;
  criteria: string | null;
  flags: string | null;
  created_at: string;
};

export type SpeakingMarkDb = {
  attempt_id: string;
  user_id: string;
  part: number | null;
  question: string | null;
  seconds: number | null;
  words: number | null;
  transcript: string | null;
  band: number | null;
  criteria: string | null;
  created_at: string;
};

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     salt TEXT NOT NULL,
     iterations INTEGER NOT NULL DEFAULT 50000,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     created_at TEXT NOT NULL,
     expires_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS attempts (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     module TEXT NOT NULL,
     mock_id TEXT NOT NULL,
     mock_title TEXT NOT NULL,
     status TEXT NOT NULL,
     raw_score INTEGER,
     total INTEGER,
     band REAL,
     band_text TEXT,
     duration_sec INTEGER,
     started_at TEXT NOT NULL,
     finished_at TEXT,
     summary TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS attempt_items (
     id TEXT PRIMARY KEY,
     attempt_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     module TEXT NOT NULL,
     question_no INTEGER NOT NULL,
     task_type TEXT NOT NULL,
     question_group TEXT,
     stem TEXT,
     given TEXT,
     correct TEXT,
     is_correct INTEGER NOT NULL,
     trap TEXT,
     evidence TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS writing_marks (
     attempt_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     task INTEGER NOT NULL,
     words INTEGER,
     meets_minimum INTEGER,
     band REAL,
     criteria TEXT,
     flags TEXT,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS speaking_marks (
     attempt_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     part INTEGER,
     question TEXT,
     seconds REAL,
     words INTEGER,
     transcript TEXT,
     band REAL,
     criteria TEXT,
     created_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_module ON attempts (user_id, module, finished_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_items_attempt ON attempt_items (attempt_id)`,
  `CREATE INDEX IF NOT EXISTS idx_items_user ON attempt_items (user_id, is_correct)`,
  `CREATE TABLE IF NOT EXISTS oauth_states (
     state TEXT PRIMARY KEY,
     created_at TEXT NOT NULL,
     redirect_to TEXT
   )`,
];

/**
 * Columns added after the first release. D1 has no "ADD COLUMN IF NOT EXISTS",
 * so each runs on its own and a duplicate column error is expected and ignored.
 * Additive only: a destructive change would hit live data.
 */
const ADDITIONS: string[] = [
  `ALTER TABLE users ADD COLUMN target_band REAL`,
  `ALTER TABLE users ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN provider TEXT`,
  `ALTER TABLE users ADD COLUMN provider_id TEXT`,
  `ALTER TABLE attempts ADD COLUMN kind TEXT NOT NULL DEFAULT 'mock'`,
  `ALTER TABLE sessions ADD COLUMN remember INTEGER NOT NULL DEFAULT 1`,
];

let schemaReady: Promise<void> | null = null;

export function database(): D1Database {
  const { DB } = bindings();
  if (!DB) {
    throw new Error("This site has no database binding configured.");
  }
  return DB;
}

/** Idempotent: every statement is additive, so this is safe on every request. */
export async function ready(): Promise<D1Database> {
  const db = database();
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
      for (const sql of ADDITIONS) {
        try {
          await db.prepare(sql).run();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!/duplicate column|already exists/i.test(message)) throw error;
        }
      }
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
  return db;
}

/* ------------------------------------------------------------------ users */

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare("SELECT * FROM users WHERE email = ?1")
    .bind(email.trim().toLowerCase())
    .first<UserRow>();
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?1").bind(id).first<UserRow>();
}

export async function insertUser(db: D1Database, row: UserRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, salt, iterations, created_at,
        target_band, onboarded, provider, provider_id)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      row.id,
      row.email,
      row.name,
      row.password_hash,
      row.salt,
      row.iterations,
      row.created_at,
      row.target_band,
      row.onboarded,
      row.provider,
      row.provider_id,
    )
    .run();
}

/* ------------------------------------------------------ profile + provider */

export async function updateProfile(
  db: D1Database,
  userId: string,
  patch: { targetBand?: number | null; onboarded?: boolean },
): Promise<void> {
  if (patch.targetBand !== undefined) {
    await db
      .prepare("UPDATE users SET target_band = ?2 WHERE id = ?1")
      .bind(userId, patch.targetBand)
      .run();
  }
  if (patch.onboarded !== undefined) {
    await db
      .prepare("UPDATE users SET onboarded = ?2 WHERE id = ?1")
      .bind(userId, patch.onboarded ? 1 : 0)
      .run();
  }
}

export async function userForProvider(
  db: D1Database,
  provider: string,
  providerId: string,
): Promise<UserRow | null> {
  return db
    .prepare("SELECT * FROM users WHERE provider = ?1 AND provider_id = ?2")
    .bind(provider, providerId)
    .first<UserRow>();
}

/** Links a provider identity to an existing account with the same email. */
export async function linkProvider(
  db: D1Database,
  userId: string,
  provider: string,
  providerId: string,
): Promise<void> {
  await db
    .prepare("UPDATE users SET provider = ?2, provider_id = ?3 WHERE id = ?1")
    .bind(userId, provider, providerId)
    .run();
}

export async function insertOauthState(
  db: D1Database,
  state: string,
  createdAt: string,
  redirectTo: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO oauth_states (state, created_at, redirect_to) VALUES (?1, ?2, ?3)")
    .bind(state, createdAt, redirectTo)
    .run();
}

/** One use only: the row is deleted as it is read. */
export async function consumeOauthState(
  db: D1Database,
  state: string,
): Promise<{ created_at: string; redirect_to: string | null } | null> {
  const row = await db
    .prepare("SELECT * FROM oauth_states WHERE state = ?1")
    .bind(state)
    .first<{ created_at: string; redirect_to: string | null }>();
  if (!row) return null;
  await db.prepare("DELETE FROM oauth_states WHERE state = ?1").bind(state).run();
  return row;
}

export async function pruneOauthStates(db: D1Database, olderThan: string): Promise<void> {
  await db.prepare("DELETE FROM oauth_states WHERE created_at < ?1").bind(olderThan).run();
}

/* --------------------------------------------------------------- sessions */
export async function insertSession(
  db: D1Database,
  token: string,
  userId: string,
  createdAt: string,
  expiresAt: string,
  remember = true,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO sessions (token, user_id, created_at, expires_at, remember) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(token, userId, createdAt, expiresAt, remember ? 1 : 0)
    .run();
}

export type SessionRow = {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  remember: number | null;
};

export async function sessionForToken(db: D1Database, token: string): Promise<SessionRow | null> {
  return db.prepare("SELECT * FROM sessions WHERE token = ?1").bind(token).first<SessionRow>();
}

/**
 * Sliding expiry: extends the session only when it has less than half its
 * retention left, so a returning visitor is never asked to sign in again while
 * an active one costs nothing but one no-op statement.
 */
export async function refreshSession(
  db: D1Database,
  token: string,
  threshold: string,
  expiresAt: string,
): Promise<void> {
  await db
    .prepare("UPDATE sessions SET expires_at = ?3 WHERE token = ?1 AND expires_at < ?2")
    .bind(token, threshold, expiresAt)
    .run();
}

export async function userForToken(db: D1Database, token: string): Promise<UserRow | null> {
  const session = await sessionForToken(db, token);
  if (!session) return null;
  if (session.expires_at < new Date().toISOString()) {
    await db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
    return null;
  }
  return findUserById(db, session.user_id);
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
}

/* --------------------------------------------------------------- attempts */

export async function insertAttempt(
  db: D1Database,
  row: AttemptDb & { kind?: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO attempts (id, user_id, module, mock_id, mock_title, status, raw_score, total,
        band, band_text, duration_sec, started_at, finished_at, summary, kind)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
    )
    .bind(
      row.id,
      row.user_id,
      row.module,
      row.mock_id,
      row.mock_title,
      row.status,
      row.raw_score,
      row.total,
      row.band,
      row.band_text,
      row.duration_sec,
      row.started_at,
      row.finished_at,
      row.summary,
      row.kind ?? "mock",
    )
    .run();
}

export async function finishAttempt(
  db: D1Database,
  id: string,
  patch: {
    status: string;
    rawScore: number | null;
    total: number | null;
    band: number | null;
    bandText: string | null;
    durationSec: number | null;
    finishedAt: string;
    summary: string;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE attempts SET status = ?2, raw_score = ?3, total = ?4, band = ?5, band_text = ?6,
        duration_sec = ?7, finished_at = ?8, summary = ?9 WHERE id = ?1`,
    )
    .bind(
      id,
      patch.status,
      patch.rawScore,
      patch.total,
      patch.band,
      patch.bandText,
      patch.durationSec,
      patch.finishedAt,
      patch.summary,
    )
    .run();
}

export async function saveAttemptItems(
  db: D1Database,
  rows: AttemptItemDb[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          `INSERT INTO attempt_items (id, attempt_id, user_id, module, question_no, task_type,
            question_group, stem, given, correct, is_correct, trap, evidence)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
        )
        .bind(
          r.id,
          r.attempt_id,
          r.user_id,
          r.module,
          r.question_no,
          r.task_type,
          r.question_group,
          r.stem,
          r.given,
          r.correct,
          r.is_correct,
          r.trap,
          r.evidence,
        ),
    ),
  );
}

export async function saveWritingMarks(db: D1Database, rows: WritingMarkDb[]): Promise<void> {
  if (rows.length === 0) return;
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          `INSERT INTO writing_marks (attempt_id, user_id, task, words, meets_minimum, band, criteria, flags, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
        )
        .bind(
          r.attempt_id,
          r.user_id,
          r.task,
          r.words,
          r.meets_minimum,
          r.band,
          r.criteria,
          r.flags,
          r.created_at,
        ),
    ),
  );
}

export async function saveSpeakingMarks(db: D1Database, rows: SpeakingMarkDb[]): Promise<void> {
  if (rows.length === 0) return;
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          `INSERT INTO speaking_marks (attempt_id, user_id, part, question, seconds, words, transcript, band, criteria, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          r.attempt_id,
          r.user_id,
          r.part,
          r.question,
          r.seconds,
          r.words,
          r.transcript,
          r.band,
          r.criteria,
          r.created_at,
        ),
    ),
  );
}

export async function attemptForUser(
  db: D1Database,
  id: string,
  userId: string,
): Promise<AttemptDb | null> {
  return db
    .prepare("SELECT * FROM attempts WHERE id = ?1 AND user_id = ?2")
    .bind(id, userId)
    .first<AttemptDb>();
}

export async function itemsForAttempt(db: D1Database, attemptId: string): Promise<AttemptItemDb[]> {
  const result = await db
    .prepare("SELECT * FROM attempt_items WHERE attempt_id = ?1 ORDER BY question_no ASC")
    .bind(attemptId)
    .all<AttemptItemDb>();
  return result.results ?? [];
}

export async function writingForAttempt(db: D1Database, attemptId: string): Promise<WritingMarkDb[]> {
  const result = await db
    .prepare("SELECT * FROM writing_marks WHERE attempt_id = ?1 ORDER BY task ASC")
    .bind(attemptId)
    .all<WritingMarkDb>();
  return result.results ?? [];
}

export async function speakingForAttempt(db: D1Database, attemptId: string): Promise<SpeakingMarkDb[]> {
  const result = await db
    .prepare("SELECT * FROM speaking_marks WHERE attempt_id = ?1 ORDER BY part ASC, rowid ASC")
    .bind(attemptId)
    .all<SpeakingMarkDb>();
  return result.results ?? [];
}

export async function completedAttempts(db: D1Database, userId: string, limit = 60): Promise<AttemptDb[]> {
  const result = await db
    .prepare(
      `SELECT * FROM attempts WHERE user_id = ?1 AND status = 'completed'
       ORDER BY finished_at DESC, started_at DESC LIMIT ?2`,
    )
    .bind(userId, limit)
    .all<AttemptDb>();
  return result.results ?? [];
}

export async function lastAttemptForModule(
  db: D1Database,
  userId: string,
  module: string,
): Promise<AttemptDb | null> {
  return db
    .prepare(
      `SELECT * FROM attempts WHERE user_id = ?1 AND module = ?2
       ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(userId, module)
    .first<AttemptDb>();
}

export async function wrongItems(
  db: D1Database,
  userId: string,
  filters: { module?: string; trap?: string; taskType?: string },
  limit = 200,
): Promise<AttemptItemDb[]> {
  const clauses = ["user_id = ?1", "is_correct = 0"];
  const values: (string | number)[] = [userId];
  if (filters.module) {
    values.push(filters.module);
    clauses.push(`module = ?${values.length}`);
  }
  if (filters.trap) {
    values.push(filters.trap);
    clauses.push(`trap = ?${values.length}`);
  }
  if (filters.taskType) {
    values.push(filters.taskType);
    clauses.push(`task_type = ?${values.length}`);
  }
  values.push(limit);
  const result = await db
    .prepare(
      `SELECT * FROM attempt_items WHERE ${clauses.join(" AND ")}
       ORDER BY rowid DESC LIMIT ?${values.length}`,
    )
    .bind(...values)
    .all<AttemptItemDb>();
  return result.results ?? [];
}

export async function trapTotals(
  db: D1Database,
  userId: string,
): Promise<{ trap: string | null; count: number }[]> {
  const result = await db
    .prepare(
      `SELECT trap, COUNT(*) AS count FROM attempt_items
       WHERE user_id = ?1 AND is_correct = 0 GROUP BY trap ORDER BY count DESC`,
    )
    .bind(userId)
    .all<{ trap: string | null; count: number }>();
  return result.results ?? [];
}

export async function typeTotals(
  db: D1Database,
  userId: string,
): Promise<{ task_type: string; correct: number; total: number }[]> {
  const result = await db
    .prepare(
      `SELECT task_type, SUM(is_correct) AS correct, COUNT(*) AS total FROM attempt_items
       WHERE user_id = ?1 GROUP BY task_type ORDER BY total DESC`,
    )
    .bind(userId)
    .all<{ task_type: string; correct: number; total: number }>();
  return result.results ?? [];
}

/** The same breakdown, split by module, which is what drives priority areas. */
export async function typeTotalsByModule(
  db: D1Database,
  userId: string,
): Promise<{ module: string; task_type: string; correct: number; total: number }[]> {
  const result = await db
    .prepare(
      `SELECT module, task_type, SUM(is_correct) AS correct, COUNT(*) AS total FROM attempt_items
       WHERE user_id = ?1 GROUP BY module, task_type ORDER BY total DESC`,
    )
    .bind(userId)
    .all<{ module: string; task_type: string; correct: number; total: number }>();
  return result.results ?? [];
}

export async function trapTotalsByModule(
  db: D1Database,
  userId: string,
): Promise<{ module: string; trap: string | null; count: number }[]> {
  const result = await db
    .prepare(
      `SELECT module, trap, COUNT(*) AS count FROM attempt_items
       WHERE user_id = ?1 AND is_correct = 0 GROUP BY module, trap ORDER BY count DESC`,
    )
    .bind(userId)
    .all<{ module: string; trap: string | null; count: number }>();
  return result.results ?? [];
}

export async function attemptsByKind(db: D1Database, userId: string): Promise<{ kind: string; count: number }[]> {
  const result = await db
    .prepare(
      `SELECT COALESCE(kind, 'mock') AS kind, COUNT(*) AS count FROM attempts
       WHERE user_id = ?1 AND status = 'completed' GROUP BY kind`,
    )
    .bind(userId)
    .all<{ kind: string; count: number }>();
  return result.results ?? [];
}
