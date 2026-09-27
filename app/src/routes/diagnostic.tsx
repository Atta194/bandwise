import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { TRAP_COACHING, TRAP_LABELS, type TrapType } from "../content";
import { DIAGNOSTIC_COPY } from "../content/diagnostic";
import {
  ApiError,
  api,
  useSession,
  type AttemptDetail,
  type StartResponse,
} from "../lib/session";
import { DiagnosticTest } from "../components/diagnostic-test";
import { CefrPanel, PriorityList } from "../components/progress";
import { BandCTA, PageHeader, SiteFooter, SiteNav, formatBand } from "../components/ui";
import type { AnswerMap } from "../components/test-ui";

export const Route = createFileRoute("/diagnostic")({
  component: DiagnosticRoute,
});

function DiagnosticRoute() {
  const navigate = useNavigate();
  const session = useSession();
  const [run, setRun] = useState<StartResponse | null>(null);
  const [result, setResult] = useState<AttemptDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api<StartResponse>("practice/start", { kind: "diagnostic" });
      setRun(next);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The level check could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.loading) return;
    if (!session.user) {
      void navigate({ to: "/account" });
      return;
    }
    if (!run && !result) void start();
  }, [session.loading, session.user, run, result, start, navigate]);

  const submit = useCallback(
    async (answers: AnswerMap, mode: "heard" | "read") => {
      if (!run) return;
      setBusy(true);
      setError(null);
      try {
        await api("practice/submit", { attemptId: run.attemptId, answers, mode });
        const detail = await api<AttemptDetail>("practice/get", { attemptId: run.attemptId });
        setResult(detail);
        void session.refresh();
      } catch (caught) {
        setError(
          caught instanceof ApiError ? caught.message : "The attempt was not saved. Try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [run, session],
  );

  return (
    <div>
      {result ? null : <SiteNav />}

      {run && !result ? (
        <DiagnosticTest run={run} onSubmit={submit} busy={busy} error={error} />
      ) : null}

      {!run && !result ? (
        <main className="mx-auto max-w-[1180px] px-5 py-20">
          <p className="bw-label text-ink-mute">Level check</p>
          <p className="mt-3 text-lg font-medium">
            {loading ? "Building your paper…" : error ?? "Preparing…"}
          </p>
          {error ? (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-5 bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-accent"
            >
              Try again
            </button>
          ) : null}
        </main>
      ) : null}

      {result ? <LevelCheckResult detail={result} name={session.user?.name ?? "there"} /> : null}
    </div>
  );
}

function LevelCheckResult({ detail, name }: { detail: AttemptDetail; name: string }) {
  const attempt = detail.attempt;
  const band = attempt.band ?? 0;
  const wrong = detail.items.filter((item) => !item.is_correct);
  const traps = (attempt.summary?.byTrap ?? []).slice(0, 3) as { trap: TrapType; count: number }[];
  const weakest = detail.areas[0];

  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        <PageHeader
          eyebrow="Level check result"
          title={`${name}, your indicative band is ${formatBand(band)}.`}
          lede="This is where you are today, measured on official format questions at official difficulty. Everything below it comes from the twenty three answers you just gave."
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
            <div className="bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Indicative band</p>
              <p className="bw-numeric mt-2 text-4xl font-semibold">{formatBand(band)}</p>
              <p className="mt-1 text-xs text-ink-soft">{attempt.bandText}</p>
            </div>
            <div className="bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Raw mark</p>
              <p className="bw-numeric mt-2 text-4xl font-semibold">
                {attempt.rawScore}/{attempt.total}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                projected to {attempt.summary?.equivalent ?? "—"}/40
              </p>
            </div>
            <div className="bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Marks to review</p>
              <p className="bw-numeric mt-2 text-4xl font-semibold text-wrong">{wrong.length}</p>
              <p className="mt-1 text-xs text-ink-soft">every one is explained below</p>
            </div>
          </div>

          <CefrPanel band={band} />
        </section>

        <section className="mt-10 border-l-2 border-accent pl-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            This check was {attempt.total} questions rather than a full 40 question paper, so the band
            carries a wider margin than a full mock. Treat it as a starting line: it tells you which
            question types to work on, and the full mocks will tighten the number.
          </p>
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="border-b border-rule pb-3">
              <h2 className="text-xl font-semibold tracking-tight">Where to focus first</h2>
              <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
                Question types ordered by the marks they cost you in this check. Drill the top one
                before you sit a full mock.
              </p>
            </div>
            <div className="mt-4">
              <PriorityList areas={detail.areas} limit={5} />
            </div>
          </div>

          <div>
            <div className="border-b border-rule pb-3">
              <h2 className="text-xl font-semibold tracking-tight">Why you lost marks</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Each wrong answer is filed by the reason it went wrong.
              </p>
            </div>
            <div className="mt-4 space-y-4">
              {traps.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No pattern yet. Open the breakdown to read each question individually.
                </p>
              ) : (
                traps.map((trap) => (
                  <div key={trap.trap} className="border-t border-rule pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold">{TRAP_LABELS[trap.trap]}</p>
                      <p className="bw-numeric text-xs text-ink-mute">{trap.count}</p>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      {TRAP_COACHING[trap.trap]}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Next step</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {weakest
                  ? `You are weakest on ${weakest.label} at ${weakest.accuracy}% in this check. One drill on that type, with the strategy read first, is worth more than another full paper today.`
                  : "Every question type in this check is at or above the pass mark. Move on to a full mock of the module you have practised least."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {weakest ? (
                  <Link
                    to="/practice"
                    search={{ module: weakest.module, type: weakest.taskType }}
                    className="bg-accent px-4 py-2.5 text-xs font-semibold text-paper hover:bg-accent-ink"
                  >
                    Drill {weakest.label}
                  </Link>
                ) : null}
                <Link
                  to="/review/$attemptId"
                  params={{ attemptId: attempt.id }}
                  className="border border-ink px-4 py-2.5 text-xs font-semibold hover:bg-ink hover:text-paper"
                >
                  Read every answer
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Now sit a full mock</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              A 40 question paper tightens the number and gives the dashboard a proper baseline.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/test/$module"
                params={{ module: "reading" }}
                className="border border-ink px-3 py-2 text-xs font-medium hover:bg-ink hover:text-paper"
              >
                Reading
              </Link>
              <Link
                to="/test/$module"
                params={{ module: "listening" }}
                className="border border-ink px-3 py-2 text-xs font-medium hover:bg-ink hover:text-paper"
              >
                Listening
              </Link>
            </div>
          </div>
          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Set your target</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              The desk compares every result with the band you are aiming at, and shows the distance
              in bands and in correct answers.
            </p>
            <div className="mt-4">
              <Link
                to="/dashboard"
                className="border border-ink px-3 py-2 text-xs font-medium hover:bg-ink hover:text-paper"
              >
                Open the desk
              </Link>
            </div>
          </div>
          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Practice the weak type</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              {DIAGNOSTIC_COPY.questions} of official format practice, sorted by the question type you
              choose.
            </p>
            <div className="mt-4">
              <Link
                to="/practice"
                className="border border-ink px-3 py-2 text-xs font-medium hover:bg-ink hover:text-paper"
              >
                Focused practice
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-12">
          <BandCTA to="/dashboard">Go to the desk</BandCTA>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
