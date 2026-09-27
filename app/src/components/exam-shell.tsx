/**
 * The exam workspace.
 *
 * Built to the shape of the official computer-delivered test: the paper fills
 * the window, the source (passage or recording) sits in its own pane with its
 * own scrollbar and NEVER scrolls away, the questions sit in the other pane and
 * scroll on their own, the timer and submit controls stay in a fixed bar, and
 * the question navigator runs along the bottom so any question is one click
 * away. Below the large breakpoint the two panes become tabs, because a split
 * that is too narrow to read is worse than no split.
 *
 * The shell owns no marking and knows no answers.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { ReadingQuestionView } from "../lib/session";
import type { AnswerMap } from "./test-ui";
import { IconClock, IconTick } from "./ui";

export type ExamNav = {
  questions: ReadingQuestionView[];
  answers: AnswerMap;
  flagged: Set<number>;
  current: number;
  onJump: (n: number) => void;
  onToggleFlag: (n: number) => void;
};

function clock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ExamShell({
  moduleLabel,
  paperTitle,
  focus,
  note,
  remainingSeconds,
  totalSeconds,
  sourceLabel,
  sourceNote,
  source,
  questionsHeader,
  questions,
  nav,
  footerExtra,
  answerLabel = "Questions",
  onFinish,
  finishing,
  error,
}: {
  moduleLabel: string;
  paperTitle: string;
  focus: string;
  note?: string | null;
  remainingSeconds: number;
  totalSeconds: number;
  sourceLabel: string;
  sourceNote?: string;
  source: ReactNode;
  questionsHeader?: ReactNode;
  questions: ReactNode;
  /** Omitted for a paper with a single response rather than numbered questions. */
  nav?: ExamNav;
  footerExtra?: ReactNode;
  answerLabel?: string;
  onFinish: () => void;
  finishing: boolean;
  error?: string | null;
}) {
  const [sourceShare, setSourceShare] = useState<"small" | "large">("small");
  const [sourceHidden, setSourceHidden] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const low = remainingSeconds <= 300;
  const paper = nav?.questions ?? [];
  const answered = useMemo(
    () => paper.filter((q) => (nav?.answers[q.n] ?? "").trim() !== "").length,
    [paper, nav?.answers],
  );
  const unanswered = useMemo(
    () => paper.filter((q) => (nav?.answers[q.n] ?? "").trim() === ""),
    [paper, nav?.answers],
  );
  const flaggedList = useMemo(
    () => paper.filter((q) => nav?.flagged.has(q.n)),
    [paper, nav?.flagged],
  );

  // Escape closes the review panel, the way it closes any dialog on the paper.
  useEffect(() => {
    if (!reviewOpen || typeof window === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewOpen]);

  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-paper">
      {/* Fixed bar: identity on the left, clock and submit on the right. */}
      <header className="shrink-0 border-b border-ink bg-ink text-paper">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <p className="bw-label opacity-60">{moduleLabel}</p>
            <p className="truncate text-sm font-semibold">
              {paperTitle}
              <span className="ml-3 hidden font-normal opacity-70 sm:inline">{focus}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2" role="timer" aria-live="off">
              <IconClock className={"h-4 w-4 " + (low ? "text-wrong" : "opacity-70")} />
              <span
                className={
                  "bw-numeric text-lg font-semibold " + (low ? "text-wrong" : "text-paper")
                }
              >
                {clock(remainingSeconds)}
              </span>
              <span className="bw-label hidden opacity-60 sm:inline">left</span>
            </div>

            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className={
                "border border-paper/40 px-3 py-2 text-xs font-medium transition-colors hover:bg-paper hover:text-ink " +
                (paper.length ? "" : "hidden")
              }
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => (paper.length ? setReviewOpen(true) : onFinish())}
              disabled={finishing}
              className="bg-accent px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-accent-ink disabled:opacity-50"
            >
              {finishing ? "Marking…" : "Submit test"}
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-paper/15">
          <div
            className={"h-full transition-[width] duration-500 " + (low ? "bg-wrong" : "bg-accent")}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      </header>

      {note ? (
        <p className="shrink-0 border-b border-rule bg-paper-raised px-4 py-2 text-xs leading-relaxed text-ink-soft sm:px-6">
          {note}
        </p>
      ) : null}

      {error ? (
        <p className="shrink-0 border-b border-wrong bg-paper px-4 py-2 text-sm text-wrong sm:px-6">
          {error}
        </p>
      ) : null}

      {/* On a narrow screen the two panes stack instead of hiding one behind a
          tab, so the passage is still on screen while the questions scroll. */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rule bg-paper-raised px-4 py-1.5 lg:hidden">
        <p className="bw-numeric text-[0.7rem] text-ink-mute">
          {sourceLabel} above · {answered}/{paper.length} answered
        </p>
        <button
          type="button"
          onClick={() => setSourceShare((previous) => (previous === "small" ? "large" : "small"))}
          className="border border-rule-strong px-2.5 py-1.5 text-[0.7rem] font-medium hover:border-ink"
        >
          {sourceShare === "small" ? `Bigger ${sourceLabel.toLowerCase()}` : `Smaller ${sourceLabel.toLowerCase()}`}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Source pane: its own scroll, its own visible scrollbar, and it never
            moves when the question pane scrolls. */}
        <aside
          className={
            "flex min-h-0 flex-col border-rule " +
            (sourceShare === "small" ? "basis-[36%] " : "basis-[54%] ") +
            "lg:basis-auto lg:w-[46%] lg:border-r xl:w-[44%] " +
            (sourceHidden ? "lg:hidden" : "")
          }
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rule bg-paper-raised px-4 py-2">
            <p className="bw-label text-ink-mute">
              {sourceLabel}
              {sourceNote ? <span className="ml-2 font-normal normal-case opacity-70">{sourceNote}</span> : null}
            </p>
            <button
              type="button"
              onClick={() => setSourceHidden((previous) => !previous)}
              className="bw-underline-sweep hidden text-[0.7rem] font-medium text-ink-soft hover:text-ink hover:bw-underline-sweep-on lg:block"
            >
              Hide {sourceLabel.toLowerCase()}
            </button>
          </div>
          <div className="bw-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">{source}</div>
        </aside>

        {/* Question pane: its own scroll, and the navigator beneath it. */}
        <section className="flex min-h-0 flex-1 flex-col">
          {sourceHidden ? (
            <div className="hidden shrink-0 border-b border-rule bg-paper-raised px-4 py-2 lg:block">
              <button
                type="button"
                onClick={() => setSourceHidden(false)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Show {sourceLabel.toLowerCase()} again
              </button>
            </div>
          ) : null}

          {questionsHeader ? (
            <div className="shrink-0 border-b border-rule bg-paper-raised px-4 py-2">
              {questionsHeader}
            </div>
          ) : null}

          <div className="bw-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            {questions}
          </div>

          <footer className="shrink-0 border-t border-rule bg-paper-raised pb-12">
            {paper.length ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => nav?.onJump(Math.max(1, (nav?.current ?? 1) - 1))}
                    className="shrink-0 border border-rule-strong px-3 py-2 text-xs font-medium hover:border-ink"
                  >
                    Previous
                  </button>
                  <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
                    {paper.map((question) => {
                      const isAnswered = (nav?.answers[question.n] ?? "").trim() !== "";
                      const isFlagged = nav?.flagged.has(question.n) ?? false;
                      const isCurrent = question.n === nav?.current;
                      return (
                        <button
                          key={question.n}
                          type="button"
                          onClick={() => nav?.onJump(question.n)}
                          onDoubleClick={() => nav?.onToggleFlag(question.n)}
                          title={
                            isFlagged
                              ? `Question ${question.n}, flagged for review`
                              : `Question ${question.n}${isAnswered ? ", answered" : ", not answered"}`
                          }
                          className={
                            "bw-numeric relative h-8 w-8 shrink-0 border text-xs transition-colors " +
                            (isCurrent
                              ? "border-accent bg-accent text-paper"
                              : isAnswered
                                ? "border-ink bg-ink text-paper hover:border-accent"
                                : "border-rule-strong text-ink-soft hover:border-ink")
                          }
                        >
                          {question.n}
                          {isFlagged ? (
                            <span
                              aria-hidden="true"
                              className="absolute right-0.5 top-0.5 h-1.5 w-1.5 bg-wrong"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => nav?.onJump(Math.min(paper.length, (nav?.current ?? 1) + 1))}
                    className="shrink-0 border border-rule-strong px-3 py-2 text-xs font-medium hover:border-ink"
                  >
                    Next
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-3 py-1.5">
                  <p className="bw-numeric text-[0.7rem] text-ink-mute">
                    {answered} of {paper.length} answered
                    {flaggedList.length ? ` · ${flaggedList.length} flagged` : ""}
                  </p>
                  <p className="text-[0.7rem] text-ink-mute">
                    Click a number to jump, double click to flag it.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                {footerExtra}
                <p className="text-[0.7rem] text-ink-mute">
                  Your answer is saved as you type. Submit when you are ready.
                </p>
              </div>
            )}
          </footer>
        </section>
      </div>

      {reviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReviewOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-ink bg-paper p-6"
          >
            <p className="bw-label text-accent">Review</p>
            <h2 id="review-title" className="mt-2 text-xl font-semibold tracking-tight">
              {unanswered.length === 0
                ? "Every question has an answer."
                : `${unanswered.length} question${unanswered.length === 1 ? "" : "s"} still blank`}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Submitting hands the paper in. Click anything below to go straight to it, then review
              again when you are ready.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="bw-label text-ink-mute">Not answered</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unanswered.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-correct">
                      <IconTick className="h-4 w-4" /> none
                    </p>
                  ) : (
                    unanswered.map((question) => (
                      <button
                        key={question.n}
                        type="button"
                        onClick={() => {
                          nav?.onJump(question.n);
                          setReviewOpen(false);
                        }}
                        className="bw-numeric h-8 w-8 border border-rule-strong text-xs text-ink-soft hover:border-ink"
                      >
                        {question.n}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="bw-label text-ink-mute">Flagged</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {flaggedList.length === 0 ? (
                    <p className="text-xs text-ink-mute">nothing flagged</p>
                  ) : (
                    flaggedList.map((question) => (
                      <button
                        key={question.n}
                        type="button"
                        onClick={() => {
                          nav?.onJump(question.n);
                          setReviewOpen(false);
                        }}
                        className="bw-numeric h-8 w-8 border border-wrong text-xs text-wrong"
                      >
                        {question.n}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
              <button
                type="button"
                onClick={onFinish}
                disabled={finishing}
                className="bg-accent px-5 py-3 text-sm font-semibold text-paper hover:bg-accent-ink disabled:opacity-50"
              >
                {finishing ? "Marking…" : "Submit the paper"}
              </button>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="border border-rule-strong px-4 py-3 text-xs font-medium hover:border-ink"
              >
                Keep working
              </button>
              <p className="bw-numeric text-[0.7rem] text-ink-mute">
                {answered}/{paper.length} answered
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
