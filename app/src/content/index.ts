/**
 * Single entry point for all test content. The engine imports from here only,
 * so adding mocks never means touching application code.
 */
export * from "./types";
export * from "./bands";
export * from "./strategies";

export { READING_MOCKS, READING_POOL, READING_FACTS, getReadingMock } from "./reading";
export { LISTENING_MOCKS, LISTENING_POOL, LISTENING_FACTS, getListeningMock } from "./listening";
export { WRITING_MOCKS, WRITING_FACTS, getWritingMock } from "./writing";
export { SPEAKING_MOCKS, SPEAKING_FACTS, getSpeakingMock } from "./speaking";

import { READING_FACTS, READING_POOL } from "./reading";
import { LISTENING_FACTS, LISTENING_POOL } from "./listening";
import { WRITING_FACTS } from "./writing";
import { SPEAKING_FACTS } from "./speaking";

/** Numbers shown on the landing page and the content page. All of them real. */
export const CONTENT_FACTS = {
  reading: READING_FACTS,
  listening: LISTENING_FACTS,
  writing: WRITING_FACTS,
  speaking: SPEAKING_FACTS,
  poolUnits: READING_POOL.length + LISTENING_POOL.length,
  readingWords: READING_POOL.reduce((t, u) => t + u.passage.wordCount, 0),
  listeningWords: LISTENING_POOL.reduce((t, u) => t + u.part.wordCount, 0),
  keyedQuestions:
    READING_POOL.reduce((t, u) => t + u.questions.length, 0) +
    LISTENING_POOL.reduce((t, u) => t + u.questions.length, 0),
};

/**
 * Copyright and fairness policy. Shown in the app so a candidate knows exactly
 * what they are practising with, and what the marking does and does not claim.
 */
export const POLICY = {
  headline: "Original content, marked honestly",
  points: [
    {
      title: "Nothing here is copied from a live exam",
      body: "Every passage, recording script, cue card and writing prompt in this app was written for it, or is drawn from the public record. No IELTS, Cambridge or British Council material is reproduced, and no real test paper is reproduced in any form.",
    },
    {
      title: "The pool rotates",
      body: "Reading passages and listening parts sit in a pool and are assembled into mock configurations. Reset Test draws a different configuration, so the same paper is rarely seen twice. Adding to the pool is a data change, not a code change.",
    },
    {
      title: "Every mark is traceable",
      body: "Each Reading and Listening question carries an answer key, the exact place the answer is proved, and the reason a plausible wrong answer is attractive. Every attempt feeds the same Mistake Lab and Analytics dashboard.",
    },
    {
      title: "Bands are estimates",
      body: "Reading and Listening results are converted using a published 40 mark scale. Writing and Speaking are marked against the four official criteria by this app's own rubric engine. Every band shown is an estimate for practice, and never an official IELTS score.",
    },
    {
      title: "What this is not",
      body: "This is not affiliated with, endorsed by or connected to IELTS, the British Council, IDP or Cambridge University Press and Assessment. The names of the four criteria are used descriptively.",
    },
  ],
};
