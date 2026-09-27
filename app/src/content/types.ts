/**
 * Content model for the Bandwise test engine.
 *
 * Everything the four modules need is described here once, so a new mock is
 * pure data: drop it into the matching content file and the engine picks it up
 * with no code change. All content is original and copyright safe, and every
 * band the app reports is an ESTIMATE, never an official IELTS score.
 */

export type ModuleId = "reading" | "listening" | "speaking" | "writing";

export const MODULES: { id: ModuleId; title: string; blurb: string; minutes: number }[] = [
  {
    id: "reading",
    title: "Reading",
    blurb: "Three long passages, 40 questions, 60 minutes.",
    minutes: 60,
  },
  {
    id: "listening",
    title: "Listening",
    blurb: "Four recorded parts, 40 questions, 30 minutes.",
    minutes: 30,
  },
  {
    id: "speaking",
    title: "Speaking",
    blurb: "Three parts, recorded answers, rubric feedback.",
    minutes: 14,
  },
  {
    id: "writing",
    title: "Writing",
    blurb: "Academic Task 1 and Task 2, 60 minutes.",
    minutes: 60,
  },
];

/* ------------------------------------------------------------------ traps */

/**
 * The distractor taxonomy. Every question carries one so the Mistake Lab can
 * group errors by the reason a candidate actually loses the mark.
 */
export type TrapType =
  | "none"
  | "word_match"
  | "partly_true"
  | "reversed_logic"
  | "out_of_scope"
  | "negation_missed"
  | "over_inference"
  | "over_generalisation"
  | "similar_sound"
  | "number_shift"
  | "speaker_attribution"
  | "form_shift"
  | "spelling"
  | "word_limit";

export const TRAP_LABELS: Record<TrapType, string> = {
  none: "No trap (direct evidence)",
  word_match: "Copied words, wrong meaning",
  partly_true: "Partly true but not the answer",
  reversed_logic: "Cause and effect reversed",
  out_of_scope: "True in the text, not asked",
  negation_missed: "Negation or exception missed",
  over_inference: "Inference the text does not support",
  over_generalisation: "Too general for the statement",
  similar_sound: "Similar sounding word or number",
  number_shift: "Number or quantity shifted",
  speaker_attribution: "Right words, wrong speaker",
  form_shift: "Right word, wrong form",
  spelling: "Correct idea, wrong spelling",
  word_limit: "Answer broke the word limit",
};

export const TRAP_COACHING: Record<TrapType, string> = {
  none: "You found the evidence directly. Keep answering this way.",
  word_match:
    "The option copied words from the passage but changed what they meant. Check the meaning, never the wording.",
  partly_true:
    "The option was true in the passage but did not answer the question asked. Re-read the question stem first.",
  reversed_logic:
    "You had the right sentence but reversed the relationship. Track who does what to whom.",
  out_of_scope:
    "That information exists in the passage but sits outside the task. Match the question, not the topic.",
  negation_missed:
    "The passage contained a negative or an exception (not, except, only, unless). Circle those words as you read.",
  over_inference:
    "You supplied a conclusion the passage never states. If it is not written, it is not given.",
  over_generalisation:
    "The statement was too broad for the evidence. IELTS statements are narrow on purpose.",
  similar_sound:
    "A similar sounding word or a near number was used as a decoy. Write down what you hear as you hear it.",
  number_shift:
    "The figure in the audio was changed, or a second figure was corrected. Listen for the repair.",
  speaker_attribution:
    "The words were correct but spoken by the other speaker. Note who holds which position.",
  form_shift:
    "The word was right but the grammatical form was not. Check noun, verb and plural endings.",
  spelling:
    "The idea was correct and the spelling lost the mark. Copy spellings from the paper where you can.",
  word_limit:
    "The answer went over the stated word limit. Read the instruction line before writing.",
};

/* ---------------------------------------------------------------- reading */

export type ReadingTaskType =
  | "matching_headings"
  | "matching_information"
  | "matching_features"
  | "sentence_endings"
  | "summary_completion"
  | "note_completion"
  | "table_completion"
  | "sentence_completion"
  | "tfng"
  | "ynng"
  | "multiple_choice"
  | "short_answer";

export const READING_TASK_LABELS: Record<ReadingTaskType, string> = {
  matching_headings: "Matching headings",
  matching_information: "Matching information",
  matching_features: "Matching features",
  sentence_endings: "Sentence endings",
  summary_completion: "Summary completion",
  note_completion: "Note completion",
  table_completion: "Table completion",
  sentence_completion: "Sentence completion",
  tfng: "True / False / Not Given",
  ynng: "Yes / No / Not Given",
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
};

export type ReadingPassage = {
  /** 1, 2 or 3 */
  index: number;
  title: string;
  /** One line under the title, the kind the real paper carries. */
  standfirst: string;
  /** Substantial paragraphs. Paragraph letters A, B, C ... are derived from order. */
  paragraphs: string[];
  wordCount: number;
};

export type ReadingQuestion = {
  /** Global number inside the mock: 1 to 40. */
  n: number;
  /** Which passage this question belongs to (1, 2 or 3). */
  passage: number;
  type: ReadingTaskType;
  /** Group heading shown above the question, e.g. "Questions 1 to 5". */
  group: string;
  /** Instruction line for the group. */
  instruction: string;
  /** The question stem. For completion types a blank is written as ____ . */
  stem: string;
  /** Options for heading matching, features, endings or multiple choice. */
  options?: string[];
  /** The exact key. */
  answer: string;
  /** Other spellings or forms that must also be accepted. */
  alternatives?: string[];
  /** Where the answer is proved: paragraph letter and the quoted words. */
  evidence: { paragraph: string; quote: string };
  trap: TrapType;
};

/* ------------------------------------------------------------- pool units */

/**
 * A passage pool unit: one passage plus its own keyed question set. Mock
 * configurations are assembled from units, which is what lets the pool grow
 * without touching the engine. A unit carries 13 or 14 questions so it fits one
 * of the three official slots (13 + 13 + 14).
 */
export type ReadingUnit = {
  id: string;
  passage: Omit<ReadingPassage, "index">;
  questions: Omit<ReadingQuestion, "n" | "passage">[];
};

/** A listening pool unit: one part plus its own keyed question set. */
export type ListeningUnit = {
  id: string;
  part: Omit<ListeningPart, "part">;
  questions: Omit<ListeningQuestion, "n" | "part">[];
};

export type ReadingMock = {
  id: string;
  /** Display name, e.g. "Mock 03". */
  title: string;
  /** The subject area, shown on the attempt card. */
  focus: string;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
};

/* -------------------------------------------------------------- listening */

export type ListeningTaskType =
  | "form_completion"
  | "note_completion"
  | "table_completion"
  | "flow_chart_completion"
  | "sentence_completion"
  | "multiple_choice"
  | "matching"
  | "diagram_labelling"
  | "short_answer";

export const LISTENING_TASK_LABELS: Record<ListeningTaskType, string> = {
  form_completion: "Form completion",
  note_completion: "Note completion",
  table_completion: "Table completion",
  flow_chart_completion: "Flow chart completion",
  sentence_completion: "Sentence completion",
  multiple_choice: "Multiple choice",
  matching: "Matching",
  diagram_labelling: "Diagram labelling",
  short_answer: "Short answer",
};

/** One spoken turn. `accent` drives which browser voice is preferred. */
export type ListeningTurn = {
  speaker: string;
  accent: "en-GB" | "en-US" | "en-AU" | "en-CA" | "en-IN" | "en-NZ" | "en-ZA";
  line: string;
};

export type ListeningPart = {
  /** 1 to 4. */
  part: number;
  /** Official role of the part. */
  role: string;
  /** What the recording is, e.g. "Enquiry call about a shared house". */
  context: string;
  turns: ListeningTurn[];
  wordCount: number;
  /**
   * The recorded audio for this part, served from this site. When it is present
   * the player plays the real recording once; the browser's speech engine is
   * only the fallback for a part with no file.
   */
  audio?: string;
};

export type ListeningQuestion = {
  /** Global number: 1 to 40. */
  n: number;
  part: number;
  type: ListeningTaskType;
  group: string;
  instruction: string;
  /** For completion types, the frame text with a blank written as ____ . */
  stem: string;
  options?: string[];
  answer: string;
  alternatives?: string[];
  /** Proof in the audio: turn indexes into that part's script, plus the words. */
  evidence: { turn: number; quote: string };
  trap: TrapType;
};

export type ListeningMock = {
  id: string;
  title: string;
  focus: string;
  parts: ListeningPart[];
  questions: ListeningQuestion[];
};

/* ---------------------------------------------------------------- writing */

export type ChartSpec =
  | {
      kind: "bar";
      title: string;
      unit: string;
      categories: string[];
      series: { name: string; values: number[] }[];
      source: string;
    }
  | {
      kind: "line";
      title: string;
      unit: string;
      categories: string[];
      series: { name: string; values: number[] }[];
      source: string;
    }
  | {
      kind: "pie";
      title: string;
      unit: string;
      slices: { label: string; value: number }[];
      source: string;
    }
  | {
      kind: "table";
      title: string;
      columns: string[];
      rows: string[][];
      source: string;
    }
  | {
      kind: "process";
      title: string;
      steps: { label: string; detail: string }[];
      source: string;
    }
  | {
      kind: "map";
      title: string;
      before: string[];
      after: string[];
      source: string;
    };

export type WritingTask = {
  /** 1 or 2. */
  task: 1 | 2;
  prompt: string;
  /** 150 for Task 1, 250 for Task 2. */
  minWords: number;
  /** Suggested minutes of the shared 60. */
  suggestedMinutes: number;
  chart?: ChartSpec;
  /** The kind of response the rubric engine should expect. */
  expects: "data_description" | "process_description" | "map_comparison" | "argument";
};

export type WritingMock = {
  id: string;
  title: string;
  focus: string;
  tasks: WritingTask[];
};

/* --------------------------------------------------------------- speaking */

export type SpeakingPart1Set = { topic: string; questions: string[] };
export type CueCard = {
  topic: string;
  /** The four wording lines under "You should say". */
  bullets: string[];
  /** The rounded-off invitation at the bottom of the card. */
  closing: string;
};
export type SpeakingPart3Set = { topic: string; questions: string[] };

export type SpeakingMock = {
  id: string;
  title: string;
  part1: SpeakingPart1Set[];
  part2: CueCard;
  part3: SpeakingPart3Set[];
};

/* --------------------------------------------------------------- attempts */

export type AnswerRecord = {
  n: number;
  given: string;
  correct: string;
  isCorrect: boolean;
  type: string;
  group: string;
  stem: string;
  evidence: string;
  trap: TrapType;
};

export type RubricCriterion = {
  name: string;
  band: number;
  comment: string;
  /** Concrete, actionable notes for this criterion. */
  actions: string[];
};

export type WritingMark = {
  task: 1 | 2;
  words: number;
  meetsMinimum: boolean;
  crit: RubricCriterion[];
  band: number;
  /** In line flags found in the response. */
  flags: { text: string; kind: string; advice: string }[];
};

export type SpeakingMark = {
  part: number;
  question: string;
  seconds: number;
  /** Word count of the machine transcript, when the browser provided one. */
  words: number;
  transcript: string | null;
  crit: RubricCriterion[];
  band: number;
};
