import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { MODULES } from "../content";
import { ApiError, api, useSession, type StartResponse } from "../lib/session";
import { ListeningTest } from "../components/listening-test";
import { ReadingTest } from "../components/reading-test";
import { SpeakingTest, type SpeakingResult } from "../components/speaking-test";
import { WritingTest } from "../components/writing-test";
import { SiteFooter, SiteNav } from "../components/ui";
import type { AnswerMap } from "../components/test-ui";

export const Route = createFileRoute("/test/$module")({
  component: TestRoute,
});

function TestRoute() {
  const { module } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [run, setRun] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = MODULES.some((m) => m.id === module);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRun(null);
    try {
      const result = await api<StartResponse>("practice/start", { module });
      setRun(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The mock could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    if (session.loading) return;
    if (!session.user) {
      void navigate({ to: "/account" });
      return;
    }
    if (valid && !run && !busy) void start();
  }, [session.loading, session.user, valid, run, busy, start, navigate, module]);

  const submit = useCallback(
    async (body: Record<string, unknown>) => {
      if (!run) return;
      setBusy(true);
      setError(null);
      try {
        await api("practice/submit", { attemptId: run.attemptId, ...body });
        void navigate({ to: "/review/$attemptId", params: { attemptId: run.attemptId } });
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Your attempt was not saved. Check your connection and submit again.",
        );
        setBusy(false);
      }
    },
    [run, navigate],
  );

  if (!valid) {
    return (
      <Shell>
        <p className="border border-wrong px-4 py-3 text-sm text-wrong">
          There is no module called {module}. Choose Reading, Listening, Speaking or Writing.
        </p>
      </Shell>
    );
  }

  if (loading || (!run && !error)) {
    return (
      <Shell>
        <div className="py-24">
          <p className="bw-label text-ink-mute">Reset test</p>
          <p className="mt-3 text-lg font-medium">Drawing a mock from the pool…</p>
          <div className="mt-6 h-1 w-64 bg-rule">
            <div className="h-full w-1/3 animate-pulse bg-accent" />
          </div>
        </div>
      </Shell>
    );
  }

  if (!run) {
    return (
      <Shell>
        <div className="py-20">
          <p className="border border-wrong px-4 py-3 text-sm text-wrong">
            {error ?? "The mock could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-5 bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-accent"
          >
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div>
      {run.module === "reading" ? (
        <ReadingTest
          run={run}
          busy={busy}
          error={error}
          onSubmit={(answers: AnswerMap) => void submit({ answers })}
        />
      ) : null}

      {run.module === "listening" ? (
        <ListeningTest
          run={run}
          busy={busy}
          error={error}
          onSubmit={(answers: AnswerMap, mode) => void submit({ answers, mode })}
        />
      ) : null}

      {run.module === "writing" ? (
        <WritingTest
          run={run}
          busy={busy}
          error={error}
          onSubmit={(responses) => void submit({ responses })}
        />
      ) : null}

      {run.module === "speaking" ? (
        <SpeakingTest
          run={run}
          busy={busy}
          error={error}
          onSubmit={(results: SpeakingResult[]) => void submit({ speaking: results })}
        />
      ) : null}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5">{children}</main>
      <SiteFooter />
    </div>
  );
}
