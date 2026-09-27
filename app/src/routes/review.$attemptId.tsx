import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { api, useSession, type AttemptDetail } from "../lib/session";
import { ReviewView } from "../components/review-view";
import { PageHeader, SiteFooter, SiteNav } from "../components/ui";

export const Route = createFileRoute("/review/$attemptId")({
  component: ReviewRoute,
});

function ReviewRoute() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api<AttemptDetail>("practice/get", { attemptId });
      setDetail(result);
    } catch {
      setError("That attempt could not be loaded. It may belong to another account.");
    }
  }, [attemptId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/account" });
      return;
    }
    void load();
  }, [loading, user, navigate, load]);

  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        {error ? (
          <div className="py-16">
            <p className="border border-wrong px-4 py-3 text-sm text-wrong">{error}</p>
            <Link
              to="/dashboard"
              className="mt-5 inline-block border border-ink px-5 py-3 text-sm font-semibold hover:bg-ink hover:text-paper"
            >
              Back to the desk
            </Link>
          </div>
        ) : null}

        {!detail && !error ? (
          <div className="py-24">
            <p className="bw-label text-ink-mute">Marking</p>
            <p className="mt-3 text-lg font-medium">Pulling the breakdown together…</p>
          </div>
        ) : null}

        {detail ? (
          <>
            <PageHeader
              eyebrow="Post-test breakdown"
              title={`${detail.attempt.mockTitle} · ${detail.attempt.module.replace(/^./, (c) => c.toUpperCase())}`}
              lede="Every wrong answer is shown with the evidence that proves the right one and the reason the wrong one was attractive."
            />
            <div className="mt-10">
              <ReviewView detail={detail} />
            </div>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
