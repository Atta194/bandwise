-- D1 schema for Bandwise. Applied by the platform on deploy (app.manifest.json
-- sets "db": true) and mirrored by the additive CREATE TABLE IF NOT EXISTS pass
-- in src/lib/db.server.ts, so a fresh database is correct either way.
--
-- ONE database is shared by preview and prod: keep every change additive.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 50000,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
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
);

CREATE TABLE IF NOT EXISTS attempt_items (
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
);

CREATE TABLE IF NOT EXISTS writing_marks (
  attempt_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task INTEGER NOT NULL,
  words INTEGER,
  meets_minimum INTEGER,
  band REAL,
  criteria TEXT,
  flags TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS speaking_marks (
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
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_module ON attempts (user_id, module, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_attempt ON attempt_items (attempt_id);
CREATE INDEX IF NOT EXISTS idx_items_user ON attempt_items (user_id, is_correct);
