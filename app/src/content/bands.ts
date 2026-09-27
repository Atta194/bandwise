/**
 * Band conversion and the shared scoring vocabulary.
 *
 * The reading and listening scales below are the widely published 40 mark
 * conversion used for Academic practice marking. They are an ESTIMATE of the
 * band a raw mark would fall into; they are not an official IELTS score and the
 * app says so wherever a band is shown.
 */

export const ESTIMATE_NOTE =
  "Estimated band. This is practice marking against a published 40 mark conversion, not an official IELTS score.";

export type BandStep = { min: number; band: number };

/** Reading, marked out of 40. */
export const READING_SCALE: BandStep[] = [
  { min: 39, band: 9 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3 },
  { min: 4, band: 2.5 },
  { min: 3, band: 2 },
  { min: 0, band: 1 },
];

/** Listening, marked out of 40. */
export const LISTENING_SCALE: BandStep[] = [
  { min: 39, band: 9 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8 },
  { min: 32, band: 7.5 },
  { min: 30, band: 7 },
  { min: 26, band: 6.5 },
  { min: 23, band: 6 },
  { min: 18, band: 5.5 },
  { min: 16, band: 5 },
  { min: 13, band: 4.5 },
  { min: 11, band: 4 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3 },
  { min: 5, band: 2.5 },
  { min: 3, band: 2 },
  { min: 0, band: 1 },
];

/** The nine band descriptors in plain words, used on the dial and in reports. */
export const BAND_DESCRIPTORS: { band: number; label: string; meaning: string }[] = [
  { band: 9, label: "Expert user", meaning: "Fully operational command, accurate and fluent throughout." },
  { band: 8, label: "Very good user", meaning: "Occasional unsystematic slips, handles complex argument well." },
  { band: 7, label: "Good user", meaning: "Operational command with occasional inaccuracies in unfamiliar settings." },
  { band: 6, label: "Competent user", meaning: "Effective command despite some inaccuracies and misunderstandings." },
  { band: 5, label: "Modest user", meaning: "Partial command, copes with overall meaning in most situations." },
  { band: 4, label: "Limited user", meaning: "Basic competence limited to familiar situations." },
  { band: 3, label: "Extremely limited user", meaning: "Conveys and understands only general meaning." },
  { band: 2, label: "Intermittent user", meaning: "Great difficulty understanding spoken and written English." },
  { band: 1, label: "Non user", meaning: "No ability beyond a few isolated words." },
];

/** Convert a raw mark on a 40 mark paper into an estimated band. */
export function bandFromRaw(raw: number, scale: BandStep[]): number {
  const clamped = Math.max(0, Math.min(40, Math.round(raw)));
  for (const step of scale) {
    if (clamped >= step.min) return step.band;
  }
  return 1;
}

/** Average of several criteria bands, rounded to the nearest half band. */
export function bandFromCriteria(bands: number[], weights?: number[]): number {
  if (bands.length === 0) return 0;
  const w = weights && weights.length === bands.length ? weights : bands.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  const sum = bands.reduce((acc, b, i) => acc + b * w[i], 0);
  const avg = sum / total;
  return Math.round(avg * 2) / 2;
}

/**
 * The writing paper weights Task 2 twice Task 1, as the official paper does.
 */
export function writingOverall(task1Band: number, task2Band: number): number {
  return Math.round(((task1Band + task2Band * 2) / 3) * 2) / 2;
}

/** The label that belongs to a band number, for reports and the dial. */
export function bandLabel(band: number): string {
  const hit = BAND_DESCRIPTORS.find((b) => b.band === Math.round(band));
  return hit ? hit.label : "Band not available";
}

/* ------------------------------------------------------------------- CEFR */

/**
 * The published alignment between an IELTS band and the Common European
 * Framework level. Shown beside every estimate so a candidate can place the
 * result against the scale their university or employer may ask for.
 */
export const CEFR_LEVELS: { min: number; cefr: string; label: string; meaning: string }[] = [
  {
    min: 8.5,
    cefr: "C2",
    label: "Proficient",
    meaning: "You can handle demanding academic text and argue a position precisely. Institutions treating C1 as the entry bar are comfortably covered.",
  },
  {
    min: 7,
    cefr: "C1",
    label: "Advanced",
    meaning: "You meet the usual postgraduate entry requirement, and you read complex academic argument without support.",
  },
  {
    min: 5.5,
    cefr: "B2",
    label: "Upper intermediate",
    meaning: "You meet the typical undergraduate entry requirement, but detailed academic text and unfamiliar topics still cost you marks.",
  },
  {
    min: 4,
    cefr: "B1",
    label: "Intermediate",
    meaning: "You cope with everyday English and straightforward factual text. Academic reading speed is the main thing to build.",
  },
  {
    min: 0,
    cefr: "A2 or below",
    label: "Elementary",
    meaning: "Build core vocabulary and sentence control before working on exam technique.",
  },
];

export function cefrForBand(band: number): { cefr: string; label: string; meaning: string } {
  const hit = CEFR_LEVELS.find((level) => band >= level.min) ?? CEFR_LEVELS[CEFR_LEVELS.length - 1];
  return { cefr: hit.cefr, label: hit.label, meaning: hit.meaning };
}

/** The band a candidate needs, for the progress comparison on the dashboard. */
export const TARGET_PRESETS = [
  { band: 6, label: "Undergraduate entry", note: "The common minimum for a bachelor's programme." },
  { band: 6.5, label: "Most master's programmes", note: "The most widely requested postgraduate figure." },
  { band: 7, label: "Competitive postgraduate and professional registration", note: "Often asked for by medicine, law and nursing regulators." },
  { band: 7.5, label: "Highly competitive postgraduate", note: "Used where a faculty has many applicants per place." },
  { band: 8, label: "Scholarship and top-tier admission", note: "A common bar for funded places." },
];
