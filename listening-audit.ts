// Prints every listening mock's parts and the audio file each part plays, so the
// whole set can be audited without starting ten papers by hand.
import { LISTENING_MOCKS } from "./app/src/content/listening/index";

const out = LISTENING_MOCKS.map((mock) => ({
  id: mock.id,
  title: mock.title,
  parts: mock.parts.map((part) => ({
    part: part.part,
    audio: part.audio ?? null,
    turns: part.turns.length,
    words: part.wordCount,
    speakers: [...new Set(part.turns.map((t) => `${t.speaker} (${t.accent})`))],
  })),
  questions: mock.questions.length,
}));

console.log(JSON.stringify(out));
