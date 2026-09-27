/**
 * Reading runner, laid out like the computer-delivered paper: the passage pane
 * holds its position and scrolls on its own, the questions scroll on their own,
 * and the navigator runs along the bottom. Hiding the passage widens the
 * questions, which is what the real test lets you do.
 */
import { useCallback, useMemo, useState } from "react";

import type { ReadingQuestionView, StartResponse } from "../lib/session";
import { ExamShell } from "./exam-shell";
import {
  AnswerMap,
  EmptyState,
  QuestionList,
  useCountdown,
  useScrollToCurrent,
} from "./test-ui";

type Passage = {
  index: number;
  title: string;
  standfirst: string;
  paragraphs: string[];
  wordCount: number;
};

export function ReadingTest({
  run,
  onSubmit,
  busy,
  error,
}: {
  run: StartResponse;
  onSubmit: (answers: AnswerMap) => void;
  busy: boolean;
  error: string | null;
}) {
  const payload = run.payload as { passages: Passage[]; questions: ReadingQuestionView[] };
  const questions = payload.questions;
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(1);

  const remaining = useCountdown(run.minutes * 60, () => onSubmit(answers));
  useScrollToCurrent(current, true);

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.n] ?? "").trim() !== "").length,
    [questions, answers],
  );

  const setAnswer = (n: number, value: string) =>
    setAnswers((previous) => ({ ...previous, [n]: value }));

  const toggleFlag = (n: number) =>
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const jump = useCallback((n: number) => {
    setCurrent(n);
    if (typeof window !== "undefined") {
      document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const words = payload.passages.reduce((total, passage) => total + passage.wordCount, 0);

  return (
    <ExamShell
      moduleLabel="Academic Reading"
      paperTitle={run.mockTitle}
      focus={run.focus}
      remainingSeconds={remaining}
      totalSeconds={run.minutes * 60}
      sourceLabel="Passage"
      sourceNote={`${payload.passages.length} passages · ${words.toLocaleString()} words`}
      source={
        <div>
          <div className="sticky top-0 z-10 flex flex-wrap gap-1.5 border-b border-rule bg-paper px-4 py-2">
            {payload.passages.map((passage) => (
              <button
                key={passage.index}
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  document
                    .getElementById(`passage-${passage.index}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="border border-rule-strong px-2.5 py-1.5 text-[0.7rem] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <span className="bw-numeric mr-1.5">P{passage.index}</span>
                {passage.title}
              </button>
            ))}
          </div>

          <div className="bw-prose px-4 py-5 sm:px-5">
            {payload.passages.map((passage) => (
              <article
                key={passage.index}
                id={`passage-${passage.index}`}
                className="mb-14 scroll-mt-12 last:mb-0"
              >
                <p className="bw-label text-accent">
                  Passage {passage.index} · {passage.wordCount} words
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{passage.title}</h2>
                <p className="mt-1 text-sm text-ink-mute">{passage.standfirst}</p>
                <div className="mt-4">
                  {passage.paragraphs.map((paragraph, index) => (
                    <p key={index}>
                      <span className="bw-numeric mr-2 font-semibold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      }
      questionsHeader={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="bw-label text-accent">Questions</p>
          <p className="bw-numeric text-[0.7rem] text-ink-mute">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
      }
      questions={
        questions.length ? (
          <QuestionList
            questions={questions}
            answers={answers}
            current={current}
            flagged={flagged}
            onAnswer={setAnswer}
            onToggleFlag={toggleFlag}
            locked={busy}
            anchorId={(n) => `q-${n}`}
          />
        ) : (
          <EmptyState title="No questions" body="This paper has no questions loaded." />
        )
      }
      nav={{
        questions,
        answers,
        flagged,
        current,
        onJump: jump,
        onToggleFlag: toggleFlag,
      }}
      onFinish={() => onSubmit(answers)}
      finishing={busy}
      error={error}
    />
  );
}
