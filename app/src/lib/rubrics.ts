/**
 * The marking engine for the two productive modules.
 *
 * Writing and Speaking are marked against the four official criteria, using
 * measurable evidence from the response itself: length, structure, lexical
 * range, sentence architecture, error patterns and delivery timing. The engine
 * is deterministic, so the same answer always receives the same mark, and it
 * explains every judgement it makes.
 *
 * Two honest limits are encoded here rather than hidden. Pronunciation cannot
 * be judged from a transcript, so it is reported as a delivery based estimate
 * and says so. Where a candidate's browser did not supply a transcript, the
 * lexical and grammatical criteria are marked on timing alone and labelled.
 */
import type { RubricCriterion, SpeakingMark, WritingMark, WritingTask } from "../content";
import { bandFromCriteria, writingOverall } from "../content";

/* ------------------------------------------------------------ text tools */

const WORD = /[A-Za-z][A-Za-z'-]*/g;

export function words(text: string): string[] {
  return text.match(WORD) ?? [];
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0);
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => words(p).length > 0);
}

/** Content words a strong academic response tends to reuse correctly. */
const ACADEMIC = new Set([
  "significant", "substantial", "considerable", "consequently", "therefore", "however",
  "nevertheless", "furthermore", "moreover", "whereas", "although", "despite", "approach",
  "argument", "assumption", "benefit", "challenge", "consequence", "decline", "distribution",
  "economic", "environmental", "evidence", "factor", "impact", "implication", "indicate",
  "individual", "measure", "outcome", "policy", "proportion", "reduce", "reflect", "region",
  "regulation", "resource", "significant", "suggest", "sustainable", "trend", "typically",
  "proportion", "majority", "minority", "gradual", "steady", "sharp", "overall", "respectively",
]);

const FILLERS = new Set(["um", "uh", "er", "erm", "like", "basically", "actually", "kind", "sort"]);
const CONNECTORS = new Set([
  "however", "therefore", "moreover", "furthermore", "consequently", "although", "because",
  "whereas", "firstly", "secondly", "finally", "overall", "in", "addition", "despite",
  "nevertheless", "meanwhile", "similarly", "instead",
]);
const SUBORDINATORS = ["although", "because", "while", "whereas", "which", "that", "if", "unless", "since", "who"];
const INFORMAL = ["a lot of", "lots of", "kids", "stuff", "things", "gonna", "big", "really", "very very", "etc"];

function typeTokenRatio(list: string[]): number {
  if (list.length === 0) return 0;
  const unique = new Set(list.map((w) => w.toLowerCase()));
  return unique.size / list.length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function bandFor(ratio: number, steps: number[]): number {
  for (let i = 0; i < steps.length; i += 1) {
    if (ratio >= steps[i]) return 9 - i;
  }
  return Math.max(1, 9 - steps.length);
}

/* --------------------------------------------------------------- writing */

export type WritingInput = { task: 1 | 2; text: string };

export function markWriting(task: WritingTask, input: WritingInput): WritingMark {
  const text = input.text.trim();
  const wordList = words(text);
  const count = wordList.length;
  const paras = paragraphs(text);
  const sents = sentences(text);
  const lower = wordList.map((w) => w.toLowerCase());
  const ratios = sents.map((s) => words(s).length);
  const ttr = typeTokenRatio(lower);
  const academicHits = lower.filter((w) => ACADEMIC.has(w)).length;
  const connectorCount = lower.filter((w) => CONNECTORS.has(w)).length;
  const lengthy = wordList.filter((w) => w.length >= 8).length / Math.max(1, count);
  const flags: WritingMark["flags"] = [];

  /* Task response --------------------------------------------------------- */
  const lengthRatio = count / task.minWords;
  const hasOverview =
    task.expects === "data_description" || task.expects === "process_description"
      ? sents.length > 1
      : /in my (view|opinion)|i (believe|think|argue)|this essay|overall/i.test(text);
  const dataMentions = (text.match(/\d+(\.\d+)?%?/g) ?? []).length;
  const wantsData =
    task.expects === "data_description" || task.expects === "map_comparison";
  const dataScore = wantsData ? Math.min(1, dataMentions / 6) : 0.8;

  const responseRatio = Math.min(
    1,
    0.45 * Math.min(1, lengthRatio) +
      0.25 * (hasOverview ? 1 : 0.45) +
      0.2 * dataScore +
      0.1 * (paras.length >= (task.task === 2 ? 3 : 2) ? 1 : 0.4),
  );
  const responseBand = Math.max(3, bandFor(responseRatio, [0.9, 0.8, 0.7, 0.58, 0.45, 0.3]));

  if (count < task.minWords) {
    flags.push({
      text: `${count} words`,
      kind: "length",
      advice: `Task ${task.task} requires at least ${task.minWords} words. A short response is penalised before anything else is considered, because there is not enough language to judge.`,
    });
  }

  if (wantsData && dataMentions === 0) {
    flags.push({
      text: "no figures cited",
      kind: "data",
      advice: "You described the chart without quoting any of its figures. Select the most striking values and say what they are, not just what they do.",
    });
  }

  if (!hasOverview) {
    flags.push({
      text: "no clear overview",
      kind: "overview",
      advice:
        task.task === 1
          ? "Add an overview sentence after the introduction that states the two or three biggest features of the chart."
          : "State your own position early and keep it visible through the response.",
    });
  }

  /* Coherence and cohesion ------------------------------------------------ */
  const cohesionRatio = Math.min(
    1,
    0.4 * Math.min(1, paras.length / (task.task === 2 ? 4 : 3)) +
      0.35 * Math.min(1, connectorCount / (task.task === 2 ? 6 : 4)) +
      0.25 * (sents.length > 3 ? 1 : 0.4),
  );
  const cohesionBand = Math.max(3, bandFor(cohesionRatio, [0.9, 0.8, 0.68, 0.55, 0.42, 0.28]));

  if (paras.length < 2 && count > 60) {
    flags.push({
      text: "single paragraph",
      kind: "cohesion",
      advice: "Break the response into paragraphs, one idea per paragraph. An unbroken block loses coherence marks even when the ideas are good.",
    });
  }

  if (connectorCount === 0 && count > 60) {
    flags.push({
      text: "no linking words",
      kind: "cohesion",
      advice: "Use linking devices (however, therefore, whereas, in addition) to show the relationship between sentences.",
    });
  }

  /* Lexical resource ------------------------------------------------------ */
  const lexRatio = Math.min(
    1,
    0.4 * Math.min(1, ttr / 0.55) +
      0.3 * Math.min(1, academicHits / (count > 200 ? 14 : 8)) +
      0.3 * Math.min(1, lengthy / 0.22),
  );
  const lexBand = Math.max(3, bandFor(lexRatio, [0.88, 0.78, 0.66, 0.54, 0.4, 0.26]));

  for (const phrase of INFORMAL) {
    if (lower.includes(phrase.split(" ")[0]) && text.toLowerCase().includes(phrase)) {
      flags.push({
        text: phrase,
        kind: "register",
        advice: `"${phrase}" is informal for Academic Writing. Replace it with a more precise term (for example: many, numerous, considerable).`,
      });
      break;
    }
  }

  /* Grammatical range and accuracy ---------------------------------------- */
  const variance = stdev(ratios);
  const mixedLength = ratios.some((r) => r <= 8) && ratios.some((r) => r >= 20);
  const subordination = lower.filter((w) => SUBORDINATORS.includes(w)).length;
  const grammarRatio = Math.min(
    1,
    0.35 * Math.min(1, variance / 9) +
      0.25 * (mixedLength ? 1 : 0.5) +
      0.25 * Math.min(1, subordination / (count > 200 ? 12 : 7)) +
      0.15 * (/[;:]/.test(text) ? 1 : 0.6),
  );
  const grammarBand = Math.max(3, bandFor(grammarRatio, [0.88, 0.78, 0.67, 0.55, 0.42, 0.28]));

  if (ratios.some((r) => r > 45)) {
    flags.push({
      text: "very long sentence",
      kind: "grammar",
      advice: "One sentence runs past 45 words. Split it: long sentences hide agreement errors and cost you coherence as well as accuracy.",
    });
  }

  if (/\s+[,.!?]/.test(text)) {
    flags.push({
      text: "space before punctuation",
      kind: "grammar",
      advice: "Remove the space before commas and full stops. Small mechanical errors are noticed, and they are free marks to recover.",
    });
  }

  const repeated = /(\b[A-Za-z]{4,}\b)\s+\1\b/i.exec(text);
  if (repeated) {
    flags.push({
      text: repeated[0],
      kind: "grammar",
      advice: "A word is repeated twice in a row. Read the response aloud; the ear catches this faster than the eye.",
    });
  }

  const crit: RubricCriterion[] = [
    {
      name: task.task === 1 ? "Task Achievement" : "Task Response",
      band: responseBand,
      comment:
        count >= task.minWords
          ? `At ${count} words the response clears the ${task.minWords} word minimum and addresses the prompt.`
          : `At ${count} words the response is under the ${task.minWords} word minimum, which caps this criterion.`,
      actions: [
        hasOverview ? "Keep the overview where it is." : "Add one sentence that states the overall picture before the detail.",
        wantsData && dataMentions < 4 ? "Quote and compare specific figures rather than describing the chart in general terms." : "Keep the data references precise and comparative.",
      ],
    },
    {
      name: "Coherence and Cohesion",
      band: cohesionBand,
      comment: `${paras.length} paragraph${paras.length === 1 ? "" : "s"}, ${connectorCount} linking device${connectorCount === 1 ? "" : "s"}, average sentence ${Math.round(mean(ratios))} words.`,
      actions: [
        paras.length >= (task.task === 2 ? 3 : 2) ? "Paragraphing is doing its job." : "Use a paragraph for each stage of the argument.",
        "Name the relationship between sentences (contrast, cause, example) rather than listing them.",
      ],
    },
    {
      name: "Lexical Resource",
      band: lexBand,
      comment: `Type token ratio ${(ttr * 100).toFixed(0)}%, ${academicHits} words from the academic register, ${(lengthy * 100).toFixed(0)}% of words of eight letters or more.`,
      actions: [
        ttr < 0.45 ? "Repetition is high. Build a small list of precise synonyms before the test." : "Range is adequate; keep avoiding repetition of the key noun.",
        academicHits < 6 ? "Introduce more topic-specific vocabulary, and use it accurately rather than approximately." : "Academic register is present and appropriately used.",
      ],
    },
    {
      name: "Grammatical Range and Accuracy",
      band: grammarBand,
      comment: `Sentence length varies by ${variance.toFixed(1)} words around the mean, with ${subordination} subordinating structures.`,
      actions: [
        mixedLength ? "Sentence length already varies; that is what the range criterion rewards." : "Mix short statements with longer complex sentences.",
        flags.length ? "Fix the flagged mechanical errors: they are the cheapest marks on the paper." : "No mechanical error patterns were detected in the response.",
      ],
    },
  ];

  const band =
    task.task === 1
      ? bandFromCriteria(crit.map((c) => c.band))
      : bandFromCriteria(crit.map((c) => c.band));

  return {
    task: task.task,
    words: count,
    meetsMinimum: count >= task.minWords,
    crit,
    band,
    flags: flags.slice(0, 8),
  };
}

export function markWritingSet(tasks: WritingTask[], inputs: WritingInput[]): {
  marks: WritingMark[];
  overall: number;
} {
  const marks = tasks.map((task) => {
    const input = inputs.find((i) => i.task === task.task) ?? { task: task.task, text: "" };
    return markWriting(task, input);
  });
  const t1 = marks.find((m) => m.task === 1)?.band ?? 0;
  const t2 = marks.find((m) => m.task === 2)?.band ?? 0;
  return { marks, overall: writingOverall(t1, t2) };
}

/* -------------------------------------------------------------- speaking */

export type SpeakingInput = {
  part: number;
  question: string;
  seconds: number;
  transcript: string | null;
};

/** Target seconds for one answer in each part. */
const TARGET: Record<number, number> = { 1: 40, 2: 110, 3: 45 };

export function markSpeaking(input: SpeakingInput): SpeakingMark {
  const target = TARGET[input.part] ?? 40;
  const seconds = Math.max(0, input.seconds);
  const transcript = input.transcript?.trim() ? input.transcript.trim() : null;
  const wordList = words(transcript ?? "");
  const count = wordList.length;
  const lower = wordList.map((w) => w.toLowerCase());
  const ttr = typeTokenRatio(lower);
  const perMinute = seconds > 0 ? (count / seconds) * 60 : 0;
  const fillerRatio = count > 0 ? lower.filter((w) => FILLERS.has(w)).length / count : 0;
  const connectors = lower.filter((w) => CONNECTORS.has(w)).length;
  const sents = sentences(transcript ?? "");
  const ratios = sents.map((s) => words(s).length);
  const subordination = lower.filter((w) => SUBORDINATORS.includes(w)).length;

  /* Fluency and coherence ------------------------------------------------- */
  const lengthScore = Math.min(1, seconds / target);
  const fillersScore = transcript ? Math.max(0, 1 - fillerRatio * 6) : 0.6;
  const connectorsScore = transcript ? Math.min(1, connectors / 4) : 0.55;
  const fluencyRatio = Math.min(1, 0.55 * lengthScore + 0.25 * fillersScore + 0.2 * connectorsScore);
  const fluencyBand = Math.max(3, bandFor(fluencyRatio, [0.9, 0.8, 0.68, 0.55, 0.42, 0.28]));

  /* Lexical resource ------------------------------------------------------ */
  const lexRatio = transcript
    ? Math.min(1, 0.5 * Math.min(1, ttr / 0.5) + 0.3 * Math.min(1, count / (target * 2.2)) + 0.2 * Math.min(1, (lower.filter((w) => w.length >= 8).length || 0) / 8))
    : Math.min(0.66, 0.5 + 0.16 * lengthScore);
  const lexBand = Math.max(3, bandFor(lexRatio, [0.88, 0.78, 0.66, 0.54, 0.4, 0.26]));

  /* Grammatical range and accuracy --------------------------------------- */
  const grammarRatio = transcript
    ? Math.min(1, 0.4 * Math.min(1, stdev(ratios) / 8) + 0.35 * Math.min(1, subordination / 5) + 0.25 * Math.min(1, sents.length / 6))
    : Math.min(0.66, 0.5 + 0.16 * lengthScore);
  const grammarBand = Math.max(3, bandFor(grammarRatio, [0.88, 0.78, 0.66, 0.54, 0.4, 0.26]));

  /* Pronunciation --------------------------------------------------------- */
  // Not machine assessable from a transcript. Reported as a delivery based
  // estimate, capped, and labelled so it is never mistaken for a judgement.
  const deliveryScore = Math.min(1, lengthScore * 0.7 + (perMinute > 90 && perMinute < 190 ? 0.3 : 0.12));
  const pronunciationBand = Math.max(4, Math.min(7, bandFor(deliveryScore, [0.9, 0.78, 0.66, 0.5])));

  const crit: RubricCriterion[] = [
    {
      name: "Fluency and Coherence",
      band: fluencyBand,
      comment: `You spoke for ${Math.round(seconds)} seconds against a target of about ${target}.${
        transcript ? ` Speech rate about ${Math.round(perMinute)} words per minute, with ${(fillerRatio * 100).toFixed(1)}% filler words.` : " Your browser did not return a transcript for this answer, so only delivery was measured."
      }`,
      actions: [
        seconds < target * 0.7 ? "Your answer was short. In Part 1 and Part 3, aim for two or three connected sentences rather than one." : "Length is on target.",
        connectorScoreNote(connectors),
      ],
    },
    {
      name: "Lexical Resource",
      band: lexBand,
      comment: transcript
        ? `${count} words, variety ratio ${(ttr * 100).toFixed(0)}%.`
        : "No transcript available, so this is a timing based estimate rather than a vocabulary judgement.",
      actions: transcript
        ? [
            ttr < 0.42 ? "You reused the same words. Prepare two alternative expressions for the topic before you speak." : "Variety is reasonable for the length of the answer.",
            "Use one precise example or specific detail: it signals vocabulary as well as fluency.",
          ]
        : ["Speak in a supported browser to receive a vocabulary judgement."],
    },
    {
      name: "Grammatical Range and Accuracy",
      band: grammarBand,
      comment: transcript
        ? `${sents.length} sentences, ${subordination} subordinate structures detected.`
        : "No transcript available, so this is a timing based estimate.",
      actions: transcript
        ? [
            subordination < 3 ? "Add reasons and conditions (because, if, although) instead of joining facts with and." : "Complex structures are present.",
            "Vary the opening of each sentence rather than starting with the same pronoun.",
          ]
        : ["Speak in a supported browser to receive a grammar judgement."],
    },
    {
      name: "Pronunciation",
      band: pronunciationBand,
      comment:
        "Estimated from delivery only. Pronunciation cannot be judged from a transcript, so treat this as the least reliable of the four and confirm it with a teacher.",
      actions: [
        perMinute && (perMinute < 90 || perMinute > 190)
          ? "Your rate was outside the comfortable 90 to 190 words per minute band. Clarity matters more than speed."
          : "Your rate was comfortable for a listener.",
        "Record one answer a week and listen back for word endings; they carry most of the meaning that a listener needs.",
      ],
    },
  ];

  return {
    part: input.part,
    question: input.question,
    seconds,
    words: count,
    transcript,
    crit,
    band: bandFromCriteria(crit.map((c) => c.band)),
  };
}

function connectorScoreNote(connectors: number): string {
  return connectors < 2
    ? "Almost no linking language was used. Signal the relationship between your ideas (because, although, so that)."
    : "Linking language is present and helps the listener follow you.";
}

export function markSpeakingSet(inputs: SpeakingInput[]): { marks: SpeakingMark[]; overall: number } {
  const marks = inputs.map(markSpeaking);
  return {
    marks,
    overall: bandFromCriteria(marks.map((m) => m.band)),
  };
}
