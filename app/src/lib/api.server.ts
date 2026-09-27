/**
 * The site's own API. Server only.
 *
 * One dispatcher behind /api/*, so the client has a single calling convention
 * and every endpoint can rely on the same auth check. Answer keys never leave
 * this module before an attempt is submitted: the client receives stems and
 * options only, and marking happens here, on the server.
 */
import {
  CONTENT_FACTS,
  LISTENING_STRATEGIES,
  MODULES,
  POLICY,
  READING_STRATEGIES,
  SPEAKING_STRATEGY,
  TRAP_COACHING,
  TRAP_LABELS,
  WRITING_STRATEGY,
  bandFromCriteria,
  cefrForBand,
  getListeningMock,
  getReadingMock,
  getSpeakingMock,
  getWritingMock,
  type ListeningMock,
  type ModuleId,
  type ReadingMock,
  type SpeakingMock,
  type TrapType,
  type WritingMock,
} from "../content";
import { buildDiagnosticPaper } from "../content/diagnostic";
import { READING_POOL } from "../content/reading";
import { LISTENING_POOL } from "../content/listening";
import {
  markSpeakingSet,
  markWritingSet,
  type SpeakingInput,
  type WritingInput,
} from "./rubrics";
import {
  attemptForUser,
  attemptsByKind,
  completedAttempts,
  consumeOauthState,
  deleteSession,
  findUserByEmail,
  finishAttempt,
  insertAttempt,
  insertOauthState,
  itemsForAttempt,
  lastAttemptForModule,
  pruneOauthStates,
  ready,
  saveAttemptItems,
  saveSpeakingMarks,
  saveWritingMarks,
  speakingForAttempt,
  trapTotals,
  trapTotalsByModule,
  typeTotals,
  typeTotalsByModule,
  updateProfile,
  writingForAttempt,
  wrongItems,
  type AttemptDb,
} from "./db.server";
import {
  authenticate,
  currentUser,
  exchangeGoogleCode,
  googleAuthUrl,
  googleConfigured,
  newSalt,
  newToken,
  publicUser,
  registerUser,
  signInWithProvider,
  validateCredentials,
} from "./auth.server";
import {
  gapToTarget,
  pickMockIndex,
  priorityAreas,
  progressScore,
  recommendNext,
  scoreDiagnostic,
  scoreListening,
  scoreReading,
  shuffledOptions,
  summariseModule,
  type AttemptRow,
} from "./engine";

const READING_MOCK_COUNT = 10;
const LISTENING_MOCK_COUNT = 10;
const DRILL_LIMIT = 16;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
}

/** First sentence only: enough for a dashboard card. */
function firstSentence(text: string): string {
  const match = /^[^.!?]+[.!?]/.exec(text);
  return (match ? match[0] : text).trim();
}

function readLabel(module: string, taskType: string): string {
  const table =
    module === "reading"
      ? (READING_STRATEGIES as Record<string, { strategy: string }>)
      : (LISTENING_STRATEGIES as Record<string, { strategy: string }>);
  const found = table[taskType];
  return found ? taskType.replace(/_/g, " ") : taskType.replace(/_/g, " ");
}

function adviceFor(taskType: string): string {
  const reading = (READING_STRATEGIES as Record<string, { strategy: string }>)[taskType];
  if (reading) return firstSentence(reading.strategy);
  const listening = (LISTENING_STRATEGIES as Record<string, { strategy: string }>)[taskType];
  if (listening) return firstSentence(listening.strategy);
  return "Read the strategy for this question type, then drill it until the pattern is automatic.";
}

/* ------------------------------------------------------------- payloads */

function readingPayload(mock: ReadingMock, attemptId: string) {
  return {
    passages: mock.passages,
    questions: mock.questions.map((q) => ({
      n: q.n,
      passage: q.passage,
      type: q.type,
      group: q.group,
      instruction: q.instruction,
      stem: q.stem,
      options: q.options
        ? shuffledOptions(q.options, `${attemptId}:${q.group}:${q.options.join("|")}`)
        : undefined,
    })),
  };
}

function listeningPayload(mock: ListeningMock, attemptId: string) {
  return {
    parts: mock.parts,
    questions: mock.questions.map((q) => ({
      n: q.n,
      part: q.part,
      type: q.type,
      group: q.group,
      instruction: q.instruction,
      stem: q.stem,
      options: q.options
        ? shuffledOptions(q.options, `${attemptId}:${q.group}:${q.options.join("|")}`)
        : undefined,
    })),
  };
}

function writingPayload(mock: WritingMock, only?: "task1" | "task2" | null) {
  const tasks = only ? mock.tasks.filter((task) => `task${task.task}` === only) : mock.tasks;
  return { tasks };
}

function speakingPayload(mock: SpeakingMock) {
  return { part1: mock.part1, part2: mock.part2, part3: mock.part3 };
}

function moduleMockCount(module: ModuleId): number {
  return module === "reading" ? READING_MOCK_COUNT : LISTENING_MOCK_COUNT;
}

/**
 * A drill: a run of questions of one family, drawn from the pool, so a
 * candidate can work the type they are losing marks on instead of sitting
 * another whole paper. Passages and recordings come with their own questions,
 * exactly as they do in a full mock.
 */
function buildDrill(module: ModuleId, types: string[], limit: number) {
  const wanted = new Set(types);
  if (module === "reading") {
    const passages: { index: number; title: string; standfirst: string; paragraphs: string[]; wordCount: number }[] = [];
    const questions: ReturnType<typeof readingPayload>["questions"] = [];
    let n = 1;
    for (const unit of READING_POOL) {
      const taken = unit.questions.filter((q) => wanted.size === 0 || wanted.has(q.type));
      if (taken.length === 0) continue;
      const slot = passages.length + 1;
      passages.push({ ...unit.passage, index: slot });
      for (const q of taken) {
        if (questions.length >= limit) break;
        questions.push({
          n,
          passage: slot,
          type: q.type,
          group: `Questions ${n}`,
          instruction: q.instruction,
          stem: q.stem,
          options: q.options ? shuffledOptions(q.options, `drill:${slot}:${q.group}`) : undefined,
        });
        n += 1;
      }
      if (questions.length >= limit) break;
    }
    return { passages, questions };
  }

  const parts: ReturnType<typeof listeningPayload>["parts"] = [];
  const questions: ReturnType<typeof listeningPayload>["questions"] = [];
  let n = 1;
  for (const unit of LISTENING_POOL) {
    const taken = unit.questions.filter((q) => wanted.size === 0 || wanted.has(q.type));
    if (taken.length === 0) continue;
    const slot = parts.length + 1;
    parts.push({ ...unit.part, part: slot });
    for (const q of taken) {
      if (questions.length >= limit) break;
      questions.push({
        n,
        part: slot,
        type: q.type,
        group: `Question ${n}`,
        instruction: q.instruction,
        stem: q.stem,
        options: q.options ? shuffledOptions(q.options, `drill:${slot}:${q.group}`) : undefined,
      });
      n += 1;
    }
    if (questions.length >= limit) break;
  }
  return { parts, questions };
}

/* ---------------------------------------------------------------- routes */

export async function handleApi(action: string, request: Request): Promise<Response> {
  try {
    const db = await ready();
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const body: Record<string, unknown> =
      method === "POST" ? ((await request.json().catch(() => ({}))) as Record<string, unknown>) : {};

    /* -------------------------------------------------- public endpoints */

    if (action === "auth/providers") {
      // A provider the site cannot authenticate is never advertised, so no
      // button on the account page can lead somewhere that does not work.
      return json({ google: googleConfigured(), apple: false });
    }

    if (action === "auth/google") {
      if (!googleConfigured()) {
        return redirect("/account?error=google-unavailable");
      }
      const state = newToken();
      const now = new Date().toISOString();
      const olderThan = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await pruneOauthStates(db, olderThan);
      await insertOauthState(db, state, now, "/dashboard");
      return redirect(googleAuthUrl(request, state));
    }

    if (action === "auth/google/callback") {
      const state = url.searchParams.get("state") ?? "";
      const code = url.searchParams.get("code") ?? "";
      if (!state || !code) return redirect("/account?error=google-cancelled");
      const stored = await consumeOauthState(db, state);
      if (!stored) return redirect("/account?error=google-state");
      const profile = await exchangeGoogleCode(request, code);
      if (!profile) return redirect("/account?error=google-failed");
      const result = await signInWithProvider(db, "google", profile);
      // The session token is handed over in the fragment, which never reaches a
      // server or a proxy log, and the account page stores it and clears it.
      return redirect(`/account#token=${encodeURIComponent(result.token)}&provider=google`);
    }

    if (action === "content/summary") {
      return json({
        facts: CONTENT_FACTS,
        modules: MODULES.map((module) => ({ id: module.id, title: module.title, minutes: module.minutes })),
        policyHeadline: POLICY.headline,
      });
    }

    if (action === "auth/signup") {
      const input = {
        email: String(body.email ?? ""),
        name: String(body.name ?? ""),
        password: String(body.password ?? ""),
      };
      const problem = validateCredentials(input);
      if (problem) return fail(problem);
      if (await findUserByEmail(db, input.email)) {
        return fail("An account already exists for that email address.");
      }
      // "Keep me signed in" defaults to on, the way account sites normally do it.
      const remember = body.remember === undefined ? true : Boolean(body.remember);
      const created = await registerUser(db, input, remember);
      return json({ ...created, remember });
    }

    if (action === "auth/signin") {
      const remember = body.remember === undefined ? true : Boolean(body.remember);
      const result = await authenticate(
        db,
        {
          email: String(body.email ?? ""),
          password: String(body.password ?? ""),
        },
        remember,
      );
      if (!result) return fail("That email and password do not match an account.", 401);
      return json({ ...result, remember });
    }

    if (action === "auth/signout") {
      const header = request.headers.get("authorization") ?? "";
      const match = /^Bearer\s+(.+)$/i.exec(header.trim());
      if (match) await deleteSession(db, match[1]);
      return json({ ok: true });
    }

    if (action === "auth/me") {
      const user = await currentUser(db, request);
      return json({ user: user ? publicUser(user) : null });
    }

    /* --------------------------------------------------------- signed in */

    const user = await currentUser(db, request);
    if (!user) return json({ error: "unauthorized" }, 401);

    if (action === "profile/set") {
      const targetBand = body.targetBand === undefined ? undefined : Number(body.targetBand);
      const onboarded = body.onboarded === undefined ? undefined : Boolean(body.onboarded);
      if (targetBand !== undefined && (!Number.isFinite(targetBand) || targetBand < 4 || targetBand > 9)) {
        return fail("Choose a target band between 4 and 9.");
      }
      await updateProfile(db, user.id, { targetBand, onboarded });
      const fresh = await currentUser(db, request);
      return json({ user: fresh ? publicUser(fresh) : publicUser(user) });
    }

    if (action === "practice/start") {
      const kind = String(body.kind ?? "mock");
      const module = String(body.module ?? "") as ModuleId;

      /* Level check: the same paper for every candidate. */
      if (kind === "diagnostic") {
        const paper = buildDiagnosticPaper();
        const attemptId = crypto.randomUUID();
        await insertAttempt(db, {
          id: attemptId,
          user_id: user.id,
          module: "reading",
          mock_id: "DIAG",
          mock_title: "Level check",
          status: "in_progress",
          raw_score: null,
          total: null,
          band: null,
          band_text: null,
          duration_sec: null,
          started_at: new Date().toISOString(),
          finished_at: null,
          summary: null,
          kind: "diagnostic",
        });
        return json({
          attemptId,
          module: "diagnostic",
          mockId: "DIAG",
          mockTitle: "Level check",
          focus: "One Reading passage and one Listening Part 1",
          minutes: paper.minutes,
          questions: paper.total,
          note: paper.note,
          payload: {
            passages: paper.passages,
            reading: paper.reading.map((q) => ({
              n: q.n,
              passage: 1,
              type: q.type,
              group: q.group,
              instruction: q.instruction,
              stem: q.stem,
              options: q.options
                ? shuffledOptions(q.options, `${attemptId}:${q.group}:${q.options.join("|")}`)
                : undefined,
            })),
            parts: paper.parts,
            listening: paper.listening.map((q) => ({
              n: q.n,
              part: 1,
              type: q.type,
              group: q.group,
              instruction: q.instruction,
              stem: q.stem,
              options: q.options
                ? shuffledOptions(q.options, `${attemptId}:${q.group}:${q.options.join("|")}`)
                : undefined,
            })),
          },
        });
      }

      /* Focused drill: one family of questions, drawn from the pool. */
      if (kind === "drill") {
        if (module !== "reading" && module !== "listening") {
          return fail("A drill is available for Reading and Listening question types.");
        }
        const types = Array.isArray(body.types) ? (body.types as string[]).map(String) : [];
        const payload = buildDrill(module, types, DRILL_LIMIT);
        const count = module === "reading"
          ? payload.questions.length
          : payload.questions.length;
        if (count === 0) return fail("No questions of that type are in the pool yet.");
        const attemptId = crypto.randomUUID();
        await insertAttempt(db, {
          id: attemptId,
          user_id: user.id,
          module,
          mock_id: `DRILL-${module}`,
          mock_title: types.length ? `Drill: ${types.join(", ")}` : "Drill",
          status: "in_progress",
          raw_score: null,
          total: null,
          band: null,
          band_text: null,
          duration_sec: null,
          started_at: new Date().toISOString(),
          finished_at: null,
          summary: null,
          kind: "drill",
        });
        return json({
          attemptId,
          module,
          mockId: `DRILL-${module}`,
          mockTitle: types.length ? `Drill: ${types.map((t) => t.replace(/_/g, " ")).join(", ")}` : "Drill",
          focus: "Focused practice on one question family",
          minutes: 25,
          questions: count,
          payload,
        });
      }

      if (!MODULES.some((m) => m.id === module)) return fail("Unknown module.");
      const previous = await lastAttemptForModule(db, user.id, module);
      const seed = `${user.id}:${module}:${crypto.randomUUID()}`;

      const startRow = (id: string, mockId: string, mockTitle: string) => ({
        id,
        user_id: user.id,
        module,
        mock_id: mockId,
        mock_title: mockTitle,
        status: "in_progress",
        raw_score: null,
        total: null,
        band: null,
        band_text: null,
        duration_sec: null,
        started_at: new Date().toISOString(),
        finished_at: null,
        summary: null,
        kind: "mock",
      });

      if (module === "reading") {
        const index = pickMockIndex(moduleMockCount(module), seed, mockIndexOf(previous));
        const mock = getReadingMock(`R${String(index + 1).padStart(2, "0")}`);
        const attemptId = crypto.randomUUID();
        await insertAttempt(db, startRow(attemptId, mock.id, mock.title));
        return json({
          attemptId,
          module,
          mockId: mock.id,
          mockTitle: mock.title,
          focus: mock.focus,
          minutes: 60,
          questions: 40,
          note: null,
          payload: readingPayload(mock, attemptId),
        });
      }

      if (module === "listening") {
        const index = pickMockIndex(moduleMockCount(module), seed, mockIndexOf(previous));
        const mock = getListeningMock(`L${String(index + 1).padStart(2, "0")}`);
        const attemptId = crypto.randomUUID();
        await insertAttempt(db, startRow(attemptId, mock.id, mock.title));
        return json({
          attemptId,
          module,
          mockId: mock.id,
          mockTitle: mock.title,
          focus: mock.focus,
          minutes: 30,
          questions: 40,
          note: null,
          payload: listeningPayload(mock, attemptId),
        });
      }

      if (module === "writing") {
        const index = pickMockIndex(10, seed, mockIndexOf(previous));
        const mock = getWritingMock(`W${String(index + 1).padStart(2, "0")}`);
        const only = body.focus === "task1" || body.focus === "task2" ? body.focus : null;
        const attemptId = crypto.randomUUID();
        await insertAttempt(db, startRow(attemptId, mock.id, mock.title));
        return json({
          attemptId,
          module,
          mockId: mock.id,
          mockTitle: mock.title,
          focus: only === "task2" ? "Academic Task 2 only" : only === "task1" ? "Academic Task 1 only" : mock.focus,
          minutes: only ? 40 : 60,
          questions: only ? 1 : 2,
          note: null,
          payload: writingPayload(mock, only),
        });
      }

      const index = pickMockIndex(10, seed, mockIndexOf(previous));
      const mock = getSpeakingMock(`S${String(index + 1).padStart(2, "0")}`);
      const attemptId = crypto.randomUUID();
      await insertAttempt(db, startRow(attemptId, mock.id, mock.title));
      return json({
        attemptId,
        module,
        mockId: mock.id,
        mockTitle: mock.title,
        focus: mock.part1
          .map((set) => set.topic)
          .slice(0, 2)
          .join(" and "),
        minutes: 14,
        questions:
          mock.part1.reduce((t, s) => t + s.questions.length, 0) +
          1 +
          mock.part3.reduce((t, s) => t + s.questions.length, 0),
        note: null,
        payload: speakingPayload(mock),
      });
    }

    if (action === "practice/submit") {
      const attemptId = String(body.attemptId ?? "");
      const attempt = await attemptForUser(db, attemptId, user.id);
      if (!attempt) return fail("That attempt could not be found.", 404);
      if (attempt.status === "completed") return json({ attemptId, alreadyMarked: true });

      const kind = attempt.kind ?? "mock";
      const durationSec = Math.max(
        0,
        Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000),
      );
      const now = new Date().toISOString();
      const answers = (body.answers ?? {}) as Record<string, string>;
      const normalised: Record<number, string> = {};
      for (const [key, value] of Object.entries(answers)) normalised[Number(key)] = String(value ?? "");

      if (kind === "diagnostic") {
        const paper = buildDiagnosticPaper();
        const sheet = scoreDiagnostic(paper, normalised);
        await saveAttemptItems(
          db,
          sheet.items.map((item) => ({
            id: crypto.randomUUID(),
            attempt_id: attemptId,
            user_id: user.id,
            module: item.n <= paper.reading.length ? "reading" : "listening",
            question_no: item.n,
            task_type: item.type,
            question_group: item.group,
            stem: item.stem,
            given: item.given,
            correct: item.correct,
            is_correct: item.isCorrect ? 1 : 0,
            trap: item.trap,
            evidence: item.evidence,
          })),
        );
        await finishAttempt(db, attemptId, {
          status: "completed",
          rawScore: sheet.raw,
          total: sheet.total,
          band: sheet.band,
          bandText: `Indicative band (${sheet.raw}/${sheet.total}, projected to ${sheet.equivalent}/40)`,
          durationSec,
          finishedAt: now,
          summary: JSON.stringify({
            byTrap: sheet.byTrap,
            byType: sheet.byType,
            equivalent: sheet.equivalent,
            indicative: true,
            mode: String(body.mode ?? "heard"),
          }),
        });
        await updateProfile(db, user.id, { onboarded: true });
        return json({ attemptId });
      }

      if (attempt.module === "reading" || attempt.module === "listening") {
        const sheet =
          attempt.module === "reading"
            ? scoreReading(getReadingMock(attempt.mock_id), normalised)
            : scoreListening(getListeningMock(attempt.mock_id), normalised);

        await saveAttemptItems(
          db,
          sheet.items.map((item) => ({
            id: crypto.randomUUID(),
            attempt_id: attemptId,
            user_id: user.id,
            module: attempt.module,
            question_no: item.n,
            task_type: item.type,
            question_group: item.group,
            stem: item.stem,
            given: item.given,
            correct: item.correct,
            is_correct: item.isCorrect ? 1 : 0,
            trap: item.trap,
            evidence: item.evidence,
          })),
        );

        await finishAttempt(db, attemptId, {
          status: "completed",
          rawScore: sheet.raw,
          total: sheet.total,
          band: sheet.band,
          bandText: sheet.bandText,
          durationSec,
          finishedAt: now,
          summary: JSON.stringify({
            byTrap: sheet.byTrap,
            byType: sheet.byType,
            mode: attempt.module === "listening" ? String(body.mode ?? "heard") : "heard",
          }),
        });

        return json({ attemptId });
      }

      if (attempt.module === "writing") {
        const mock = getWritingMock(attempt.mock_id);
        const responses = (body.responses ?? []) as WritingInput[];
        const submitted = mock.tasks.filter((task) =>
          responses.some((r) => Number(r.task) === task.task),
        );
        const { marks, overall } = markWritingSet(
          submitted.length ? submitted : mock.tasks,
          (submitted.length ? submitted : mock.tasks).map((task) => ({
            task: task.task,
            text: String(responses.find((r) => Number(r.task) === task.task)?.text ?? ""),
          })),
        );

        await saveWritingMarks(
          db,
          marks.map((mark) => ({
            attempt_id: attemptId,
            user_id: user.id,
            task: mark.task,
            words: mark.words,
            meets_minimum: mark.meetsMinimum ? 1 : 0,
            band: mark.band,
            criteria: JSON.stringify(mark.crit),
            flags: JSON.stringify(mark.flags),
            created_at: now,
          })),
        );

        await finishAttempt(db, attemptId, {
          status: "completed",
          rawScore: marks.reduce((t, m) => t + m.words, 0),
          total: null,
          band: overall,
          bandText: "Writing estimate",
          durationSec,
          finishedAt: now,
          summary: JSON.stringify({
            words: marks.map((m) => ({ task: m.task, words: m.words })),
          }),
        });

        return json({ attemptId });
      }

      const inputs = (body.speaking ?? []) as SpeakingInput[];
      const { marks, overall } = markSpeakingSet(
        inputs.map((input) => ({
          part: Number(input.part ?? 1),
          question: String(input.question ?? ""),
          seconds: Number(input.seconds ?? 0),
          transcript: input.transcript ? String(input.transcript) : null,
        })),
      );

      await saveSpeakingMarks(
        db,
        marks.map((mark) => ({
          attempt_id: attemptId,
          user_id: user.id,
          part: mark.part,
          question: mark.question,
          seconds: mark.seconds,
          words: mark.words,
          transcript: mark.transcript,
          band: mark.band,
          criteria: JSON.stringify(mark.crit),
          created_at: now,
        })),
      );

      await finishAttempt(db, attemptId, {
        status: "completed",
        rawScore: marks.filter((m) => m.transcript).length,
        total: marks.length,
        band: overall,
        bandText: "Speaking estimate",
        durationSec,
        finishedAt: now,
        summary: JSON.stringify({ answers: marks.length }),
      });

      return json({ attemptId });
    }

    if (action === "practice/list") {
      const rows = await completedAttempts(db, user.id, 40);
      return json({
        attempts: rows.map((row) => ({
          id: row.id,
          module: row.module,
          kind: row.kind ?? "mock",
          mockTitle: row.mock_title,
          band: row.band,
          rawScore: row.raw_score,
          total: row.total,
          durationSec: row.duration_sec,
          finishedAt: row.finished_at,
        })),
      });
    }

    if (action === "practice/get") {
      const attemptId = String(body.attemptId ?? "");
      const attempt = await attemptForUser(db, attemptId, user.id);
      if (!attempt) return fail("That attempt could not be found.", 404);

      const items = await itemsForAttempt(db, attemptId);
      const writing = await writingForAttempt(db, attemptId);
      const speaking = await speakingForAttempt(db, attemptId);
      const history = await completedAttempts(db, user.id, 40);
      const rows = history.map(toAttemptRow);
      const summary = attempt.summary ? JSON.parse(attempt.summary) : null;
      const trapTop = (summary?.byTrap?.[0]?.trap ?? undefined) as TrapType | undefined;
      const isDiagnostic = (attempt.kind ?? "mock") === "diagnostic";

      const typeRows = await typeTotalsByModule(db, user.id);
      const areas = priorityAreas(typeRows, readLabel, adviceFor).slice(0, 6);

      return json({
        attempt: {
          id: attempt.id,
          module: attempt.module,
          kind: attempt.kind ?? "mock",
          mockTitle: attempt.mock_title,
          status: attempt.status,
          rawScore: attempt.raw_score,
          total: attempt.total,
          band: attempt.band,
          bandText: attempt.band_text,
          durationSec: attempt.duration_sec,
          startedAt: attempt.started_at,
          finishedAt: attempt.finished_at,
          summary,
        },
        items,
        writing: writing.map((row) => ({
          task: row.task,
          words: row.words,
          meetsMinimum: Boolean(row.meets_minimum),
          band: row.band,
          criteria: row.criteria ? JSON.parse(row.criteria) : [],
          flags: row.flags ? JSON.parse(row.flags) : [],
        })),
        speaking: speaking.map((row) => ({
          part: row.part,
          question: row.question,
          seconds: row.seconds,
          words: row.words,
          transcript: row.transcript,
          band: row.band,
          criteria: row.criteria ? JSON.parse(row.criteria) : [],
        })),
        cefr: attempt.band === null ? null : cefrForBand(attempt.band),
        areas: isDiagnostic ? areas : [],
        recommendation:
          attempt.band === null
            ? null
            : recommendNext(
                { module: attempt.module as ModuleId, band: attempt.band, trapTop },
                rows.map((r) => ({ module: r.module as ModuleId, band: r.band ?? 0 })),
              ),
      });
    }

    if (action === "analytics/get") {
      const history = await completedAttempts(db, user.id, 80);
      const rows = history.map(toAttemptRow);
      const modules = MODULES.map((m) => summariseModule(m.id, rows));
      const withData = modules.filter((m) => m.attempts > 0);
      const overall = withData.length ? bandFromCriteria(withData.map((m) => m.latest)) : 0;
      const traps = await trapTotals(db, user.id);
      const types = await typeTotals(db, user.id);
      const byModule = await typeTotalsByModule(db, user.id);
      const byModuleTraps = await trapTotalsByModule(db, user.id);
      const kinds = await attemptsByKind(db, user.id);
      const areas = priorityAreas(byModule, readLabel, adviceFor);
      const target = user.target_band ?? null;
      const baseline = history.length
        ? history[history.length - 1].band ?? 0
        : 0;

      return json({
        modules,
        overall,
        overallIsEstimate: true,
        diagnostic: kinds.find((k) => k.kind === "diagnostic")?.count ?? 0,
        targetBand: target,
        targetPresets: true,
        obtained: overall,
        cefr: overall > 0 ? cefrForBand(overall) : null,
        gap: target && overall > 0 ? gapToTarget(overall, target) : null,
        progress:
          target && overall > 0 ? progressScore(overall, target, baseline) : null,
        totals: {
          attempts: rows.length,
          minutes: Math.round(rows.reduce((t, r) => t + (r.duration_sec ?? 0), 0) / 60),
          questionsAnswered: types.reduce((t, row) => t + row.total, 0),
          mistakes: types.reduce((t, row) => t + (row.total - row.correct), 0),
        },
        traps: traps.map((t) => ({
          trap: t.trap,
          count: t.count,
          label: t.trap ? TRAP_LABELS[t.trap as TrapType] ?? t.trap : "Unclassified",
          coaching: t.trap ? TRAP_COACHING[t.trap as TrapType] ?? "" : "",
        })),
        trapsByModule: byModuleTraps.map((t) => ({
          module: t.module,
          trap: t.trap,
          count: t.count,
          label: t.trap ? TRAP_LABELS[t.trap as TrapType] ?? t.trap : "Unclassified",
          coaching: t.trap ? TRAP_COACHING[t.trap as TrapType] ?? "" : "",
        })),
        types: types.map((t) => ({
          type: t.task_type,
          correct: t.correct,
          total: t.total,
          rate: t.total ? Math.round((t.correct / t.total) * 100) : 0,
        })),
        areas,
        weakestModule:
          withData.length > 1 ? withData.reduce((a, b) => (b.latest < a.latest ? b : a)).module : withData[0]?.module ?? null,
      });
    }

    if (action === "practice/strategy") {
      const module = String(body.module ?? "reading");
      const taskType = String(body.taskType ?? "");
      if (module === "reading" || module === "listening") {
        const table =
          module === "reading"
            ? (READING_STRATEGIES as Record<string, unknown>)
            : (LISTENING_STRATEGIES as Record<string, unknown>);
        const strategy = table[taskType];
        if (!strategy) return fail("No strategy is stored for that question type.", 404);
        return json({ module, taskType, strategy });
      }
      if (module === "writing") {
        return json({
          module,
          taskType,
          strategy: taskType === "task1" ? WRITING_STRATEGY.task1 : WRITING_STRATEGY.task2,
        });
      }
      if (module === "speaking") {
        const key = taskType as "part1" | "part2" | "part3";
        return json({
          module,
          taskType,
          strategy: SPEAKING_STRATEGY[key] ?? SPEAKING_STRATEGY.part1,
        });
      }
      return fail("Unknown module.");
    }

    if (action === "mistakes/get") {
      const filters = {
        module: body.module ? String(body.module) : undefined,
        trap: body.trap ? String(body.trap) : undefined,
        taskType: body.taskType ? String(body.taskType) : undefined,
      };
      const rows = await wrongItems(db, user.id, filters, 200);
      return json({
        items: rows.map((row) => ({
          id: row.id,
          attemptId: row.attempt_id,
          module: row.module,
          questionNo: row.question_no,
          taskType: row.task_type,
          group: row.question_group,
          stem: row.stem,
          given: row.given,
          correct: row.correct,
          trap: row.trap,
          trapLabel: row.trap ? TRAP_LABELS[row.trap as TrapType] ?? row.trap : "Unclassified",
          coach: row.trap ? TRAP_COACHING[row.trap as TrapType] ?? "" : "",
          evidence: row.evidence,
        })),
      });
    }

    if (action === "recommend/get") {
      const history = await completedAttempts(db, user.id, 40);
      const latest = history[0];
      if (!latest) {
        return json({
          recommendation: {
            headline: "Start with the level check",
            body: "Twenty minutes tells the engine which question types are costing you marks, so the practice that follows is aimed rather than general.",
            actionLabel: "Take the level check",
            actionHref: "/diagnostic",
          },
        });
      }
      const summary = latest.summary ? JSON.parse(latest.summary) : null;
      return json({
        recommendation: recommendNext(
          {
            module: latest.module as ModuleId,
            band: latest.band ?? 0,
            trapTop: summary?.byTrap?.[0]?.trap as TrapType | undefined,
          },
          history.slice(1).map((r) => ({ module: r.module as ModuleId, band: r.band ?? 0 })),
        ),
      });
    }

    if (action === "content/policy") {
      return json({ policy: POLICY });
    }

    return fail("Unknown endpoint.", 404);
  } catch (error) {
    console.error("api error", action, error);
    return json({ error: "Something went wrong on the server. Try again." }, 500);
  }
}

function mockIndexOf(attempt: AttemptDb | null): number | null {
  if (!attempt) return null;
  const digits = attempt.mock_id.replace(/\D/g, "");
  const index = Number(digits) - 1;
  return Number.isFinite(index) && index >= 0 ? index : null;
}

function toAttemptRow(row: AttemptDb): AttemptRow {
  return {
    id: row.id,
    module: row.module,
    mock_id: row.mock_id,
    mock_title: row.mock_title,
    band: row.band,
    raw_score: row.raw_score,
    total: row.total,
    duration_sec: row.duration_sec,
    finished_at: row.finished_at,
  };
}

/** Exposed so a future route can mint a one-off salt without touching auth. */
export const authHelpers = { newSalt, newToken };
