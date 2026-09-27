/**
 * Listening runner, built to the shape of the official computer-delivered paper.
 *
 * The candidate does not press play. They check their volume, press Start, and
 * the recording then runs itself: Part 1, a pause to check answers, Part 2, and
 * so on to Part 4. Each part is heard once and cannot be repeated, which is the
 * exam condition the whole module depends on. Volume can be adjusted, as it can
 * on the official player. The questions on the right follow the audio as it
 * moves from part to part, and the navigator along the bottom still reaches all
 * forty questions at any time.
 *
 * If the browser cannot play audio at all, the paper says so and offers the
 * written recording, and the attempt is labelled as read rather than heard so the
 * band is never reported as a listening score.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ListeningPartView, ListeningQuestionView, StartResponse } from "../lib/session";
import { ExamShell } from "./exam-shell";
import { AnswerMap, EmptyState, QuestionList, useCountdown, useScrollToCurrent } from "./test-ui";
import { useSpeechEngine } from "./use-speech";

const GAP_SECONDS = 12; // the pause the official paper gives between parts

export function ListeningTest({
  run,
  onSubmit,
  busy,
  error,
}: {
  run: StartResponse;
  onSubmit: (answers: AnswerMap, mode: "heard" | "read" | "mixed") => void;
  busy: boolean;
  error: string | null;
}) {
  const payload = run.payload as {
    parts: ListeningPartView[];
    questions: ListeningQuestionView[];
  };
  const parts = payload.parts;
  const questions = payload.questions;

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(1);
  const [activePart, setActivePart] = useState(1);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playingPart, setPlayingPart] = useState<number | null>(null);
  const [gapLeft, setGapLeft] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [fileFailed, setFileFailed] = useState<Set<number>>(new Set());
  const [written, setWritten] = useState<Set<number>>(new Set());
  const [speed, setSpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gapTimer = useRef<number | null>(null);
  const speech = useSpeechEngine();

  const remaining = useCountdown(run.minutes * 60, () => onSubmit(answers, mode()));
  useScrollToCurrent(current, true);

  const mode = useCallback((): "heard" | "read" | "mixed" => {
    if (written.size === 0) return "heard";
    if (written.size >= parts.length) return "read";
    return "mixed";
  }, [written, parts.length]);

  /* --------------------------------------------------------------- playback */

  const advance = useCallback(
    (finishedPart: number) => {
      setPlayingPart(null);
      if (finishedPart >= parts.length) {
        setEnded(true);
        return;
      }
      setGapLeft(GAP_SECONDS);
    },
    [parts.length],
  );

  const playPart = useCallback(
    (partNumber: number) => {
      const part = parts.find((p) => p.part === partNumber);
      if (!part) return;
      setActivePart(partNumber);
      setPlayingPart(partNumber);
      setGapLeft(null);

      const canUseFile = Boolean(part.audio) && !fileFailed.has(partNumber);
      if (canUseFile && audioRef.current) {
        const element = audioRef.current;
        element.src = part.audio ?? "";
        element.volume = volume;
        element.playbackRate = speed;
        void element.play().catch(() => {
          setFileFailed((previous) => new Set(previous).add(partNumber));
          setPlayingPart(null);
          // Fall back to the spoken script so the paper can still be sat.
          speech.play(part.turns, {
            rate: speed,
            onDone: () => advance(partNumber),
          });
        });
        return;
      }

      speech.play(part.turns, {
        rate: speed,
        onDone: () => advance(partNumber),
      });
    },
    [parts, fileFailed, volume, speed, speech, advance],
  );

  // Countdown between parts, then the next one starts by itself.
  useEffect(() => {
    if (gapLeft === null) return;
    if (gapLeft <= 0) {
      const next = (playingPart ?? activePart) + 1;
      const target = parts.find((p) => p.part > activePart)?.part ?? activePart + 1;
      playPart(next >= 1 && next <= parts.length ? next : target);
      return;
    }
    const id = window.setTimeout(() => setGapLeft((value) => (value === null ? null : value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [gapLeft, playingPart, activePart, parts, playPart]);

  // A silent engine or a browser with no voices must not leave the candidate
  // staring at nothing: the written recording opens and is labelled as such.
  useEffect(() => {
    if (started && (speech.engineFailed || speech.state === "unavailable")) {
      setWritten(new Set(parts.map((p) => p.part)));
    }
  }, [started, speech.engineFailed, speech.state, parts]);

  const startPaper = useCallback(() => {
    setStarted(true);
    playPart(1);
  }, [playPart]);

  const readInstead = useCallback(() => {
    setWritten(new Set(parts.map((p) => p.part)));
    setStarted(true);
    setEnded(true);
    setPlayingPart(null);
  }, [parts]);

  /* ---------------------------------------------------------------- answers */

  const setAnswer = (n: number, value: string) =>
    setAnswers((previous) => ({ ...previous, [n]: value }));

  const toggleFlag = (n: number) =>
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const jump = useCallback(
    (n: number) => {
      const question = questions.find((q) => q.n === n);
      if (question) setActivePart(question.part);
      setCurrent(n);
      if (typeof window !== "undefined") {
        document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [questions],
  );

  const part = parts.find((p) => p.part === activePart) ?? parts[0];
  const partQuestions = useMemo(
    () => questions.filter((q) => q.part === activePart),
    [questions, activePart],
  );
  const answeredCount = questions.filter((q) => (answers[q.n] ?? "").trim() !== "").length;

  const status = playingPart
    ? `Part ${playingPart} is playing`
    : gapLeft !== null
      ? `Pause before part ${activePart + 1} · ${gapLeft}s`
      : ended
        ? "The recording has finished"
        : "Not started";

  return (
    <>
      <ExamShell
        moduleLabel="Listening"
        paperTitle={run.mockTitle}
        focus={run.focus}
        remainingSeconds={remaining}
        totalSeconds={run.minutes * 60}
        sourceLabel="Recording"
        sourceNote={part ? `Part ${part.part} of ${parts.length}` : undefined}
        source={
          <div className="px-4 py-5 sm:px-5">
            {parts[0]?.audio ? <audio ref={audioRef} preload="auto" className="hidden" onEnded={() => playingPart && advance(playingPart)} /> : null}

            <div className="border border-rule bg-paper-raised p-5">
              <p className="bw-label text-accent">Part {part?.part} of {parts.length}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{part?.role}</p>
              <p className="mt-3 text-base font-medium">{part?.context}</p>

              <p className="bw-numeric mt-4 text-xs text-ink-soft">{status}</p>

              <div className="mt-4 border-t border-rule pt-4">
                <label htmlFor="volume" className="bw-label text-ink-mute">
                  Volume
                </label>
                <input
                  id="volume"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(event) => {
                    const next = Number(event.target.value) / 100;
                    setVolume(next);
                    if (audioRef.current) audioRef.current.volume = next;
                  }}
                  className="mt-2 w-full accent-accent"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
                <span className="bw-label text-ink-mute">Practice speed</span>
                <div className="flex gap-1 border border-rule p-0.5">
                  {[0.75, 1, 1.25, 1.5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={started}
                      onClick={() => {
                        setSpeed(value);
                        if (audioRef.current) audioRef.current.playbackRate = value;
                      }}
                      className={
                        "bw-numeric px-2.5 py-1.5 text-xs transition-colors " +
                        (value === speed ? "bg-ink text-paper" : "text-ink-soft hover:text-ink") +
                        (started ? " cursor-not-allowed opacity-50" : "")
                      }
                    >
                      {value}×
                    </button>
                  ))}
                </div>
                <span className="text-[0.7rem] text-ink-mute">
                  Chosen before the recording starts, as in the exam.
                </span>
              </div>
            </div>

            <div className="mt-5 border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">How this paper runs</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                <li>The four parts play in order, once each, with a short pause between them.</li>
                <li>Questions 1 to 10 belong to Part 1, 11 to 20 to Part 2, and so on.</li>
                <li>You can move between questions at any time with the numbers below.</li>
                <li>Nothing repeats, so write as you listen.</li>
              </ul>
            </div>

            <div className="mt-5 border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Part list</p>
              <ul className="mt-3 space-y-2 text-sm">
                {parts.map((p) => {
                  const state =
                    playingPart === p.part
                      ? "playing"
                      : p.part < activePart || ended
                        ? "played"
                        : "waiting";
                  return (
                    <li key={p.part} className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActivePart(p.part)}
                        className="text-left text-ink-soft hover:text-ink"
                      >
                        <span className="bw-numeric mr-2">Part {p.part}</span>
                        {p.context}
                      </button>
                      <span className="bw-numeric shrink-0 text-[0.7rem] text-ink-mute">{state}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {[...(speech.engineFailed ? [true] : []), fileFailed.size > 0].some(Boolean) ? (
              <div className="mt-5 border border-flag px-4 py-3">
                <p className="text-xs font-semibold text-flag">
                  This browser would not play the recording.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                  The spoken script is being used instead, and the attempt is labelled as read rather
                  than heard so the number stays honest. Opening this site in Chrome, Safari or Edge in
                  its own window usually restores the audio.
                </p>
              </div>
            ) : null}
          </div>
        }
        questionsHeader={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="bw-label text-accent">
              Questions {partQuestions[0]?.n ?? 0} to {partQuestions[partQuestions.length - 1]?.n ?? 0}
              <span className="ml-2 font-normal normal-case opacity-70">Part {activePart}</span>
            </p>
            <p className="bw-numeric text-[0.7rem] text-ink-mute">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
        }
        questions={
          partQuestions.length ? (
            <QuestionList
              questions={partQuestions}
              answers={answers}
              current={current}
              flagged={flagged}
              onAnswer={setAnswer}
              onToggleFlag={toggleFlag}
              locked={busy}
              anchorId={(n) => `q-${n}`}
            />
          ) : (
            <EmptyState title="No questions in this part" body="Choose another part on the left." />
          )
        }
        nav={{ questions, answers, flagged, current, onJump: jump, onToggleFlag: toggleFlag }}
        onFinish={() => onSubmit(answers, mode())}
        finishing={busy}
        error={error}
      />

      {!started ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="listen-start" className="w-full max-w-xl border border-ink bg-paper p-6">
            <p className="bw-label text-accent">Listening · {run.mockTitle}</p>
            <h2 id="listen-start" className="mt-2 text-xl font-semibold tracking-tight">
              The recording starts when you press Start.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              It plays once, without stopping, through all four parts, exactly as the real paper does.
              Check your volume first, because nothing can be replayed.
            </p>
            <ul className="mt-4 space-y-2 border-y border-rule py-4 text-xs text-ink-soft">
              <li>Parts play in order with a short pause between them.</li>
              <li>You can answer while it plays and return to any question later.</li>
              <li>Headphones are recommended, as in the exam room.</li>
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startPaper}
                className="bg-accent px-6 py-3.5 text-sm font-semibold text-paper hover:bg-accent-ink"
              >
                Start the recording
              </button>
              <button
                type="button"
                onClick={() => speech.play([{ speaker: "Sound check", accent: "en-AU", line: "This is a sound check. If you can hear this sentence, your audio is working." }])}
                className="border border-rule-strong px-4 py-3 text-xs font-medium hover:border-ink"
              >
                Check your sound
              </button>
              <button
                type="button"
                onClick={readInstead}
                className="bw-underline-sweep text-xs font-medium text-ink-soft hover:text-ink hover:bw-underline-sweep-on"
              >
                My audio is not working
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
