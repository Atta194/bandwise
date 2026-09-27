import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { CONTENT_FACTS, MODULES } from "../content";
import { api, useSession, type AnalyticsResponse, type AttemptSummary } from "../lib/session";
import { BandSeries } from "../components/charts";
import {
  CefrPanel,
  PriorityList,
  ProgressMeter,
  RecommendationCTA,
  TargetSetter,
  TipList,
} from "../components/progress";
import { EmptyState } from "../components/test-ui";
import { WelcomeModal } from "../components/welcome-modal";
import {
  LinkBeginCTA,
  MODULE_LABELS,
  MeasureNote,
  PageHeader,
  SiteFooter,
  SiteNav,
  formatBand,
  formatDate,
  formatDuration,
  moduleIcon,
} from "../components/ui";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

type Recommendation = { headline: string; body: string; actionLabel: string; actionHref: string };

function DashboardRoute() {
  const navigate = useNavigate();
  const { user, loading, setProfile } = useSession();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [ready, setReady] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const load = useCallback(async () => {
    const [list, stats, advice] = await Promise.all([
      api<{ attempts: AttemptSummary[] }>("practice/list"),
      api<AnalyticsResponse>("analytics/get"),
      api<{ recommendation: Recommendation }>("recommend/get"),
    ]);
    setAttempts(list.attempts);
    setAnalytics(stats);
    setRecommendation(advice.recommendation);
    setReady(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/account" });
      return;
    }
    void load().catch(() => setReady(true));
  }, [loading, user, navigate, load]);

  // The welcome prompt is offered once per account, and the dismissal is kept
  // on the account so it does not follow the candidate to another browser.
  useEffect(() => {
    if (!user) return;
    setShowWelcome(!user.onboarded && !loading);
  }, [user, loading]);

  const dismissWelcome = useCallback(async () => {
    setShowWelcome(false);
    try {
      await setProfile({ onboarded: true });
    } catch {
      /* the prompt simply returns next visit */
    }
  }, [setProfile]);

  const chooseTarget = useCallback(
    async (band: number | null) => {
      setSavingTarget(true);
      try {
        await setProfile({ targetBand: band });
        await load();
      } catch {
        /* the target is unchanged */
      } finally {
        setSavingTarget(false);
      }
    },
    [setProfile, load],
  );

  if (!user) {
    return (
      <div>
        <SiteNav />
        <main className="mx-auto max-w-[1180px] px-5 py-20">
          <p className="text-sm text-ink-soft">Checking your session…</p>
        </main>
      </div>
    );
  }

  const obtained = analytics?.obtained ?? 0;
  const target = analytics?.targetBand ?? null;
  const reading = analytics?.modules.find((m) => m.module === "reading");
  const areas = analytics?.areas ?? [];

  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        <PageHeader
          eyebrow="The desk"
          title={`Welcome back, ${user.name.split(" ")[0]}.`}
          lede="Obtained score, target score, the errors behind both, and the question types to practise next. Every figure here comes from an attempt that was actually marked."
        />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-rule bg-paper-raised p-6">
            <ProgressMeter obtained={obtained} target={target} progress={analytics?.progress ?? null} />
          </div>
          <div className="space-y-6">
            {obtained > 0 ? (
              <CefrPanel band={obtained} />
            ) : (
              <div className="border border-rule bg-paper-raised p-5">
                <p className="bw-label text-ink-mute">CEFR level</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Your CEFR level appears here as soon as one module has been marked. The level check
                  is the fastest way to get it.
                </p>
                <div className="mt-4">
                  <Link
                    to="/diagnostic"
                    className="inline-block bg-accent px-4 py-2.5 text-xs font-semibold text-paper hover:bg-accent-ink"
                  >
                    Take the level check
                  </Link>
                </div>
              </div>
            )}

            <div className="border border-rule bg-paper-raised p-5">
              <TargetSetter value={target} onChange={(band) => void chooseTarget(band)} busy={savingTarget} />
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-3">
              <h2 className="text-xl font-semibold tracking-tight">Areas that need more practice</h2>
              <Link to="/analytics" className="text-xs font-medium text-accent hover:underline">
                Full analytics
              </Link>
            </div>
            <div className="mt-4">
              <PriorityList areas={areas} limit={5} />
            </div>
            <div className="mt-6">
              <LinkBeginCTA to="/practice">Open focused practice</LinkBeginCTA>
            </div>
          </div>

          <div>
            <div className="border-b border-rule pb-3">
              <h2 className="text-xl font-semibold tracking-tight">Tips to improve</h2>
              <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
                Each tip comes from a trap that has actually taken marks from you, most expensive first.
              </p>
            </div>
            <div className="mt-4">
              <TipList traps={analytics?.traps ?? []} limit={4} />
            </div>
            <div className="mt-6">
              <LinkBeginCTA to="/mistakes">Open the mistake lab</LinkBeginCTA>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="border-b border-rule pb-3">
            <h2 className="text-xl font-semibold tracking-tight">Reset test</h2>
            <p className="mt-2 max-w-[80ch] text-sm leading-relaxed text-ink-soft">
              A mock is drawn from the stored set, avoiding the one you just sat. Reading and
              Listening run on a locked timer; Writing and Speaking are marked against the four
              official criteria.
            </p>
          </div>

          <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
            {MODULES.map((module) => {
              const summary = analytics?.modules.find((m) => m.module === module.id);
              return (
                <div key={module.id} className="bg-paper-raised p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-ink">{moduleIcon(module.id, "h-5 w-5")}</span>
                    <span className="bw-numeric text-[0.7rem] text-ink-mute">
                      {summary?.attempts ? `${summary.attempts} attempts` : "not started"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{module.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{module.blurb}</p>
                  <p className="bw-numeric mt-3 text-xs text-ink-mute">
                    best {summary?.attempts ? formatBand(summary.best) : "…"} · latest{" "}
                    {summary?.attempts ? formatBand(summary.latest) : "…"}
                  </p>
                  <div className="mt-4">
                    <LinkBeginCTA to="/test/$module" params={{ module: module.id }}>
                      Begin {module.title}
                    </LinkBeginCTA>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-rule bg-paper-raised p-5">
            <div>
              <p className="text-sm font-semibold">
                {analytics?.diagnostic ? "Level check complete" : "Not measured yet"}
              </p>
              <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-ink-soft">
                {analytics?.diagnostic
                  ? "You can retake the level check at any time; it is the same fixed paper, so two results are directly comparable."
                  : "Twenty minutes, twenty three questions, and the engine knows which question types to aim at before you sit a full paper."}
              </p>
            </div>
            <Link
              to="/diagnostic"
              className="border border-ink px-4 py-2.5 text-xs font-semibold hover:bg-ink hover:text-paper"
            >
              {analytics?.diagnostic ? "Retake the level check" : "Take the level check"}
            </Link>
          </div>
        </section>

        {recommendation ? (
          <section className="mt-12 border border-rule bg-paper-raised p-6">
            <p className="bw-label text-accent">Recommended next</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{recommendation.headline}</h2>
            <p className="mt-3 max-w-[80ch] text-sm leading-relaxed text-ink-soft">
              {recommendation.body}
            </p>
            <RecommendationCTA recommendation={recommendation} />
          </section>
        ) : null}

        {analytics && analytics.totals.attempts > 0 ? (
          <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Reading band over time</p>
              {reading ? (
                <BandSeries series={reading.series} label="Reading" target={analytics.targetBand} />
              ) : null}
            </div>
            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">What the engine has measured</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-ink-mute">Attempts marked</dt>
                  <dd className="bw-numeric mt-1 text-2xl font-semibold">{analytics.totals.attempts}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-mute">Minutes under the timer</dt>
                  <dd className="bw-numeric mt-1 text-2xl font-semibold">{analytics.totals.minutes}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-mute">Questions answered</dt>
                  <dd className="bw-numeric mt-1 text-2xl font-semibold">
                    {analytics.totals.questionsAnswered}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-mute">Marks lost</dt>
                  <dd className="bw-numeric mt-1 text-2xl font-semibold text-wrong">
                    {analytics.totals.mistakes}
                  </dd>
                </div>
              </dl>
              <MeasureNote>
                {CONTENT_FACTS.keyedQuestions} keyed questions in the pool · {CONTENT_FACTS.reading.mocks}{" "}
                Reading and {CONTENT_FACTS.listening.mocks} Listening mocks
              </MeasureNote>
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent attempts</h2>
            <Link to="/analytics" className="text-sm font-medium text-accent hover:underline">
              Full analytics
            </Link>
          </div>

          {ready && attempts.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nothing marked yet"
                body="Take the level check to get a first number and a list of question types to work on, or go straight into a full mock."
              />
            </div>
          ) : (
            <div className="mt-2 divide-y divide-rule">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  to="/review/$attemptId"
                  params={{ attemptId: attempt.id }}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:bg-paper-raised"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-ink">{moduleIcon(attempt.module, "h-5 w-5")}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.kind === "diagnostic" ? "Level check" : MODULE_LABELS[attempt.module]} ·{" "}
                        {attempt.mockTitle}
                      </p>
                      <MeasureNote>
                        {formatDate(attempt.finishedAt)} · {formatDuration(attempt.durationSec)}
                        {attempt.kind === "drill" ? " · drill" : ""}
                      </MeasureNote>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="bw-numeric text-xs text-ink-soft">
                      {attempt.total ? `${attempt.rawScore ?? 0} / ${attempt.total}` : `${attempt.rawScore ?? 0} words`}
                    </span>
                    <span className="bw-numeric text-base font-semibold">{formatBand(attempt.band)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />

      <WelcomeModal open={showWelcome} onClose={() => void dismissWelcome()} name={user.name} />
    </div>
  );
}
