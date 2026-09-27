import type {
  ListeningMock,
  ListeningPart,
  ListeningQuestion,
  ListeningUnit,
} from "../types";
import { LISTENING_UNITS_A } from "./units-a";
import { LISTENING_UNITS_B } from "./units-b";

/**
 * The Listening mock set: ten stored configurations, four parts each, 40
 * questions split 10 + 10 + 10 + 10, matching the official framework.
 *
 * As with Reading, parts come from a pool, so the set can be extended by adding
 * a unit and naming it in a configuration. Transcripts stay inside the unit and
 * are withheld until review.
 */
export const LISTENING_POOL: ListeningUnit[] = [...LISTENING_UNITS_A, ...LISTENING_UNITS_B];

const UNIT_BY_ID = new Map(LISTENING_POOL.map((u) => [u.id, u]));

type MockDef = {
  id: string;
  title: string;
  focus: string;
  units: [string, string, string, string];
};

const MOCK_DEFS: MockDef[] = [
  { id: "L01", title: "Mock 01", focus: "Housing, the library, fieldwork, heat", units: ["L1-A", "L2-A", "L3-A", "L4-A"] },
  { id: "L02", title: "Mock 02", focus: "Cycling, a wetland, shift work, concrete", units: ["L1-B", "L2-B", "L3-B", "L4-B"] },
  { id: "L03", title: "Mock 03", focus: "Housing, a wetland, fieldwork, concrete", units: ["L1-A", "L2-B", "L3-A", "L4-B"] },
  { id: "L04", title: "Mock 04", focus: "Cycling, the library, shift work, heat", units: ["L1-B", "L2-A", "L3-B", "L4-A"] },
  { id: "L05", title: "Mock 05", focus: "Housing, the library, shift work, concrete", units: ["L1-A", "L2-A", "L3-B", "L4-B"] },
  { id: "L06", title: "Mock 06", focus: "Cycling, a wetland, fieldwork, heat", units: ["L1-B", "L2-B", "L3-A", "L4-A"] },
  { id: "L07", title: "Mock 07", focus: "Housing, a wetland, shift work, heat", units: ["L1-A", "L2-B", "L3-B", "L4-A"] },
  { id: "L08", title: "Mock 08", focus: "Cycling, the library, fieldwork, concrete", units: ["L1-B", "L2-A", "L3-A", "L4-B"] },
  { id: "L09", title: "Mock 09", focus: "Housing, the library, fieldwork, concrete", units: ["L1-A", "L2-A", "L3-A", "L4-B"] },
  { id: "L10", title: "Mock 10", focus: "Cycling, a wetland, shift work, heat", units: ["L1-B", "L2-B", "L3-B", "L4-A"] },
];

function labelBlocks(questions: ListeningQuestion[]): void {
  let i = 0;
  while (i < questions.length) {
    let j = i;
    while (
      j + 1 < questions.length &&
      questions[j + 1].part === questions[i].part &&
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

function buildMock(def: MockDef): ListeningMock {
  const parts: ListeningPart[] = [];
  const questions: ListeningQuestion[] = [];
  let n = 1;

  def.units.forEach((unitId, index) => {
    const unit = UNIT_BY_ID.get(unitId);
    if (!unit) throw new Error(`Unknown listening pool unit: ${unitId}`);
    const slot = index + 1;
    // The recording is one file per pool unit, so a part always plays the same
    // audio wherever it appears in the mock set.
    parts.push({ ...unit.part, part: slot, audio: `/audio/${unitId}.mp3` });
    for (const q of unit.questions) {
      questions.push({ ...q, n, part: slot });
      n += 1;
    }
  });

  labelBlocks(questions);
  return { id: def.id, title: def.title, focus: def.focus, parts, questions };
}

export const LISTENING_MOCKS: ListeningMock[] = MOCK_DEFS.map(buildMock);

export function getListeningMock(id: string): ListeningMock {
  return LISTENING_MOCKS.find((m) => m.id === id) ?? LISTENING_MOCKS[0];
}

export const LISTENING_FACTS = {
  mocks: LISTENING_MOCKS.length,
  poolUnits: LISTENING_POOL.length,
  questionsPerMock: LISTENING_MOCKS[0].questions.length,
  roles: ["Part 1 social conversation", "Part 2 social monologue", "Part 3 educational conversation", "Part 4 academic monologue"],
};
