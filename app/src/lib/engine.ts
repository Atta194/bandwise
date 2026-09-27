/**
 * The Test Engine.
 *
 * One shared engine, not four disconnected flows. Every module goes through the
 * same steps: Reset Test picks a mock from the stored set, a clean timed attempt
 * begins, answers are recorded as the candidate works, the attempt is marked
 * against the stored key (Reading and Listening) or the rubric (Writing and
 * Speaking), every error is explained with its trap, the section score and
 * estimated band are calculated, and a next practice is recommended.
 *
 * Nothing here touches the database or the browser: it is pure marking logic,
 * so it runs on the server where the answer keys live.
 */
import {
  READING_SCALE,
  LISTENING_SCALE,
  bandFromRaw,
  bandLabel,
  type AnswerRecord,
  type ListeningMock,
  type ListeningQuestion,
  type ModuleId,
  type ReadingMock,
  type ReadingQuestion,
  type TrapType,
} from "../content";

/* ------------------------------------------------------------ comparison */

const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
  sixty: "60",
  seventy: "70",
  eighty: "80",
  ninety: "90",
  hundred: "100",
  thousand: "1000",
};

function foldNumberWords(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => NUMBER_WORDS[word] ?? word)
    .join(" ");
}

/** Normalise an answer so spelling of numbers and small variants do not lose a mark. */
export function normalise(value: string): string {
  return foldNumberWords(
    value
      .toLowerCase()
      .replace(/[£$]/g, "")
      .replace(/[^a-z0-9\s.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .replace(/\b(the|a|an)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

/** True / False / Yes / No / Not Given all accept the usual short forms. */
const ABBREVIATIONS: Record<string, string> = {
  t: "true",
  f: "false",
  y: "yes",
  n: "no",
  ng: "not given",
  true: "true",
  false: "false",
  yes: "yes",
  no: "no",
  "not given": "not given",
};

function canonicalChoice(value: string): string | null {
  const key = normalise(value);
  return ABBREVIATIONS[key] ?? null;
}

export function markAnswer(
  given: string | undefined,
  answer: string,
  alternatives: string[] | undefined,
): boolean {
  if (given === undefined || given.trim() === "") return false;
  const accepted = [answer, ...(alternatives ?? [])];

  const givenChoice = canonicalChoice(given);
  if (givenChoice) {
    return accepted.some((a) => canonicalChoice(a) === givenChoice);
  }

  const g = normalise(given);
  return accepted.some((a) => normalise(a) === g);
}

/* ------------------------------------------------------------ mock choice */

/** Deterministic hash so a mock choice can be reproduced from a seed. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Reset Test draws a mock. The module normally has ten configurations; the
 * choice avoids the one just used, so a reset always feels like a new paper.
 */
export function pickMockIndex(count: number, seed: string, avoid?: number | null): number {
  if (count <= 0) return 0;
  const base = hash(seed) % count;
  if (avoid === null || avoid === undefined || count <= 1) return base;
  if (base !== avoid) return base;
  return (base + 1 + (hash(`${seed}:again`) % (count - 1))) % count;
}

/**
 * Option order inside a question group is rebuilt per attempt, so the same mock
 * does not present its options in the same order twice. Because a correct answer
 * is stored as the option text rather than a letter, reordering never changes
 * the key, and the seed makes an attempt reproducible.
 */
export function shuffledOptions(options: string[], seed: string): string[] {
  if (options.length < 3) return options;
  return options
    .map((label, i) => ({ label, rank: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label))
    .map((d) => d.label);
}

/* --------------------------------------------------------------- scoring */

export type Scoresheet = {
  items: AnswerRecord[];
  raw: number;
  total: number;
  band: number;
  bandText: string;
  byTrap: { trap: TrapType; count: number }[];
  byType: { type: string; correct: number; total: number }[];
  weakestPassage?: number;
  timePerQuestion?: number;
};

function tally(items: AnswerRecord[]): Pick<Scoresheet, "byTrap" | "byType"> {
  const trapMap = new Map<TrapType, number>();
  const typeMap = new Map<string, { correct: number; total: number }>();
  for (const item of items) {
    if (!item.isCorrect) trapMap.set(item.trap, (trapMap.get(item.trap) ?? 0) + 1);
    const entry = typeMap.get(item.type) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (item.isCorrect) entry.correct += 1;
    typeMap.set(item.type, entry);
  }
  return {
    byTrap: Array.from(trapMap.entries())
      .map(([trap, count]) => ({ trap, count }))
      .sort((a, b) => b.count - a.count),
    byType: Array.from(typeMap.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total),
  };
}

export function scoreReading(mock: ReadingMock, answers: Record<number, string>): Scoresheet {
  const items: AnswerRecord[] = mock.questions.map((q) => {
    const given = answers[q.n] ?? "";
    return {
      n: q.n,
      given,
      correct: q.answer,
      isCorrect: markAnswer(given, q.answer, q.alternatives),
      type: q.type,
      group: q.group,
      stem: q.stem,
      evidence: `Paragraph ${q.evidence.paragraph}: "${q.evidence.quote}"`,
      trap: q.trap,
    };
  });

  const raw = items.filter((i) => i.isCorrect).length;
  const band = bandFromRaw(raw, READING_SCALE);
  return {
    items,
    raw,
    total: items.length,
    band,
    bandText: bandLabel(band),
    ...tally(items),
  };
}

export function scoreListening(mock: ListeningMock, answers: Record<number, string>): Scoresheet {
  const items: AnswerRecord[] = mock.questions.map((q) => {
    const given = answers[q.n] ?? "";
    const part = mock.parts.find((p) => p.part === q.part);
    const speaker = part?.turns[q.evidence.turn]?.speaker ?? "Speaker";
    return {
      n: q.n,
      given,
      correct: q.answer,
      isCorrect: markAnswer(given, q.answer, q.alternatives),
      type: q.type,
      group: q.group,
      stem: q.stem,
      evidence: `${speaker}: "${q.evidence.quote}"`,
      trap: q.trap,
    };
  });

  const raw = items.filter((i) => i.isCorrect).length;
  const band = bandFromRaw(raw, LISTENING_SCALE);
  return {
    items,
    raw,
    total: items.length,
    band,
    bandText: bandLabel(band),
    ...tally(items),
  };
}

/* --------------------------------------------------------- recommendation */

export type Recommendation = {
  headline: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

/**
 * The last step of the engine: recommend the next practice, driven by the
 * attempt that was just marked and by the trend across recent attempts.
 */
export function recommendNext(
  latest: { module: ModuleId; band: number; trapTop?: TrapType },
  history: { module: ModuleId; band: number }[],
): Recommendation {
  const bands = history.filter((h) => h.module === latest.module).map((h) => h.band);
  const best = bands.length ? Math.max(...bands) : latest.band;
  const rising = bands.length >= 2 && bands[0] > bands[1];

  if (latest.trapTop === "word_match" || latest.trapTop === "partly_true") {
    return {
      headline: "Tighten how you read the question",
      body: "Most of the marks you lost came from options that copied the wording of the passage or were true but did not answer the question. Read the stem twice before reading the options, then decide.",
      actionLabel: "Run another Reading mock",
      actionHref: "/test/reading",
    };
  }

  if (latest.trapTop === "over_inference" || latest.trapTop === "over_generalisation") {
    return {
      headline: "Stay inside the evidence",
      body: "You added conclusions the text does not state. Before answering Not Given, ask whether the passage proves the statement or only suggests it. If it only suggests it, the answer is Not Given.",
      actionLabel: "Practise Reading again",
      actionHref: "/test/reading",
    };
  }

  if (latest.trapTop === "number_shift" || latest.trapTop === "similar_sound") {
    return {
      headline: "Write numbers down as you hear them",
      body: "Several marks went to figures that were corrected or replaced during the recording. Keep a running note of every number you hear and cross out the ones that are replaced.",
      actionLabel: "Run another Listening mock",
      actionHref: "/test/listening",
    };
  }

  if (rising) {
    return {
      headline: "You are still improving",
      body: `Your last attempt beat the one before it in ${latest.module}. Keep the same rhythm, and put the module you have practised least next.`,
      actionLabel: "Open the Analytics dashboard",
      actionHref: "/analytics",
    };
  }

  if (latest.band >= best && latest.band >= 6.5) {
    return {
      headline: "This is your strongest module",
      body: `You matched your best ${latest.module} band. Balance the profile now: a weak module drags the overall estimate down more than a strong one lifts it.`,
      actionLabel: "Choose another module",
      actionHref: "/dashboard",
    };
  }

  if (bands.length <= 1 && latest.band < 5) {
    return {
      headline: "Read the breakdown before anything else",
      body: `The first ${latest.module} mock is a baseline, not a verdict. Open the breakdown and read the evidence line for every wrong answer; on a first attempt most lost marks come from the question wording rather than the passage.`,
      actionLabel: "Open the Mistake Lab",
      actionHref: "/mistakes",
    };
  }

  return {
    headline: "Review before you repeat",
    body: "Read the breakdown for every wrong answer in this attempt, then take another mock of the same module. Repeating a module without reading the evidence usually produces the same result.",
    actionLabel: "Open the Mistake Lab",
    actionHref: "/mistakes",
  };
}

/* ------------------------------------------------------ level check paper */

export type DiagnosticScoresheet = Scoresheet & {
  /** The raw mark projected onto the 40 mark scale, for comparison only. */
  equivalent: number;
  /** Always true: a short paper cannot give the same certainty. */
  indicative: boolean;
};

/**
 * Marks the level check. Reading and Listening items are keyed the same way as
 * a full mock, and the raw mark is projected onto the 40 mark scale so the band
 * is read from the same published table. The projection is linear and the
 * result is labelled indicative everywhere it is shown.
 */
export function scoreDiagnostic(
  paper: { reading: ReadingQuestion[]; listening: ListeningQuestion[]; total: number },
  answers: Record<number, string>,
): DiagnosticScoresheet {
  const items: AnswerRecord[] = [];

  for (const question of paper.reading) {
    const given = answers[question.n] ?? "";
    items.push({
      n: question.n,
      given,
      correct: question.answer,
      isCorrect: markAnswer(given, question.answer, question.alternatives),
      type: question.type,
      group: question.group,
      stem: question.stem,
      evidence: `Paragraph ${question.evidence.paragraph}: "${question.evidence.quote}"`,
      trap: question.trap,
    });
  }

  for (const question of paper.listening) {
    const given = answers[question.n] ?? "";
    items.push({
      n: question.n,
      given,
      correct: question.answer,
      isCorrect: markAnswer(given, question.answer, question.alternatives),
      type: question.type,
      group: question.group,
      stem: question.stem,
      evidence: `Turn ${question.evidence.turn + 1}: "${question.evidence.quote}"`,
      trap: question.trap,
    });
  }

  const raw = items.filter((item) => item.isCorrect).length;
  const equivalent = Math.round((raw / Math.max(1, paper.total)) * 40);
  const band = bandFromRaw(equivalent, READING_SCALE);

  return {
    items,
    raw,
    total: paper.total,
    equivalent,
    indicative: true,
    band,
    bandText: bandLabel(band),
    ...tally(items),
  };
}

/* ------------------------------------------------------- priority areas */

export type PriorityArea = {
  module: ModuleId;
  taskType: string;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
  /** Blank while the sample is too small to judge, which is stated on the page. */
  reliable: boolean;
  advice: string;
  drillHref: string;
};

/**
 * Which question types to work on, in order. A type needs a minimum number of
 * questions answered before it is judged, so the list does not chase noise from
 * a single unlucky question.
 */
export function priorityAreas(
  rows: { module: string; task_type: string; correct: number; total: number }[],
  labelFor: (module: string, taskType: string) => string,
  adviceFor: (taskType: string) => string,
): PriorityArea[] {
  const MIN_SAMPLE = 4;
  return rows
    .filter((row) => row.total > 0)
    .map((row) => {
      const accuracy = Math.round((row.correct / row.total) * 100);
      return {
        module: row.module as ModuleId,
        taskType: row.task_type,
        label: labelFor(row.module, row.task_type),
        correct: row.correct,
        total: row.total,
        accuracy,
        reliable: row.total >= MIN_SAMPLE,
        advice: adviceFor(row.task_type),
        drillHref: `/practice?module=${row.module}&type=${row.task_type}`,
      };
    })
    .sort((a, b) => {
      if (a.reliable !== b.reliable) return a.reliable ? -1 : 1;
      return a.accuracy - b.accuracy;
    });
}

/** 0 to 100: how much of the work between the last result and the target is done. */
export function progressScore(obtained: number, target: number, baseline: number): number {
  if (target <= baseline) return obtained >= target ? 100 : 0;
  const done = ((obtained - baseline) / (target - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(done)));
}

/** Bands a candidate still has to gain, and whether the target is reached. */
export function gapToTarget(obtained: number, target: number): { gap: number; reached: boolean } {
  const gap = Math.round((target - obtained) * 2) / 2;
  return { gap: Math.max(0, gap), reached: obtained >= target };
}

/* -------------------------------------------------------------- analytics */

export type AttemptRow = {
  id: string;
  module: string;
  mock_id: string;
  mock_title: string;
  band: number | null;
  raw_score: number | null;
  total: number | null;
  duration_sec: number | null;
  finished_at: string | null;
};

export type SectionSummary = {
  module: ModuleId;
  attempts: number;
  best: number;
  latest: number;
  average: number;
  trend: "up" | "down" | "flat" | "none";
  series: { label: string; band: number }[];
};

export function summariseModule(module: ModuleId, rows: AttemptRow[]): SectionSummary {
  const mine = rows
    .filter((r) => r.module === module && r.band !== null)
    .sort((a, b) => (a.finished_at ?? "").localeCompare(b.finished_at ?? ""));
  if (mine.length === 0) {
    return { module, attempts: 0, best: 0, latest: 0, average: 0, trend: "none", series: [] };
  }
  const bands = mine.map((r) => r.band as number);
  const latest = bands[bands.length - 1];
  const previous = bands.length > 1 ? bands[bands.length - 2] : latest;
  return {
    module,
    attempts: mine.length,
    best: Math.max(...bands),
    latest,
    average: Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2,
    trend: latest > previous ? "up" : latest < previous ? "down" : "flat",
    series: mine.slice(-12).map((r) => ({
      label: r.finished_at ? r.finished_at.slice(0, 10) : r.mock_title,
      band: r.band as number,
    })),
  };
}
