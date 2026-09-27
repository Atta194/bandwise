/**
 * The level check every new account is offered.
 *
 * It is the same paper for every candidate, which is the point: a fixed paper
 * makes one person's result comparable with the next, and it lets the engine
 * tell you which question types are costing you marks before you have sat
 * anything else. It follows the official format (a real passage with its own
 * keyed questions, a real Part 1 recording with its own keyed questions) at a
 * length a candidate will actually finish on the day they sign up.
 *
 * Twenty three questions: thirteen on one Reading passage, ten on one
 * Listening Part 1. Because it is shorter than a full paper, the result is
 * reported as indicative, with the margin stated on the result screen.
 */
import { LISTENING_POOL } from "./listening";
import { READING_POOL } from "./reading";
import type {
  ListeningPart,
  ListeningQuestion,
  ReadingPassage,
  ReadingQuestion,
} from "./types";

/** Fixed by design, so every new candidate sits the same paper. */
export const DIAGNOSTIC_READING_UNIT = "P-R01-1";
export const DIAGNOSTIC_LISTENING_UNIT = "L1-A";

export type DiagnosticPaper = {
  passages: ReadingPassage[];
  reading: ReadingQuestion[];
  parts: ListeningPart[];
  listening: ListeningQuestion[];
  total: number;
  minutes: number;
  note: string;
};

export function buildDiagnosticPaper(): DiagnosticPaper {
  const readingUnit = READING_POOL.find((unit) => unit.id === DIAGNOSTIC_READING_UNIT);
  const listeningUnit = LISTENING_POOL.find((unit) => unit.id === DIAGNOSTIC_LISTENING_UNIT);
  if (!readingUnit || !listeningUnit) {
    throw new Error("The diagnostic paper references a pool unit that does not exist.");
  }

  const passages: ReadingPassage[] = [{ ...readingUnit.passage, index: 1 }];
  const reading: ReadingQuestion[] = readingUnit.questions.map((question, i) => ({
    ...question,
    n: i + 1,
    passage: 1,
  }));

  const parts: ListeningPart[] = [
    {
      ...listeningUnit.part,
      part: 1,
      audio: `/audio/${DIAGNOSTIC_LISTENING_UNIT}.mp3`,
    },
  ];
  const offset = reading.length;
  const listening: ListeningQuestion[] = listeningUnit.questions.map((question, i) => ({
    ...question,
    n: offset + i + 1,
    part: 1,
  }));

  const total = reading.length + listening.length;
  return {
    passages,
    reading,
    parts,
    listening,
    total,
    minutes: 20,
    note: `This check is ${total} questions in ${20} minutes, drawn from the same pool as the full mocks. It reads the same information a full paper would, but on fewer questions, so treat the number as indicative: the margin is wider than a 40 question paper gives.`,
  };
}

export const DIAGNOSTIC_COPY = {
  headline: "Find out where you stand before you practise anything",
  body: "Twenty minutes, twenty three questions, one Reading passage and one Listening conversation at official difficulty. You get an indicative band, your CEFR level, the question types already costing you marks, and the order to fix them in.",
  duration: "about 20 minutes",
  questions: "23 questions",
};
