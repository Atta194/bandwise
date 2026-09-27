import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MODULES, TRAP_LABELS, type TrapType } from "../content";
import { api, useSession, type AnalyticsResponse, type MistakeRow } from "../lib/session";
import { EmptyState } from "../components/test-ui";
import {
  MODULE_LABELS,
  MeasureNote,
  PageHeader,
  SiteFooter,
  SiteNav,
} from "../components/ui";

export const Route = createFileRoute("/mistakes")({
  component: MistakesRoute,
});

function MistakesRoute() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [items, setItems] = useState<MistakeRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [trapFilter, setTrapFilter] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<string>("");
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [mistakes, stats] = await Promise.all([
      api<{ items: MistakeRow[] }>("mistakes/get", {
        module: moduleFilter || undefined,
        trap: trapFilter || undefined,
        taskType: taskFilter || undefined,
      }),
      api<AnalyticsResponse>("analytics/get"),
    ]);
    setItems(mistakes.items);
    setAnalytics(stats);
    setReady(true);
  }, [moduleFilter, trapFilter, taskFilter]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/account" });
      return;
    }
    setReady(false);
    void load();
  }, [loading, user, navigate, load]);

  const taskTypes = useMemo(
    () => (analytics?.types ?? []).map((t) => t.type).filter(Boolean),
    [analytics],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, MistakeRow[]>();
    for (const item of items) {
      const key = item.trap ?? "unclassified";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        <PageHeader
          eyebrow="Mistake Lab"
          title="Every mark you have lost, filed by why you lost it."
          lede="Filter by module, by the type of trap, or by the kind of task. The same error appearing three times in one column is the thing to fix next."
        />

        {!user ? null : (
          <>
            <section className="mt-10 grid gap-4 border border-rule bg-paper-raised p-5 md:grid-cols-3">
              <Filter
                label="Module"
                value={moduleFilter}
                onChange={setModuleFilter}
                options={[
                  { value: "", label: "All modules" },
                  ...MODULES.map((m) => ({ value: m.id, label: m.title })),
                ]}
              />
              <Filter
                label="Trap"
                value={trapFilter}
                onChange={setTrapFilter}
                options={[
                  { value: "", label: "All traps" },
                  ...(Object.keys(TRAP_LABELS) as TrapType[]).map((trap) => ({
                    value: trap,
                    label: TRAP_LABELS[trap],
                  })),
                ]}
              />
              <Filter
                label="Task type"
                value={taskFilter}
                onChange={setTaskFilter}
                options={[
                  { value: "", label: "All task types" },
                  ...taskTypes.map((type) => ({
                    value: type,
                    label: type.replace(/_/g, " "),
                  })),
                ]}
              />
            </section>

            <p className="bw-numeric mt-6 text-sm text-ink-soft">
              {items.length} filed wrong answer{items.length === 1 ? "" : "s"}
            </p>

            {ready && items.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Nothing filed under these filters"
                  body="Either you have not lost a mark here, or no attempt has been marked yet. Reset Test and finish a module to start the record."
                />
              </div>
            ) : null}

            <div className="mt-8 space-y-12">
              {grouped.map(([trap, rows]) => (
                <section key={trap}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {trap === "unclassified"
                        ? "Unclassified"
                        : TRAP_LABELS[trap as TrapType]}
                    </h2>
                    <p className="bw-numeric text-sm text-ink-mute">
                      {rows.length} question{rows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="mt-3 max-w-[80ch] text-sm leading-relaxed text-ink-soft">
                    {rows[0].coach}
                  </p>

                  <div className="mt-4 divide-y divide-rule">
                    {rows.map((row) => (
                      <article key={row.id} className="py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="bw-label text-ink-mute">
                              {MODULE_LABELS[row.module]} · Question {row.questionNo} ·{" "}
                              {row.taskType.replace(/_/g, " ")}
                            </p>
                            <p className="mt-2 text-[0.95rem] leading-relaxed">{row.stem}</p>
                            <MeasureNote>{row.evidence}</MeasureNote>
                          </div>
                          <div className="grid shrink-0 gap-3 text-right sm:grid-cols-2">
                            <div>
                              <p className="bw-label text-ink-mute">You wrote</p>
                              <p className="bw-numeric mt-1 text-sm text-wrong">
                                {row.given && row.given.trim() !== "" ? row.given : "blank"}
                              </p>
                            </div>
                            <div>
                              <p className="bw-label text-ink-mute">Key</p>
                              <p className="bw-numeric mt-1 text-sm text-correct">{row.correct}</p>
                            </div>
                          </div>
                        </div>
                        <Link
                          to="/review/$attemptId"
                          params={{ attemptId: row.attemptId }}
                          className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
                        >
                          Open the full attempt
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="bw-label text-ink-mute">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-rule-strong bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
