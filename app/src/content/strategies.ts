/**
 * The strategy library.
 *
 * Every question family the four modules use has a strategy, three speed tips
 * and the traps that cost marks in that family. This is original writing for
 * Ready Band Pro, following the standard IELTS question families and the practice
 * test format teachers use: tackle the test, then work the strategy for the
 * question types you are losing marks on, then drill those types alone.
 *
 * It is deliberately short enough to read before a practice drill, and specific
 * enough to change what a candidate does in the next ten minutes.
 */
import type { ListeningTaskType, ReadingTaskType } from "./types";

export type Strategy = {
  /** What the family is actually asking for. */
  strategy: string;
  /** Three habits that save time under the clock. */
  tips: string[];
  /** The exam skill this family trains. */
  skill: string;
};

export const READING_STRATEGIES: Record<ReadingTaskType, Strategy> = {
  matching_headings: {
    strategy:
      "Read the headings first and mark which ones are obviously about a single idea. Then take each paragraph and name its topic in three words to yourself before you look at the list. A heading describes the whole paragraph, so a phrase that matches one sentence inside it is usually a trap.",
    tips: [
      "Do this family first if the passage has many short paragraphs; it is the fastest way to learn the layout of the passage.",
      "Write the three-word summary in the margin and you will rarely need to reread the paragraph.",
      "If two headings look similar, the difference is usually scope: one is wider than the paragraph, one narrower.",
    ],
    skill: "Skimming for main idea rather than detail.",
  },
  matching_information: {
    strategy:
      "This family asks which paragraph contains a specific detail, not which paragraph is about that topic. Work from the question, not the passage: take the first keyword in the statement, scan for it or a paraphrase, and confirm the paragraph before you commit.",
    tips: [
      "Scan for numbers, capital letters and unusual nouns first; they are the easiest things to find in a page of text.",
      "You may use a paragraph more than once, so do not treat this as a one-to-one match.",
      "Do it after detail questions on the same passage: you will already know where things are.",
    ],
    skill: "Scanning for a single detail under time pressure.",
  },
  matching_features: {
    strategy:
      "The features are usually people, places or theories. Decide what each feature believes or does, then match the statement to that, not to the vocabulary the statement uses.",
    tips: [
      "Build a two-word note beside each feature name as you meet it in the passage.",
      "Statements often paraphrase, so a statement containing a word from the passage is a warning sign, not help.",
      "Answer the ones you are certain of first; the leftovers resolve by elimination.",
    ],
    skill: "Tracking who says and does what across a long text.",
  },
  sentence_endings: {
    strategy:
      "Read the stem first and predict the ending yourself, then choose the option closest to your prediction. Check that the completed sentence is grammatical, because the wrong endings usually break the grammar as well as the meaning.",
    tips: [
      "The stem is the anchor: never read the endings without it.",
      "Count the endings and the stems: there are always more endings than you need.",
      "If two endings seem possible, the passage decides; go back and read the sentence around the stem.",
    ],
    skill: "Reading for grammatical and logical completion.",
  },
  summary_completion: {
    strategy:
      "A summary is a paraphrase of one section. Find the section first, then read it against the summary to see which words have been changed. The gap takes the word that the paraphrase replaced.",
    tips: [
      "Check the instruction for the word limit before you write anything; the commonest lost mark here is one word too many.",
      "Keep the part of speech: if the gap needs a noun, do not write a verb form because it fits the meaning.",
      "Copy the word from the passage exactly, including its ending.",
    ],
    skill: "Recognising paraphrase and controlling word form.",
  },
  note_completion: {
    strategy:
      "Notes are compressed factual detail, often with headings that tell you where to look. Use the heading to find the section, then match each note line to a single sentence.",
    tips: [
      "Read the whole note block before you start, so you know what order the answers come in.",
      "Numbers, units and currency are frequent answers here; listen for the exact form.",
      "Do not write a word that is already printed in the line.",
    ],
    skill: "Locating compressed factual detail.",
  },
  table_completion: {
    strategy:
      "A table gives you two coordinates: the column shows the category and the row shows the subject. Read the headers as the frame of the answer, then find the cell in the passage that supplies it.",
    tips: [
      "Read down the column before you read across, so you know what kind of answer each gap needs.",
      "The table preserves the order of the passage, so the next answer is further down the text, not back up.",
      "Watch for units in the headers; you do not repeat them in the gap.",
    ],
    skill: "Reading a data frame and matching it to prose.",
  },
  sentence_completion: {
    strategy:
      "The sentence and the passage sentence say the same thing in different words. Identify the subject of the stem, find where the passage discusses that subject, then take the missing content word.",
    tips: [
      "Predict whether you are looking for a noun, a verb or a number before you scan.",
      "The answer is usually close to a word from the stem, so use that word to locate the sentence.",
      "Check the word limit twice; it is enforced, not advisory.",
    ],
    skill: "Precise locating and word-form control.",
  },
  tfng: {
    strategy:
      "Two separate decisions. First, is the statement true or false in the passage? If the passage does not resolve it, the answer is Not Given. Not Given means the passage is silent, not that you could not find it.",
    tips: [
      "Watch for quantifiers: all, only, most, never. A statement becomes False when the quantifier is stronger than the passage.",
      "If you find yourself thinking a statement is probably true, that is the moment to answer Not Given.",
      "Answer every item, even when you are unsure; there is no penalty for a wrong guess.",
    ],
    skill: "Distinguishing absence of evidence from contradiction.",
  },
  ynng: {
    strategy:
      "Here the statements concern the writer's claims, so the question is whether the passage shows the writer agreeing. A fact in the passage that the writer does not comment on is Not Given.",
    tips: [
      "Look for verbs of evaluation: argue, accept, doubt, regret. Those carry the writer's position.",
      "A passage can report both sides; find the sentence that shows what the writer concludes.",
      "Do not confuse an example with a claim.",
    ],
    skill: "Separating a writer's position from reported facts.",
  },
  multiple_choice: {
    strategy:
      "Read the stem and predict the answer before you read the options; predicting is what stops the options from steering you. Then eliminate the wrong ones for a stated reason rather than a feeling.",
    tips: [
      "Options that copy words from the passage are usually wrong, and partially true options are the commonest distractor.",
      "If the stem asks for the writer's main point, the correct option is the widest one the passage supports.",
      "In multiple answer questions, count how many letters are required and answer exactly that many.",
    ],
    skill: "Evaluating distractors rather than pattern matching.",
  },
  short_answer: {
    strategy:
      "A factual question with a short factual answer. Identify the type of information required, scan for it, and take the words from the passage rather than paraphrasing them yourself.",
    tips: [
      "Check the limit: it is usually no more than two or three words and a number.",
      "Do not add articles or prepositions that are not in the passage; the key is usually the content words only.",
      "Spelling is marked, so copy carefully.",
    ],
    skill: "Direct retrieval with exact wording.",
  },
};

export const LISTENING_STRATEGIES: Record<ListeningTaskType, Strategy> = {
  form_completion: {
    strategy:
      "A form is a sequence of facts in the order they are said. Read the form before the recording and predict the kind of answer each gap wants: a name, a number, a date or a noun.",
    tips: [
      "Write as you listen; there is no second play, so a half-written answer beats a perfect idea you never wrote down.",
      "Numbers and names are the most common answers, and they are also the most commonly corrected, so note both figures.",
      "If you miss one, abandon it immediately and move to the next gap.",
    ],
    skill: "Prediction and simultaneous note-taking.",
  },
  note_completion: {
    strategy:
      "Notes keep the speaker's order but drop the grammar. Use the printed headings to know where you are, and write the content word that the speaker stresses.",
    tips: [
      "Underline the words already printed in the notes; the answer is never one of those.",
      "Speakers often repeat an answer or spell it out, which is your confirmation.",
      "Keep the form the note needs: a plural in the notes means a plural in the answer.",
    ],
    skill: "Holding a place in a monologue while writing.",
  },
  table_completion: {
    strategy:
      "In a table the row and column together define the answer. Read the headers first so you know what kind of information is coming and in what order.",
    tips: [
      "Answers come down each column in the order of the recording.",
      "Watch for a change of unit; the speaker may switch from months to weeks part way through.",
      "Check your answer against the row label when the recording ends.",
    ],
    skill: "Following a structured sequence in speech.",
  },
  flow_chart_completion: {
    strategy:
      "A flow chart is a process in order. Track the sequence markers in the recording: first, then, after that, finally. Each marker is a signal that the next answer is coming.",
    tips: [
      "Mark the arrows as you go, so you always know which stage the speaker is on.",
      "Processes often repeat a verb; the answer is usually the object of it.",
      "One stage may be described with two sentences, so do not write the first noun you hear.",
    ],
    skill: "Following sequence markers rather than every word.",
  },
  sentence_completion: {
    strategy:
      "The completed sentence must be grammatical and must match what was said. Predict the part of speech before the recording starts, then write the word that finishes the sentence naturally.",
    tips: [
      "Keep the word limit in view; it is usually one or two words.",
      "If the sentence needs a verb form, listen for the tense the speaker uses.",
      "Do not change the wording to make it sound better; use the speaker's word.",
    ],
    skill: "Grammatical prediction from a written prompt.",
  },
  multiple_choice: {
    strategy:
      "Read the options before the recording and note how they differ from each other. The differences are what the recording will test, and the wrong options are usually mentioned and then rejected.",
    tips: [
      "Listen for the correction: the first figure or plan named is often changed a moment later.",
      "Do not choose an option just because you heard its words; wait for the decision.",
      "If two options are both mentioned, the one the speaker finally settles on is the answer.",
    ],
    skill: "Listening for the resolution, not the mention.",
  },
  matching: {
    strategy:
      "Decide what distinguishes the items in the list, then listen for those distinguishing features rather than for names. The speaker usually gives a reason for each choice.",
    tips: [
      "Cross out an option as soon as it is clearly rejected.",
      "The list is often shorter than the number of statements, so some options repeat.",
      "Write a two-letter shorthand in the margin if it helps you keep pace.",
    ],
    skill: "Discriminating between similar options at speed.",
  },
  diagram_labelling: {
    strategy:
      "The diagram tells you the spatial or functional relationship before you hear it. Orient yourself on the drawing, then follow the speaker's directions from a fixed reference point.",
    tips: [
      "Find the reference point named in the recording and track direction and distance from there.",
      "Prepositions carry the answer: opposite, adjacent, behind, at the rear.",
      "Use the letters on the diagram to keep your place.",
    ],
    skill: "Following spatial description.",
  },
  short_answer: {
    strategy:
      "A direct factual question. Note the question words first so you know whether the answer is a reason, a number or a name.",
    tips: [
      "Respect the word limit, and never pad an answer with words you did not hear.",
      "If the speaker gives an example and then a general answer, the general answer is usually the required one.",
      "Spelling counts, so write clearly and check endings.",
    ],
    skill: "Extracting a specific fact from continuous speech.",
  },
};

/** Exam skills, the layer under the question types. */
export const EXAM_SKILLS = [
  {
    name: "Skimming",
    body: "Read the first sentence and the last sentence of each paragraph, then look away and say what the paragraph does. Two minutes on this makes every later question faster.",
  },
  {
    name: "Scanning",
    body: "Find a specific string without reading the words around it. Train on numbers, capital letters and unusual nouns, because they cannot be paraphrased.",
  },
  {
    name: "Paraphrase recognition",
    body: "The question and the passage rarely share vocabulary. Practise rewriting a sentence into two shorter ones, then back again.",
  },
  {
    name: "Prediction",
    body: "Decide the kind of answer before you look for it: a number, a name, a noun, a reason. Prediction is what stops a plausible distractor from taking the mark.",
  },
  {
    name: "Note-taking shorthand",
    body: "Use arrows for cause, equals for definition and single letters for repeated nouns. In Listening you cannot write faster than the speaker, so you write less.",
  },
  {
    name: "Time discipline",
    body: "Reading gives you about 90 seconds per question. If a question has taken three minutes, guess, mark it and move. The mark is worth the same wherever it is on the paper.",
  },
];

/** Strategy for the two productive modules, by part. */
export const WRITING_STRATEGY = {
  task1: {
    strategy:
      "Four paragraphs in twenty minutes: paraphrase the prompt, give an overview, then one or two paragraphs of selected detail. The overview is the single sentence examiners look for first, and it must name the biggest feature without quoting a figure.",
    tips: [
      "Select and compare; do not list every value in the chart.",
      "Name the trend, then quote one figure to support it.",
      "Spend two minutes planning the overview before you write the introduction.",
    ],
  },
  task2: {
    strategy:
      "Forty minutes, four or five paragraphs: introduce and state your position, develop two body paragraphs with a reason and an example each, then conclude by restating the position in different words.",
    tips: [
      "Answer the exact question asked; a memorised essay on the topic scores nothing.",
      "Every body paragraph needs a reason, not just a claim.",
      "Leave two minutes to check verb endings and plurals, which is where most accuracy marks go.",
    ],
  },
};

export const SPEAKING_STRATEGY = {
  part1: {
    strategy:
      "Two or three sentences per answer: a direct answer, one reason, one detail. Do not give a single word, and do not deliver a prepared speech.",
    tips: [
      "Answer the question that was asked before you expand.",
      "Use the tense in the question; mismatched tense is the commonest accuracy error here.",
      "One specific detail makes an answer sound fluent rather than rehearsed.",
    ],
  },
  part2: {
    strategy:
      "Use the preparation minute for four bullets and a keyword next to each. Then speak in the order of the card, which keeps you coherent, and treat the closing line as the end of your structure.",
    tips: [
      "Write nouns and numbers, not sentences, in the preparation minute.",
      "Keep talking to the two-minute mark; stopping at forty seconds caps fluency.",
      "If you lose your place, return to the next bullet on the card.",
    ],
  },
  part3: {
    strategy:
      "Abstract discussion, so answer with a structure: state a position, justify it, then consider the other side briefly. Compare, speculate and generalise rather than describing your own habits.",
    tips: [
      "Use hedging language (tends to, generally, it depends) to sound appropriately academic.",
      "Give a reason for every opinion, because the examiner is scoring the argument.",
      "Signpost: first, more importantly, on the other hand.",
    ],
  },
};

export const PRACTICE_NOTE =
  "Strategy first, then the drill, then the review. A question type improves when you have read why the wrong answer was attractive and then met the same type again within the hour.";
