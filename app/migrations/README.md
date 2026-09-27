# Migrations

The platform applies every `000N_*.sql` file here through
`wrangler d1 migrations apply --remote`, in order, once. Two consequences decide
what may live in this folder.

**One database is shared by preview and production.** A migration written "just
to test" runs against live data. Keep every change additive.

**Columns added after the first release are applied at runtime instead.** SQLite
has no `ADD COLUMN IF NOT EXISTS`, so a migration file that adds a column will
fail the deploy the moment that column already exists:

```
duplicate column name: target_band: SQLITE_ERROR
```

That is exactly what happened when `0002_profile_sessions.sql` was added. It was
removed, and the columns it described (`users.target_band`, `users.onboarded`,
`users.provider`, `users.provider_id`, `attempts.kind`, `sessions.remember`) are
created by the additive pass in `src/lib/db.server.ts`, which runs
`CREATE TABLE IF NOT EXISTS` first and then each `ALTER TABLE` statement on its
own, swallowing a duplicate-column error and nothing else. That pass is
idempotent, so a fresh database is correct whether or not it has ever been
migrated, and an existing one costs one failed statement per column per process.

So: add a migration file only for something that is genuinely idempotent
(`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). For a new column,
add it to the `ADDITIONS` list in `src/lib/db.server.ts` instead, and say so in
the commit message.
