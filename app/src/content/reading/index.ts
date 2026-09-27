import type {
  ReadingMock,
  ReadingPassage,
  ReadingQuestion,
  ReadingUnit,
} from "../types";
import { R01 } from "./r01";
import { R02 } from "./r02";
import { READING_UNITS_A } from "./units-a";
import { READING_UNITS_B } from "./units-b";

/**
 * The Reading mock set.
 *
 * Ten stored mock configurations, each with three genuinely separate long
 * passages and exactly 40 questions split 13 + 13 + 14. The passages come from
 * a growing pool (below), which is what lets the set be extended, or rewired,
 * without touching the engine: add a unit, name it in a configuration, done.
 */

/** Passages that arrive inside an already complete mock are pool units too. */
function unitsFromMocks(): ReadingUnit[] {
  const out: ReadingUnit[] = [];
  for (const mock of [R01, R02]) {
    for (const passage of mock.passages) {
      out.push({
        id: `P-${mock.id}-${passage.index}`,
        passage: {
          title: passage.title,
          standfirst: passage.standfirst,
          paragraphs: passage.paragraphs,
          wordCount: passage.wordCount,
        },
        questions: mock.questions
          .filter((q) => q.passage === passage.index)
          .map(({ n, passage: _p, ...rest }) => rest),
      });
    }
  }
  return out;
}

export const READING_POOL: ReadingUnit[] = [
  ...unitsFromMocks(),
  ...READING_UNITS_A,
  ...READING_UNITS_B,
];

const UNIT_BY_ID = new Map(READING_POOL.map((u) => [u.id, u]));

type MockDef = { id: string; title: string; focus: string; units: [string, string, string] };

/**
 * Each configuration names two 13 question units and one 14 question unit, in
 * slot order 13 + 13 + 14. No passage appears twice inside one mock.
 */
const MOCK_DEFS: MockDef[] = [
  { id: "R01", title: "Mock 01", focus: "Coasts, timekeeping and delivery", units: ["P-R01-1", "P-R02-1", "P-R01-3"] },
  { id: "R02", title: "Mock 02", focus: "Water, attention and the designed city", units: ["P-R01-2", "P-paper", "P-R02-3"] },
  { id: "R03", title: "Mock 03", focus: "Materials, silk and deep time", units: ["P-silk", "P-R02-2", "P-ice"] },
  { id: "R04", title: "Mock 04", focus: "Ocean floors, soils and standard time", units: ["P-ocean", "P-soil", "P-time"] },
  { id: "R05", title: "Mock 05", focus: "Forests, paper and ancient air", units: ["P-R01-1", "P-paper", "P-ice"] },
  { id: "R06", title: "Mock 06", focus: "Cities, fibres and the hour", units: ["P-R02-2", "P-silk", "P-time"] },
  { id: "R07", title: "Mock 07", focus: "Mapping, timekeeping and the seabed", units: ["P-ocean", "P-R01-2", "P-R01-3"] },
  { id: "R08", title: "Mock 08", focus: "Roots, water and ancient air", units: ["P-soil", "P-R02-1", "P-R02-3"] },
  { id: "R09", title: "Mock 09", focus: "Books, charts and judgement", units: ["P-paper", "P-ocean", "P-R01-3"] },
  { id: "R10", title: "Mock 10", focus: "Fibres, coasts and ice", units: ["P-silk", "P-R01-1", "P-ice"] },
];

/**
 * Group labels are derived, never written by hand: a run of consecutive
 * questions inside one passage that share an instruction line becomes one
 * numbered block ("Questions 6 to 9"), exactly as the real paper prints it.
 */
function labelBlocks(questions: ReadingQuestion[]): void {
  let i = 0;
  while (i < questions.length) {
    let j = i;
    while (
      j + 1 < questions.length &&
      questions[j + 1].passage === questions[i].passage &&
      questions[j + 1].instruction === questions[i].instruction
    ) {
      j += 1;
    }
    questions[i].group =
      j > i ? `Questions ${questions[i].n} to ${questions[j].n}` : `Question ${questions[i].n}`;
    for (let k = i + 1; k <= j; k += 1) questions[k].group = questions[i].group;
    i = j + 1;
  }
}

function buildMock(def: MockDef): ReadingMock {
  const passages: ReadingPassage[] = [];
  const questions: ReadingQuestion[] = [];
  let n = 1;

  def.units.forEach((unitId, index) => {
    const unit = UNIT_BY_ID.get(unitId);
    if (!unit) throw new Error(`Unknown reading pool unit: ${unitId}`);
    const slot = index + 1;
    passages.push({ ...unit.passage, index: slot });
    for (const q of unit.questions) {
      questions.push({ ...q, n, passage: slot });
      n += 1;
    }
  });

  labelBlocks(questions);
  return { id: def.id, title: def.title, focus: def.focus, passages, questions };
}

export const READING_MOCKS: ReadingMock[] = MOCK_DEFS.map(buildMock);

export function getReadingMock(id: string): ReadingMock {
  return READING_MOCKS.find((m) => m.id === id) ?? READING_MOCKS[0];
}

export const READING_FACTS = {
  mocks: READING_MOCKS.length,
  poolUnits: READING_POOL.length,
  questionsPerMock: READING_MOCKS[0].questions.length,
  wordsPerMock:
    READING_MOCKS[0].passages.reduce((total, p) => total + p.wordCount, 0),
};
