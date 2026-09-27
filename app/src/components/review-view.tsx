/**
 * Post-test breakdown. Every wrong answer is shown as error, correct answer,
 * the evidence that proves it, and the trap that made the wrong answer
 * attractive; productive modules show criterion by criterion feedback with the
 * concrete actions that follow from it.
 */
import { Link } from "@tanstack/react-router";

import type { AttemptDetail } from "../lib/session";
import { TRAP_LABELS, READING_TASK_LABELS, LISTENING_TASK_LABELS, type TrapType } from "../content";
import { CefrPanel, RecommendationCTA } from "./progress";
import { IconCross, IconTick, MODULE_LABELS, formatBand, formatDuration } from "./ui";

const READING_LABELS = READING_TASK_LABELS as Record<string, string>;
const LISTENING_LABELS = LISTENING_TASK_LABELS as Record<string, string>;

export function ReviewView({ detail }: { detail: AttemptDetail }) {
  const { attempt, items, writing, speaking, recommendation } = detail;
  const wrong = items.filter((item) => !item.is_correct);
  const right = items.filter((item) => item.is_correct);
  const label =
    attempt.module === "reading"
      ? READING_LABELS
      : attempt.module === "listening"
        ? LISTENING_LABELS
        : {};

  return (
    <div className="space-y-12">
      <div className="grid gap-6 border border-rule bg-paper-raised p-6 md:grid-cols-4">
        <Stat
          label="Estimated band"
          value={attempt.band === null ? "not marked" : formatBand(attempt.band)}
          note={attempt.bandText ?? "practice marking"}
        />
        <Stat
          label={attempt.total ? "Raw mark" : "Response"}
          value={
            attempt.total
              ? `${attempt.rawScore ?? 0} / ${attempt.total}`
              : attempt.module === "writing"
                ? `${attempt.rawScore ?? 0} words`
                : `${attempt.rawScore ?? 0} answers`
          }
          note={attempt.total ? "questions keyed" : "recorded this attempt"}
        />
        <Stat label="Time on the paper" value={formatDuration(attempt.durationSec)} note="locked timer" />
        <Stat
          label="Mock"
          value={attempt.mockTitle}
          note={attempt.module.replace(/^./, (c) => c.toUpperCase())}
        />
      </div>

      <p className="bw-numeric text-xs leading-relaxed text-ink-mute">
        Estimated band. Practice marking against a published 40 mark scale, or against the four
        official criteria for Writing and Speaking. This is not an official IELTS score.
      </p>

      {attempt.kind === "diagnostic" ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <CefrPanel band={attempt.band ?? 0} />
          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Indicative result</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              The level check is {attempt.total} questions rather than a full 40 question paper, so the
              band carries a wider margin than a full mock. It is the starting line: sit a full paper
              in each module and the estimate tightens.
            </p>
            {detail.areas.length ? (
              <div className="mt-4">
                <p className="bw-label text-ink-mute">Work on these first</p>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
                  {detail.areas.slice(0, 3).map((area) => (
                    <li key={`${area.module}-${area.taskType}`} className="flex justify-between gap-3">
                      <span>{area.label}</span>
                      <span className="bw-numeric">
                        {area.accuracy}% ({area.correct}/{area.total})
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/practice"
                  search={{ module: detail.areas[0].module, type: detail.areas[0].taskType }}
                  className="mt-4 inline-block bg-accent px-4 py-2.5 text-xs font-semibold text-paper hover:bg-accent-ink"
                >
                  Drill the weakest type
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {recommendation ? (
        <section className="border border-rule bg-paper-raised p-6">
          <p className="bw-label text-accent">Recommended next</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{recommendation.headline}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{recommendation.body}</p>
          <RecommendationCTA recommendation={recommendation} />
        </section>
      ) : null}

      {items.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Question by question</h2>
            <p className="bw-numeric text-sm text-ink-soft">
              {right.length} correct · {wrong.length} to review
            </p>
          </div>

          <div className="divide-y divide-rule">
            {items.map((item) => (
              <article key={item.id} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={
                        "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border " +
                        (item.is_correct ? "border-correct text-correct" : "border-wrong text-wrong")
                      }
                    >
                      {item.is_correct ? (
                        <IconTick className="h-4 w-4" />
                      ) : (
                        <IconCross className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="bw-label text-ink-mute">
                        Question {item.question_no} ·{" "}
                        {label[item.task_type] ?? item.task_type}
                        {item.question_group ? ` · ${item.question_group}` : ""}
                      </p>
                      <p className="mt-2 text-[0.95rem] leading-relaxed">{item.stem}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="bw-label text-ink-mute">Your answer</p>
                    <p
                      className={
                        "bw-numeric mt-1 text-sm font-medium " +
                        (item.is_correct ? "text-correct" : "text-wrong")
                      }
                    >
                      {item.given && item.given.trim() !== "" ? item.given : "left blank"}
                    </p>
                  </div>
                </div>

                {!item.is_correct ? (
                  <div className="mt-4 grid gap-4 border-l-2 border-wrong pl-4 md:grid-cols-3">
                    <div>
                      <p className="bw-label text-ink-mute">Correct answer</p>
                      <p className="bw-numeric mt-1 text-sm font-semibold text-ink">{item.correct}</p>
                    </div>
                    <div>
                      <p className="bw-label text-ink-mute">Evidence</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.evidence}</p>
                    </div>
                    <div>
                      <p className="bw-label text-ink-mute">The trap</p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {item.trap ? TRAP_LABELS[item.trap as TrapType] : "Unclassified"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                        {TRAP_COACHING_TEXT(item.trap)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {writing.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Writing feedback</h2>
            <p className="bw-numeric text-sm text-ink-soft">
              Task 2 carries twice the weight of Task 1
            </p>
          </div>
          <div className="mt-6 space-y-8">
            {writing.map((piece) => (
              <article key={piece.task} className="border border-rule bg-paper-raised p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="bw-label text-accent">Task {piece.task}</p>
                  <p className="bw-numeric text-sm text-ink-soft">
                    {piece.words} words ·{" "}
                    <span className={piece.meetsMinimum ? "text-correct" : "text-wrong"}>
                      {piece.meetsMinimum ? "over the minimum" : "under the minimum"}
                    </span>{" "}
                    · band {formatBand(piece.band)}
                  </p>
                </div>

                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {piece.criteria.map((criterion) => (
                    <div key={criterion.name} className="border-t border-rule pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold">{criterion.name}</p>
                        <p className="bw-numeric text-sm">{criterion.band.toFixed(1)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{criterion.comment}</p>
                      <ul className="mt-3 space-y-2">
                        {criterion.actions.map((action) => (
                          <li key={action} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                            <span className="bw-numeric text-accent" aria-hidden="true">
                              →
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {piece.flags.length > 0 ? (
                  <div className="mt-6 border-t border-rule pt-4">
                    <p className="bw-label text-ink-mute">Flagged in your text</p>
                    <ul className="mt-3 space-y-3">
                      {piece.flags.map((flag) => (
                        <li key={flag.text + flag.kind} className="flex flex-wrap gap-x-3">
                          <span className="bw-numeric border border-wrong px-2 py-1 text-xs text-wrong">
                            {flag.text}
                          </span>
                          <span className="flex-1 text-xs leading-relaxed text-ink-soft">
                            {flag.advice}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {speaking.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Speaking feedback</h2>
            <p className="bw-numeric text-sm text-ink-soft">Four official criteria, per answer</p>
          </div>
          <div className="mt-6 space-y-6">
            {speaking.map((answer, index) => (
              <article
                key={`${answer.part}-${index}`}
                className="border border-rule bg-paper-raised p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="bw-label text-accent">Part {answer.part}</p>
                  <p className="bw-numeric text-sm text-ink-soft">
                    {Math.round(answer.seconds)}s ·{" "}
                    {answer.transcript ? `${answer.words} words` : "no transcript"} · band{" "}
                    {formatBand(answer.band)}
                  </p>
                </div>
                <p className="mt-3 text-sm font-medium">{answer.question}</p>

                {answer.transcript ? (
                  <p className="mt-3 border border-rule bg-paper px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
                    {answer.transcript}
                  </p>
                ) : null}

                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {answer.criteria.map((criterion) => (
                    <div key={criterion.name} className="border-t border-rule pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold">{criterion.name}</p>
                        <p className="bw-numeric text-sm">{criterion.band.toFixed(1)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{criterion.comment}</p>
                      <ul className="mt-3 space-y-2">
                        {criterion.actions.map((action) => (
                          <li key={action} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                            <span className="bw-numeric text-accent" aria-hidden="true">
                              →
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
        <Link
          to="/test/$module"
          params={{ module: attempt.module }}
          className="bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-accent"
        >
          Take another {MODULE_LABELS[attempt.module]} mock
        </Link>
        <Link
          to="/mistakes"
          className="border border-ink px-5 py-3 text-sm font-semibold hover:bg-ink hover:text-paper"
        >
          Add to the Mistake Lab
        </Link>
        <Link
          to="/analytics"
          className="border border-rule-strong px-5 py-3 text-sm font-semibold hover:border-ink"
        >
          See the trend
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <p className="bw-label text-ink-mute">{label}</p>
      <p className="bw-numeric mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{note}</p>
    </div>
  );
}

function TRAP_COACHING_TEXT(trap: string | null): string {
  if (!trap) return "No trap was recorded for this question.";
  return TRAP_COACHING_MAP[trap as TrapType] ?? "Review the evidence and the wording of the question.";
}

const TRAP_COACHING_MAP: Record<string, string> = {
  none: "You found the evidence directly.",
  word_match: "The option copied the passage's words but changed their meaning. Judge meaning, not wording.",
  partly_true: "The option was true but did not answer the question. Re-read the stem first.",
  reversed_logic: "You had the right sentence but reversed the relationship. Track who does what to whom.",
  out_of_scope: "That detail is in the text but outside the task. Match the question, not the topic.",
  negation_missed: "A negative or an exception was present (not, only, unless). Circle those words as you read.",
  over_inference: "You supplied a conclusion the text never states.",
  over_generalisation: "The statement was broader than the evidence. Statements are narrow on purpose.",
  similar_sound: "A similar sounding word or near number was used as a decoy.",
  number_shift: "The figure was changed, or a second figure corrected the first.",
  speaker_attribution: "The words were right but spoken by the other speaker.",
  form_shift: "The word was right but the grammatical form was not.",
  spelling: "The idea was right and the spelling lost the mark.",
  word_limit: "The answer broke the word limit printed in the instruction.",
};
