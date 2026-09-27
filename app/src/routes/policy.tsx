import { createFileRoute } from "@tanstack/react-router";

import { CONTENT_FACTS, POLICY } from "../content";
import {
  BandCTA,
  MeasureNote,
  PageHeader,
  Rule,
  SiteFooter,
  SiteNav,
} from "../components/ui";

export const Route = createFileRoute("/policy")({
  component: PolicyRoute,
});

function PolicyRoute() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-[1180px] px-5 py-12">
        <PageHeader
          eyebrow="Content and fairness"
          title={POLICY.headline}
          lede="What is in this app, where it came from, and exactly what its marking does and does not claim."
        />

        <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_0.6fr]">
          <div className="space-y-8">
            {POLICY.points.map((point) => (
              <div key={point.title} className="border-t border-rule pt-6">
                <h2 className="text-lg font-semibold tracking-tight">{point.title}</h2>
                <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-ink-soft">{point.body}</p>
              </div>
            ))}

            <div className="border-t border-rule pt-6">
              <h2 className="text-lg font-semibold tracking-tight">How the recordings work</h2>
              <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-ink-soft">
                Listening recordings are delivered by your browser's own speech engine, reading the
                stored script aloud, with a different voice chosen for each speaker so accents vary
                between mocks. Each part may be played once per attempt, exactly as the real paper
                requires. The transcript is held back until the attempt has been submitted. If your
                browser has no speech engine at all, the recording can be read instead, and the attempt
                is labelled as read rather than heard so a reading based result is never reported as a
                listening score.
              </p>
            </div>

            <div className="border-t border-rule pt-6">
              <h2 className="text-lg font-semibold tracking-tight">How the marking works</h2>
              <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-ink-soft">
                Reading and Listening are marked on the server against stored keys, using the published
                40 mark conversion. Each question also carries the exact evidence that proves the
                answer and a trap classification. Writing is marked against Task Achievement or Task
                Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy,
                read from the response itself. Speaking is marked against the same four families of
                criterion from what you actually said, and pronunciation is reported as a delivery
                based estimate because it cannot be judged from a transcript.
              </p>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">In the pool right now</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                <li className="flex justify-between gap-4">
                  <span>Reading passages in the pool</span>
                  <span className="bw-numeric">{CONTENT_FACTS.reading.poolUnits}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Listening parts in the pool</span>
                  <span className="bw-numeric">{CONTENT_FACTS.listening.poolUnits}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Keyed questions</span>
                  <span className="bw-numeric">{CONTENT_FACTS.keyedQuestions}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Original passage text</span>
                  <span className="bw-numeric">{CONTENT_FACTS.readingWords.toLocaleString()} words</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Original script text</span>
                  <span className="bw-numeric">{CONTENT_FACTS.listeningWords.toLocaleString()} words</span>
                </li>
              </ul>
            </div>

            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Adding to the pool</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                A new reading passage or listening part is a data file: drop the passage, its keyed
                questions and its evidence in beside the others, name it in a mock configuration, and
                every module picks it up with no code change.
              </p>
            </div>

            <Rule />
            <MeasureNote>Every band in this app is an estimate from practice marking.</MeasureNote>
            <BandCTA module="reading">Start a mock</BandCTA>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
