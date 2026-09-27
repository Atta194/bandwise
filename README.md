# Bandwise

An IELTS Academic practice platform: four modules on one test engine, with
marking that explains every wrong answer instead of only counting it.

Live: https://ieltsreadybandpro.higgsfield.app

## What it does

- **Reading** — three passages, 40 questions, one locked 60 minute timer, split
  workspace, passage and question navigation, flagging.
- **Listening** — four parts, 40 questions, each recording playable once per
  attempt, transcript withheld until review.
- **Writing** — Academic Task 1 and Task 2 under one 60 minute timer, Task 2
  weighted twice Task 1, a live word counter against the 150 and 250 minimums.
- **Speaking** — Part 1, a Part 2 cue card with preparation time, then Part 3,
  with in-browser recording and playback.
- **Level check** — a fixed 23 question paper (one Reading passage plus one
  Listening Part 1) in 20 minutes, offered once to every new account. It returns
  an indicative band, the CEFR level and the question types already costing
  marks.
- **Focused practice** — a strategy, three speed tips and a drill for every
  question family, drawn from the same pool and the same answer key as the full
  mocks.
- **The desk** — obtained band, target band, progress from the first result,
  errors filed by trap, tips generated from those errors, and a priority list of
  weak question types with a drill link each.
- **Accounts** — email and password with PBKDF2 hashing, "keep me signed in"
  with sliding sessions, a remembered email, and Google sign in (see below).

Every band shown is an estimate from practice marking, never an official IELTS
score. The app is not affiliated with IELTS, the British Council, IDP or
Cambridge University Press and Assessment.

## How it is built

- React 19 + TanStack Start, server rendered, deployed as one Cloudflare Worker.
- Cloudflare D1 for accounts, sessions, attempts, answer records and rubric
  marks. The schema is applied at runtime by an additive pass in
  `app/src/lib/db.server.ts` (see `app/migrations/README.md` for why new columns
  do not go in a migration file).
- Marking happens on the server: answer keys never reach the browser before an
  attempt is submitted.
- Content lives in `app/src/content/` as data. Reading passages and Listening
  parts sit in a pool, and mock configurations name the units they use, so the
  pool can grow without touching the engine.

## Layout

```
app/                     the application (its own package.json and build)
  src/content/           passages, recordings, questions, rubrics, strategies
  src/lib/               marking engine, rubric engine, storage, auth, API
  src/routes/            pages: landing, account, desk, diagnostics, tests, review
  src/components/        exam interface, charts, progress blocks
  public/                photography (attribution in public/assets/CREDITS.md)
  migrations/            the baseline schema and the migration rules
scripts/check-links.py   verifies every page, every link and every endpoint
scripts/push-to-github.sh  pushes this project to a GitHub account
```

## What is not in this repository

`app/packages/` is not included. It holds vendored copies of the Higgsfield
platform packages (`@higgsfield/fnf`, `@higgsfield/fnf-react`,
`@higgsfield/quanta`) which `app/package.json` references as workspace
dependencies, and they are supplied by the platform that hosts the deployment.
Because of that this copy does not build locally as it stands. The application
source, content, schema and scripts are all here and complete.

## Running it locally

Copy `app/packages/` in from the platform project, then:

```
cd app
bun install
bun run dev
```

For the worker bindings, `app/wrangler.jsonc` is the local development input and
`app/app.manifest.json` declares the storage the site needs (D1). Google sign in
needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set as secrets, with
`https://<your-host>/api/auth/google/callback` registered as an authorised
redirect URI on the OAuth client.

## Verifying a deployment

```
python3 scripts/check-links.py
```

It compares every literal route target in the source against the routes the
router generated, fetches every page, fetches every link it finds, and exercises
every endpoint end to end: sign up, the level check, a focused drill, all four
modules, the profile target, analytics, the mistake lab and the Google start
route.
