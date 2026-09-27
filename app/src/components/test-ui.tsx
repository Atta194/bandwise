/**
 * Shared exam interface furniture: the locked countdown, the question
 * navigator across every question, the answer controls, and the group renderer
 * that prints an instruction line once and then its numbered questions, the way
 * the real paper does.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { ReadingQuestionView } from "../lib/session";
import { IconClock } from "./ui";

export type AnswerMap = Record<number, string>;

/* --------------------------------------------------------------- countdown */

export function useCountdown(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const left = Math.max(0, seconds - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(left);
      if (left === 0) {
        window.clearInterval(id);
        expire.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [seconds]);

  return remaining;
}

export function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TimerBar({
  remaining,
  total,
  moduleLabel,
  mockTitle,
  onFinish,
  finishing,
}: {
  remaining: number;
  total: number;
  moduleLabel: string;
  mockTitle: string;
  onFinish: () => void;
  finishing: boolean;
}) {
  const low = remaining <= 300;
  const progress = total > 0 ? 1 - remaining / total : 0;
  return (
    <div className="sticky top-[68px] z-20 border-b border-rule bg-paper-raised">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="bw-label text-ink-mute">{moduleLabel}</span>
          <span className="text-sm font-semibold">{mockTitle}</span>
        </div>

        <div className="flex items-center gap-5">
          <div
            className="flex items-center gap-2"
            role="timer"
            aria-live="off"
          >
            <IconClock className={"h-4 w-4 " + (low ? "text-wrong" : "text-ink-mute")} />
            <span
              className={
                "bw-numeric text-lg font-semibold " + (low ? "text-wrong" : "text-ink")
              }
            >
              {formatClock(remaining)}
            </span>
            <span className="bw-label text-ink-mute">left</span>
          </div>
          <button
            type="button"
            onClick={onFinish}
            disabled={finishing}
            className="bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-accent disabled:opacity-50"
          >
            {finishing ? "Marking…" : "Finish and mark"}
          </button>
        </div>
      </div>
      <div className="h-0.5 w-full bg-rule">
        <div
          className={"h-full transition-[width] duration-500 " + (low ? "bg-wrong" : "bg-accent")}
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- navigator */

export function QuestionNavigator({
  questions,
  answers,
  flagged,
  current,
  onJump,
  onToggleFlag,
}: {
  questions: ReadingQuestionView[];
  answers: AnswerMap;
  flagged: Set<number>;
  current: number;
  onJump: (n: number) => void;
  onToggleFlag: (n: number) => void;
}) {
  const answered = questions.filter((q) => (answers[q.n] ?? "").trim() !== "").length;
  return (
    <div className="border border-rule bg-paper-raised p-4">
      <div className="flex items-baseline justify-between">
        <p className="bw-label text-ink-mute">Navigator</p>
        <p className="bw-numeric text-xs text-ink-soft">
          {answered}/{questions.length}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-8 gap-1.5">
        {questions.map((q) => {
          const isAnswered = (answers[q.n] ?? "").trim() !== "";
          const isFlagged = flagged.has(q.n);
          const isCurrent = q.n === current;
          return (
            <button
              key={q.n}
              type="button"
              onClick={() => onJump(q.n)}
              onDoubleClick={() => onToggleFlag(q.n)}
              title={isFlagged ? `Question ${q.n}, flagged` : `Question ${q.n}`}
              className={
                "bw-numeric relative aspect-square border text-xs transition-colors " +
                (isCurrent
                  ? "border-accent bg-accent text-paper"
                  : isAnswered
                    ? "border-ink bg-ink text-paper hover:border-accent"
                    : "border-rule-strong text-ink-soft hover:border-ink")
              }
            >
              {q.n}
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
      <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-mute">
        Click to jump. Double click to flag a question you want to come back to.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ answer field */

const TFNG = ["TRUE", "FALSE", "NOT GIVEN"];
const YNNG = ["YES", "NO", "NOT GIVEN"];

export function isChoiceType(type: string): boolean {
  return (
    type === "multiple_choice" ||
    type === "matching_headings" ||
    type === "matching_features" ||
    type === "matching_information" ||
    type === "matching" ||
    type === "sentence_endings" ||
    type === "diagram_labelling"
  );
}

export function isBooleanType(type: string): boolean {
  return type === "tfng" || type === "ynng";
}

export function AnswerControl({
  question,
  value,
  onChange,
  locked,
}: {
  question: ReadingQuestionView;
  value: string;
  onChange: (value: string) => void;
  locked: boolean;
}) {
  if (isBooleanType(question.type)) {
    const options = question.type === "tfng" ? TFNG : YNNG;
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => onChange(selected ? "" : option)}
              className={
                "border px-3 py-1.5 text-xs font-medium transition-colors " +
                (selected
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-strong text-ink-soft hover:border-ink hover:text-ink")
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (isChoiceType(question.type) && question.options?.length) {
    return (
      <div className="grid gap-1.5">
        {question.options.map((option) => {
          const selected = value === option;
          const compact = /^[A-Z]$/.test(option);
          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => onChange(selected ? "" : option)}
              className={
                "flex items-start gap-2.5 border px-3 py-2 text-left text-sm transition-colors " +
                (selected
                  ? "border-ink bg-paper-sunk"
                  : "border-rule hover:border-rule-strong") +
                (compact ? " w-fit bw-numeric px-4" : "")
              }
            >
              <span
                aria-hidden="true"
                className={
                  "mt-1 inline-block h-2.5 w-2.5 shrink-0 border " +
                  (selected ? "border-ink bg-ink" : "border-rule-strong")
                }
              />
              <span className={selected ? "font-medium" : "text-ink-soft"}>{option}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      disabled={locked}
      onChange={(event) => onChange(event.target.value)}
      aria-label={`Answer ${question.n}`}
      placeholder="your answer"
      autoComplete="off"
      className="w-full max-w-xs border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
    />
  );
}

/* ---------------------------------------------------------- group renderer */

type Group = { group: string; instruction: string; questions: ReadingQuestionView[] };

export function groupQuestions(questions: ReadingQuestionView[]): Group[] {
  const groups: Group[] = [];
  for (const question of questions) {
    const last = groups[groups.length - 1];
    if (last && last.instruction === question.instruction && last.group === question.group) {
      last.questions.push(question);
    } else {
      groups.push({
        group: question.group,
        instruction: question.instruction,
        questions: [question],
      });
    }
  }
  return groups;
}

export function QuestionList({
  questions,
  answers,
  current,
  flagged,
  onAnswer,
  onToggleFlag,
  locked,
  anchorId,
}: {
  questions: ReadingQuestionView[];
  answers: AnswerMap;
  current: number;
  flagged: Set<number>;
  onAnswer: (n: number, value: string) => void;
  onToggleFlag: (n: number) => void;
  locked: boolean;
  anchorId: (n: number) => string;
}) {
  const groups = groupQuestions(questions);
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={`${group.group}-${group.questions[0].n}`}>
          {/* The instruction line stays pinned to the top of the scrolling pane,
              so the candidate never loses the rule for the questions in view. */}
          <div className="sticky top-0 z-10 border-y border-rule bg-paper-raised px-4 py-3">
            <p className="bw-label text-accent">{group.group}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{group.instruction}</p>
          </div>
          <div className="mt-4 space-y-6">
            {group.questions.map((question) => {
              const isCurrent = question.n === current;
              return (
                <div
                  key={question.n}
                  id={anchorId(question.n)}
                  className={
                    "scroll-mt-40 border-l-2 pl-4 transition-colors " +
                    (isCurrent ? "border-accent" : "border-transparent")
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[0.95rem] leading-relaxed">
                      <span className="bw-numeric mr-2 font-semibold">{question.n}</span>
                      {question.stem}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleFlag(question.n)}
                      className={
                        "shrink-0 border px-2 py-1 text-[0.65rem] font-medium " +
                        (flagged.has(question.n)
                          ? "border-wrong text-wrong"
                          : "border-rule text-ink-mute hover:border-ink hover:text-ink")
                      }
                    >
                      {flagged.has(question.n) ? "flagged" : "flag"}
                    </button>
                  </div>
                  <div className="mt-3">
                    <AnswerControl
                      question={question}
                      value={answers[question.n] ?? ""}
                      onChange={(value) => onAnswer(question.n, value)}
                      locked={locked}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- utilities */

export function useStickyRefs() {
  const refs = useRef<Record<number, HTMLElement | null>>({});
  const register = useCallback((n: number, element: HTMLElement | null) => {
    refs.current[n] = element;
  }, []);
  return { refs, register };
}

/** Scrolls the current question into view when the navigator jumps. */
export function useScrollToCurrent(current: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const element = document.getElementById(`q-${current}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current, enabled]);
}

export function Panel({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={"border border-rule bg-paper-raised p-4 " + (className ?? "")}>
      {label ? <p className="bw-label text-ink-mute">{label}</p> : null}
      <div className={label ? "mt-2" : ""}>{children}</div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-rule-strong p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
