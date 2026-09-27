import { createFileRoute, Link } from "@tanstack/react-router";

import { CONTENT_FACTS, MODULES, POLICY, TRAP_LABELS } from "../content";
import { BandDial } from "../components/band-dial";
import {
  BandCTA,
  Eyebrow,
  FramedCTA,
  IconArrow,
  IconChart,
  IconCompass,
  IconTick,
  LinkBeginCTA,
  MeasureNote,
  Plate,
  Rule,
  ScoringLink,
  SiteFooter,
  SiteNav,
  StartMockCTA,
  moduleIcon,
} from "../components/ui";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ENGINE_STEPS = [
  { label: "Reset", detail: "A mock is drawn from the stored set, avoiding the one you just sat." },
  { label: "Load", detail: "That mock's full Reading, Listening, Writing and Speaking dataset loads together." },
  { label: "Time", detail: "A clean attempt starts on a locked countdown, and every answer is recorded as you work." },
  { label: "Mark", detail: "Answer keys for Reading and Listening, the four criteria rubrics for Writing and Speaking." },
  { label: "Explain", detail: "Every error is returned with its evidence and the trap that made the wrong answer attractive." },
  { label: "Recommend", detail: "The result updates the dashboard and the engine names your next practice." },
];

const TRAP_SAMPLE = [
  "word_match",
  "partly_true",
  "reversed_logic",
  "over_inference",
  "number_shift",
  "speaker_attribution",
] as const;

/**
 * One licence-free photograph per module, graded to a single duotone by the
 * Plate component. Sources and licences are recorded in public/assets/CREDITS.md.
 */
const MODULE_PLATES: Record<string, { src: string; alt: string }> = {
  reading: { src: "/assets/reading.jpg", alt: "Reference books in a library reading room" },
  listening: { src: "/assets/listening.jpg", alt: "A pair of over-ear headphones" },
  speaking: { src: "/assets/speaking.jpg", alt: "A condenser microphone" },
  writing: { src: "/assets/desk.jpg", alt: "A study room with a writing desk" },
};

function Landing() {
  return (
    <div>
      <SiteNav />

      {/* 1. Hero: asymmetric split, live dial, top-left lead */}
      <section className="relative border-b border-rule">
        <div className="bw-measure absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 pt-16 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <div className="bw-enter">
            <h1 className="max-w-[16ch] text-4xl font-semibold leading-[0.98] tracking-tighter md:text-6xl">
              Practise under real exam conditions.
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-ink-soft">
              Four modules, ten stored mocks in each, and a marking engine that explains every wrong
              answer instead of only counting it.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <StartMockCTA module="reading">Start a mock</StartMockCTA>
              <ScoringLink to="/" hash="engine">See how scoring works</ScoringLink>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-5">
              <MeasureNote>{CONTENT_FACTS.reading.mocks} Reading mocks · {CONTENT_FACTS.reading.questionsPerMock} questions</MeasureNote>
              <MeasureNote>{CONTENT_FACTS.listening.mocks} Listening mocks · 4 parts each</MeasureNote>
              <MeasureNote>{CONTENT_FACTS.writing.mocks} Writing · {CONTENT_FACTS.speaking.mocks} Speaking mocks</MeasureNote>
            </div>
          </div>

          <div className="bw-enter">
            <BandDial />
          </div>
        </div>
      </section>

      {/* 2. Modules: gapless bento, colour blocked, Swiss grid */}
      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-5">
          <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight md:text-4xl">
            Four modules. One engine underneath.
          </h2>
          <Eyebrow>The four modules</Eyebrow>
        </div>

        <div className="mt-8 grid gap-px border border-rule bg-rule md:grid-cols-2">
          {MODULES.map((module, index) => (
            <div
              key={module.id}
              className={
                "group bg-paper-raised p-6 transition-colors hover:bg-paper-sunk " +
                (index === 0 ? "md:col-span-1" : "")
              }
            >
              <Plate
                src={MODULE_PLATES[module.id].src}
                alt={MODULE_PLATES[module.id].alt}
                className="-mx-6 -mt-6 mb-5 h-28 border-b border-rule"
              />
              <div className="flex items-start justify-between gap-4">
                <span className="text-ink">{moduleIcon(module.id, "h-6 w-6")}</span>
                <span className="bw-numeric text-[0.7rem] text-ink-mute">
                  {String(index + 1).padStart(2, "0")} / 04
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{module.blurb}</p>
              <p className="bw-numeric mt-5 text-xs text-ink-mute">
                {module.minutes} minutes ·{" "}
                {module.id === "reading"
                  ? `${CONTENT_FACTS.reading.mocks} mocks`
                  : module.id === "listening"
                    ? `${CONTENT_FACTS.listening.mocks} mocks`
                    : module.id === "writing"
                      ? `${CONTENT_FACTS.writing.mocks} mocks`
                      : `${CONTENT_FACTS.speaking.mocks} mocks`}
              </p>
              <div className="mt-6">
                <LinkBeginCTA to="/test/$module" params={{ module: module.id }}>
                  Begin {module.title}
                </LinkBeginCTA>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2b. Level check and focused practice, the two routes into the engine */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16">
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-2">
          <div className="bg-paper-raised p-6">
            <p className="bw-label text-accent">Start here</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              Take the level check first
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
              Twenty three questions in twenty minutes, one Reading passage and one Listening
              conversation at official difficulty. You get an indicative band, your CEFR level, and
              the question types already costing you marks.
            </p>
            <div className="mt-5">
              <LinkBeginCTA to="/diagnostic">Take the level check</LinkBeginCTA>
            </div>
          </div>
          <div className="bg-paper-raised p-6">
            <p className="bw-label text-accent">Then work the weakness</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              Drill one question family at a time
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
              Every question type has its own strategy, its own speed tips and its own drill, drawn
              from the same pool and the same answer key as the full mocks.
            </p>
            <div className="mt-5">
              <LinkBeginCTA to="/practice">Open focused practice</LinkBeginCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The engine: vertical rhythm line, centred statement */}
      <section id="engine" className="border-y border-rule bg-paper-raised">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <h2 className="max-w-[26ch] text-3xl font-semibold tracking-tight md:text-4xl">
            Reset to recommendation, in one pass.
          </h2>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-soft">
            All four modules run through the same spine, which is what lets one dashboard know
            everything about your practice.
          </p>

          <ol className="mt-10 border-l border-rule">
            {ENGINE_STEPS.map((step, index) => (
              <li key={step.label} className="relative -ml-px border-l-2 border-transparent pl-8 pb-8 last:pb-0 hover:border-accent">
                <span className="bw-numeric absolute -left-[0.32rem] top-0 bg-paper-raised text-[0.7rem] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-base font-semibold">{step.label}</p>
                <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-ink-soft">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3b. Material switch: one full width graded photograph, the only one on the page */}
      <section className="border-b border-rule">
        <Plate
          src="/assets/reading.jpg"
          alt="Reference books filling the shelves of a reading room"
          className="h-[220px] w-full"
        />
        <div className="mx-auto max-w-[1180px] px-5 py-4">
          <MeasureNote>
            Every attempt is marked, explained and filed. A mock is drawn from the pool, never chosen.
          </MeasureNote>
        </div>
      </section>

      {/* 4. Mistake lab and analytics: off-grid panel stack */}
      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="max-w-[22ch] text-3xl font-semibold tracking-tight md:text-4xl">
              The same mistake twice is a decision.
            </h2>
            <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-ink-soft">
              Every wrong answer is filed by the reason it went wrong, not by the page it came from.
              Review by trap, by task type, or by mock, and the pattern is usually visible within
              three attempts.
            </p>
            <div className="mt-8">
              <FramedCTA to="/mistakes">Open the Mistake Lab</FramedCTA>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ml-0 border border-rule bg-paper-raised p-5 md:ml-8">
              <div className="flex items-center justify-between">
                <p className="bw-label text-ink-mute">Filed error types</p>
                <IconChart className="h-5 w-5 text-ink-mute" />
              </div>
              <ul className="mt-4 divide-y divide-rule">
                {TRAP_SAMPLE.map((trap) => (
                  <li key={trap} className="flex items-start justify-between gap-4 py-2.5">
                    <span className="text-sm text-ink-soft">{TRAP_LABELS[trap]}</span>
                    <span className="bw-numeric shrink-0 text-[0.7rem] text-ink-mute">
                      {trap.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mr-0 border border-rule bg-paper-raised p-5 md:mr-8">
              <div className="flex items-center justify-between">
                <p className="bw-label text-ink-mute">What every attempt feeds</p>
                <IconCompass className="h-5 w-5 text-ink-mute" />
              </div>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                {[
                  "Section score and estimated band, per attempt",
                  "Error pattern over time, by trap and task type",
                  "Time per question against the locked timer",
                  "The recommended next mock or focus area",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <IconTick className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Content and fairness: editorial offset over hairlines */}
      <section className="border-y border-rule bg-paper-raised">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_1fr]">
            <div>
              <p className="bw-numeric text-[6rem] font-semibold leading-none text-rule-strong">9</p>
              <p className="bw-label mt-2 text-ink-mute">The top band</p>
            </div>
            <div>
              <h2 className="max-w-[28ch] text-3xl font-semibold tracking-tight md:text-4xl">
                {POLICY.headline}
              </h2>
              <div className="mt-8 space-y-6">
                {POLICY.points.slice(0, 3).map((point) => (
                  <div key={point.title} className="border-t border-rule pt-5">
                    <p className="text-base font-semibold">{point.title}</p>
                    <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
                      {point.body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/policy"
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent bw-underline-sweep hover:bw-underline-sweep-on"
                >
                  Read the full content and fairness policy
                  <IconArrow className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing: poster-stacked, band CTA */}
      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="max-w-[20ch] text-3xl font-semibold tracking-tight md:text-4xl">
              Ten mocks, four modules, one honest number.
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-ink-soft">
              One source for all four modules. Create an account and the first mock takes an hour at
              most, and you will know exactly which question types cost you marks, and why.
            </p>
          </div>
          <div className="space-y-5 lg:pt-2">
            <Rule />
            <MeasureNote>
              {CONTENT_FACTS.keyedQuestions} keyed questions in the pool ·{" "}
              {(CONTENT_FACTS.readingWords + CONTENT_FACTS.listeningWords).toLocaleString()} words of
              original passage and script text
            </MeasureNote>
            <BandCTA to="/account">Create your free account</BandCTA>
            <p className="text-xs leading-relaxed text-ink-mute">
              Every band shown in this app is an estimate from practice marking. It is not an official
              IELTS score, and Ready Band Pro is not affiliated with IELTS, the British Council, IDP or
              Cambridge University Press and Assessment.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
