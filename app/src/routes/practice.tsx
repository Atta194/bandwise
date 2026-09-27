import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EXAM_SKILLS,
  LISTENING_STRATEGIES,
  PRACTICE_NOTE,
  READING_STRATEGIES,
  SPEAKING_STRATEGY,
  WRITING_STRATEGY,
  type ListeningTaskType,
  type ReadingTaskType,
} from "../content";
import { ApiError, api, useSession, type StartResponse } from "../lib/session";
import { ListeningTest } from "../components/listening-test";
import { ReadingTest } from "../components/reading-test";
import { WritingTest } from "../components/writing-test";
import { EmptyState, Panel, type AnswerMap } from "../components/test-ui";
import {
  IconBook,
  IconHeadphones,
  IconMic,
  IconPen,
  PageHeader,
  SiteFooter,
  SiteNav,
} from "../components/ui";

type PracticeSearch = { module?: string; type?: string; focus?: string };

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => ({
    module: typeof search.module === "string" ? search.module : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
    focus: typeof search.focus === "string" ? search.focus : undefined,
  }),
  component: PracticeRoute,
});

const MODULE_TABS = [
  { id: "reading", title: "Reading", icon: IconBook },
  { id: "listening", title: "Listening", icon: IconHeadphones },
  { id: "writing", title: "Writing", icon: IconPen },
  { id: "speaking", title: "Speaking", icon: IconMic },
] as const;

type ModuleTab = (typeof MODULE_TABS)[number]["id"];

/** The question families that actually appear in the paper, in paper order. */
const TYPE_ORDER: Record<ModuleTab, string[]> = {
  reading: [
    "matching_headings",
    "matching_information",
    "matching_features",
    "sentence_endings",
    "summary_completion",
    "note_completion",
    "table_completion",
    "sentence_completion",
    "tfng",
    "ynng",
    "multiple_choice",
    "short_answer",
  ],
  listening: [
    "form_completion",
    "note_completion",
    "table_completion",
    "flow_chart_completion",
    "sentence_completion",
    "multiple_choice",
    "matching",
    "diagram_labelling",
    "short_answer",
  ],
  writing: ["task1", "task2"],
  speaking: ["part1", "part2", "part3"],
};

function titleFor(type: string): string {
  return type.replace(/_/g, " ");
}

type Strategy = { strategy: string; tips: string[]; skill?: string };

function strategyFor(module: ModuleTab, type: string): Strategy | undefined {
  if (module === "reading") {
    return (READING_STRATEGIES as Record<string, Strategy>)[type];
  }
  if (module === "listening") {
    return (LISTENING_STRATEGIES as Record<string, Strategy>)[type];
  }
  if (module === "writing") {
    const writing = type === "task1" ? WRITING_STRATEGY.task1 : WRITING_STRATEGY.task2;
    return {
      strategy: writing.strategy,
      tips: writing.tips,
      skill: type === "task1" ? "Selecting and comparing data" : "Argument structure",
    };
  }
  const key = type as "part1" | "part2" | "part3";
  const speaking = SPEAKING_STRATEGY[key] ?? SPEAKING_STRATEGY.part1;
  return { strategy: speaking.strategy, tips: speaking.tips };
}

function PracticeRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const session = useSession();

  const [module, setModule] = useState<ModuleTab>(() => {
    const value = search.module;
    return value === "listening" || value === "writing" || value === "speaking" ? value : "reading";
  });
  const [types, setTypes] = useState<string[]>(() => (search.type ? [search.type] : []));
  const [run, setRun] = useState<StartResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.loading) return;
    if (!session.user) void navigate({ to: "/account" });
  }, [session.loading, session.user, navigate]);

  const available = TYPE_ORDER[module];
  const chosen = types.filter((type) => available.includes(type));
  const preview = chosen.length ? chosen : available;
  const strategy = useMemo(() => strategyFor(module, preview[0]), [module, preview]);

  const toggle = (type: string) =>
    setTypes((previous) =>
      previous.includes(type) ? previous.filter((t) => t !== type) : [...previous, type],
    );

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (module === "reading" || module === "listening") {
        const next = await api<StartResponse>("practice/start", {
          kind: "drill",
          module,
          types: chosen,
        });
        setRun(next);
      } else if (module === "writing") {
        const focus = chosen[0] === "task1" ? "task1" : "task2";
        const next = await api<StartResponse>("practice/start", {
          kind: "mock",
          module: "writing",
          focus,
        });
        setRun(next);
      } else {
        void navigate({ to: "/test/$module", params: { module: "speaking" } });
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That drill could not be started.");
    } finally {
      setBusy(false);
    }
  }, [module, chosen, navigate]);

  const submit = useCallback(
    async (answers: AnswerMap, mode?: "heard" | "read" | "mixed") => {
      if (!run) return;
      setBusy(true);
      setError(null);
      try {
        await api("practice/submit", { attemptId: run.attemptId, answers, mode });
        void navigate({ to: "/review/$attemptId", params: { attemptId: run.attemptId } });
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "The drill was not saved.");
        setBusy(false);
      }
    },
    [run, navigate],
  );

  const submitWriting = useCallback(
    async (responses: { task: number; text: string }[]) => {
      if (!run) return;
      setBusy(true);
      setError(null);
      try {
        await api("practice/submit", { attemptId: run.attemptId, responses });
        void navigate({ to: "/review/$attemptId", params: { attemptId: run.attemptId } });
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "The response was not saved.");
        setBusy(false);
      }
    },
    [run, navigate],
  );

  if (run && run.module === "reading") {
    return <ReadingTest run={run} busy={busy} error={error} onSubmit={(answers) => void submit(answers)} />;
  }
  if (run && run.module === "listening") {
    return (
      <ListeningTest
        run={run}
        busy={busy}
        error={error}
        onSubmit={(answers, mode) => void submit(answers, mode)}
      />
    );
  }
  if (run && run.module === "writing") {
    return (
      <WritingTest
        run={run}
        busy={busy}
        error={error}
        onSubmit={(responses) => void submitWriting(responses)}
      />
    );
  }

  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        <PageHeader
          eyebrow="Focused practice"
          title="Work one question family until it stops costing you marks."
          lede="Pick the module, pick the question types the dashboard flagged, read the strategy, then drill the type on official format questions drawn from the same pool the full mocks use."
        />

        <section className="mt-8">
          <div className="flex flex-wrap gap-2">
            {MODULE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === module;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setModule(tab.id);
                    setTypes([]);
                    setError(null);
                  }}
                  className={
                    "inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors " +
                    (active ? "border-ink bg-ink text-paper" : "border-rule-strong text-ink-soft hover:border-ink")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.title}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="border-b border-rule pb-3">
              <p className="bw-label text-ink-mute">Question families</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Choose one or more. Leave them all off to be given a mixed run of every family in this
                module.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {available.map((type) => {
                const active = chosen.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggle(type)}
                    className={
                      "border px-3 py-2 text-xs font-medium capitalize transition-colors " +
                      (active ? "border-accent bg-accent text-paper" : "border-rule-strong text-ink-soft hover:border-ink")
                    }
                  >
                    {titleFor(type)}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => void start()}
                disabled={busy}
                className="bg-accent px-6 py-3.5 text-sm font-semibold text-paper hover:bg-accent-ink disabled:opacity-50"
              >
                {busy
                  ? "Preparing…"
                  : module === "speaking"
                    ? "Start a speaking mock"
                    : chosen.length
                      ? `Drill ${chosen.length} question ${chosen.length === 1 ? "family" : "families"}`
                      : `Drill every ${module} family`}
              </button>
              {error ? <p className="text-sm text-wrong">{error}</p> : null}
            </div>

            <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-ink-mute">{PRACTICE_NOTE}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {EXAM_SKILLS.map((skill) => (
                <div key={skill.name} className="border-t border-rule pt-4">
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{skill.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {strategy ? (
              <Panel label={`Strategy: ${titleFor(preview[0])}`}>
                <p className="text-sm leading-relaxed text-ink-soft">{strategy.strategy}</p>
                <ul className="mt-4 space-y-2">
                  {strategy.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                      <span className="bw-numeric text-accent" aria-hidden="true">
                        →
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
                {strategy.skill ? (
                  <p className="mt-4 text-[0.7rem] text-ink-mute">Trains: {strategy.skill}</p>
                ) : null}
                {chosen.length > 1 ? (
                  <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-mute">
                    Showing the strategy for {titleFor(preview[0])}. Each family you drill has its own
                    strategy on the desk once the run is marked.
                  </p>
                ) : null}
              </Panel>
            ) : (
              <EmptyState title="No strategy stored" body="Choose a question family to see its strategy." />
            )}

            <Panel label="Where the drill comes from">
              <p className="text-xs leading-relaxed text-ink-soft">
                Every question is drawn from the same pool and the same key as the full mocks, so the
                marking, the evidence and the trap classification are identical. Nothing here is a
                demo question.
              </p>
            </Panel>

            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Other ways in</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/mistakes" className="text-accent hover:underline">
                    Mistake lab: every mark you have lost
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-accent hover:underline">
                    Analytics: accuracy by question type
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-accent hover:underline">
                    The desk: obtained, target and progress
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
