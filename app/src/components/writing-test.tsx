/**
 * Writing runner, laid out like the computer-delivered paper: the task and its
 * chart stay in the source pane, the answer fills the other pane, the two tasks
 * are tabs, and the word count against the official minimum sits in view the
 * whole time.
 */
import { useMemo, useState } from "react";

import type { ChartSpec } from "../content";
import type { StartResponse } from "../lib/session";
import { renderChart } from "./charts";
import { ExamShell } from "./exam-shell";
import { useCountdown } from "./test-ui";

type WritingTaskView = {
  task: 1 | 2;
  prompt: string;
  minWords: number;
  suggestedMinutes: number;
  chart?: ChartSpec;
  expects: string;
};

function countWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}

export function WritingTest({
  run,
  onSubmit,
  busy,
  error,
}: {
  run: StartResponse;
  onSubmit: (responses: { task: number; text: string }[]) => void;
  busy: boolean;
  error: string | null;
}) {
  const payload = run.payload as { tasks: WritingTaskView[] };
  const tasks = payload.tasks;
  const [active, setActive] = useState<1 | 2>(tasks[0]?.task ?? 1);
  const [drafts, setDrafts] = useState<Record<number, string>>({ 1: "", 2: "" });

  const remaining = useCountdown(run.minutes * 60, () =>
    onSubmit(tasks.map((task) => ({ task: task.task, text: drafts[task.task] ?? "" }))),
  );

  const task = tasks.find((t) => t.task === active) ?? tasks[0];
  const words = useMemo(() => countWords(drafts[active] ?? ""), [drafts, active]);
  const short = words < task.minWords;
  const totalWords = tasks.reduce((sum, t) => sum + countWords(drafts[t.task] ?? ""), 0);

  return (
    <ExamShell
      moduleLabel={tasks.length === 1 ? "Academic Writing" : "Academic Writing · Task 1 and Task 2"}
      paperTitle={run.mockTitle}
      focus={run.focus}
      remainingSeconds={remaining}
      totalSeconds={run.minutes * 60}
      sourceLabel="Task"
      sourceNote={`Task ${task.task} · at least ${task.minWords} words`}
      answerLabel="Answer"
      source={
        <div className="px-4 py-5 sm:px-5">
          <div className="border border-rule bg-paper-raised p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="bw-label text-accent">Task {task.task}</p>
              <p className="bw-numeric text-xs text-ink-mute">
                at least {task.minWords} words · about {task.suggestedMinutes} minutes
              </p>
            </div>
            <p className="mt-4 text-[0.95rem] leading-relaxed">{task.prompt}</p>
          </div>

          {task.chart ? <div className="mt-5">{renderChart(task.chart)}</div> : null}

          <div className="mt-5 border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">What this task is testing</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {task.expects === "argument"
                ? "A clear position, held and developed, with reasons and examples, organised into paragraphs."
                : task.expects === "process_description"
                  ? "An accurate account of the stages in order, with the passive voice where the actor is unknown."
                  : task.expects === "map_comparison"
                    ? "The changes between the two views, grouped by type of change rather than listed one by one."
                    : "An overview first, then selected figures compared, with the significant trends named."}
            </p>
          </div>

          <div className="mt-5 border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Timing</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Task 2 carries twice the weight of Task 1, so twenty minutes on Task 1 and forty on
              Task 2 is the usual split. You can move between them at any time on the other pane.
            </p>
          </div>
        </div>
      }
      questionsHeader={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 border border-rule p-0.5">
            {tasks.map((t) => (
              <button
                key={t.task}
                type="button"
                onClick={() => setActive(t.task)}
                className={
                  "px-3 py-1.5 text-xs font-medium transition-colors " +
                  (t.task === active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                }
              >
                Task {t.task}
                <span className="bw-numeric ml-2 opacity-70">
                  {countWords(drafts[t.task] ?? "")}w
                </span>
              </button>
            ))}
          </div>
          <p className={"bw-numeric text-sm " + (short ? "text-wrong" : "text-correct")}>
            {words} of {task.minWords} words
          </p>
        </div>
      }
      questions={
        <div className="flex h-full flex-col">
          {short && words > 0 ? (
            <p className="mb-3 border border-wrong px-4 py-2.5 text-xs text-wrong">
              {task.minWords - words} more words needed for Task {task.task}. A response under the
              minimum is penalised before anything else is considered.
            </p>
          ) : null}
          <textarea
            value={drafts[active] ?? ""}
            disabled={busy}
            onChange={(event) =>
              setDrafts((previous) => ({ ...previous, [active]: event.target.value }))
            }
            spellCheck
            placeholder="Write your answer here. Leave a blank line between paragraphs."
            className="min-h-[420px] w-full flex-1 resize-none border border-rule-strong bg-paper-raised p-4 text-[0.95rem] leading-relaxed outline-none focus:border-accent"
          />
        </div>
      }
      footerExtra={
        <p className="bw-numeric text-[0.7rem] text-ink-mute">
          both tasks: {totalWords} words
        </p>
      }
      onFinish={() => onSubmit(tasks.map((t) => ({ task: t.task, text: drafts[t.task] ?? "" })))}
      finishing={busy}
      error={error}
    />
  );
}
