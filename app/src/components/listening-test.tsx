/**
 * Listening runner.
 *
 * The recording sits in the source pane with its own part selector and its own
 * scroll, the questions for the current part sit in the question pane, and the
 * bottom navigator covers all forty questions so nothing is out of reach. Each
 * part may be played once, as the real paper requires, and the transcript is
 * only offered as a labelled fallback for a browser with no speech engine.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ListeningPartView, ListeningQuestionView, StartResponse } from "../lib/session";
import { ExamShell } from "./exam-shell";
import { AnswerMap, EmptyState, QuestionList, useCountdown, useScrollToCurrent } from "./test-ui";
import { useSpeechEngine } from "./use-speech";

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
  const questions = payload.questions;
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(1);
  const [activePart, setActivePart] = useState(1);
  const [played, setPlayed] = useState<Set<number>>(new Set());
  const [readMode, setReadMode] = useState<Set<number>>(new Set());

  // A recorded file is the real thing; the browser's speech engine is only the
  // fallback for a part that has no recording, or whose recording will not load.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [filePlaying, setFilePlaying] = useState(false);
  const [fileFailed, setFileFailed] = useState<Set<number>>(new Set());
  // Practice speed. The real paper plays at natural speed, so 1x is the default
  // and the control is labelled as a practice aid rather than a feature of the test.
  const [speed, setSpeed] = useState(1);
  const SPEEDS = [0.75, 1, 1.25, 1.5];

  const speech = useSpeechEngine();
  const remaining = useCountdown(run.minutes * 60, () => onSubmit(answers, mode()));
  useScrollToCurrent(current, true);

  // If the engine cannot actually speak, open the written recording straight
  // away instead of leaving the candidate staring at a silent play button.
  useEffect(() => {
    if (speech.engineFailed || speech.state === "unavailable") {
      setReadMode((previous) => {
        if (previous.size) return previous;
        return new Set(payload.parts.map((p) => p.part));
      });
    }
  }, [speech.engineFailed, speech.state, payload.parts]);

  const mode = useCallback((): "heard" | "read" | "mixed" => {
    if (readMode.size === 0) return "heard";
    if (readMode.size >= payload.parts.length) return "read";
    return "mixed";
  }, [readMode, payload.parts.length]);

  const setAnswer = (n: number, value: string) =>
    setAnswers((previous) => ({ ...previous, [n]: value }));

  const toggleFlag = (n: number) =>
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const jump = useCallback((n: number) => {
    const question = questions.find((q) => q.n === n);
    if (question) setActivePart(question.part);
    setCurrent(n);
    if (typeof window !== "undefined") {
      document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [questions]);

  const part = payload.parts.find((p) => p.part === activePart) ?? payload.parts[0];
  const partQuestions = useMemo(
    () => questions.filter((q) => q.part === activePart),
    [questions, activePart],
  );
  const answeredCount = questions.filter((q) => (answers[q.n] ?? "").trim() !== "").length;
  const hasPlayed = part ? played.has(part.part) : false;
  const hasRead = part ? readMode.has(part.part) : false;
  const useFile = Boolean(part?.audio) && part ? !fileFailed.has(part.part) : false;
  const playingNow = speech.speaking || filePlaying;

  const playActivePart = useCallback(() => {
    if (!part) return;
    if (playingNow) {
      speech.stop();
      audioRef.current?.pause();
      setFilePlaying(false);
      return;
    }
    setPlayed((previous) => new Set(previous).add(part.part));
    if (useFile && audioRef.current) {
      setFilePlaying(true);
      audioRef.current.playbackRate = speed;
      void audioRef.current.play().catch(() => {
        // No recording file after all: fall straight back to the spoken script.
        setFileFailed((previous) => new Set(previous).add(part.part));
        setFilePlaying(false);
        speech.play(part.turns, { rate: speed });
      });
      return;
    }
    speech.play(part.turns, { rate: speed });
  }, [part, playingNow, useFile, speed, speech]);

  return (
    <ExamShell
      moduleLabel="Listening"
      paperTitle={run.mockTitle}
      focus={run.focus}
      remainingSeconds={remaining}
      totalSeconds={run.minutes * 60}
      sourceLabel="Recording"
      sourceNote={part ? `Part ${part.part} of ${payload.parts.length}` : undefined}
      source={
        part ? (
          <div className="px-4 py-5 sm:px-5">
            <div className="flex flex-wrap gap-1.5">
              {payload.parts.map((p) => (
                <button
                  key={p.part}
                  type="button"
                  onClick={() => {
                    setActivePart(p.part);
                    speech.stop();
                  }}
                  className={
                    "border px-3 py-2 text-xs font-medium transition-colors " +
                    (p.part === activePart
                      ? "border-ink bg-ink text-paper"
                      : "border-rule-strong text-ink-soft hover:border-ink")
                  }
                >
                  <span className="bw-numeric mr-1.5">Part {p.part}</span>
                  {p.part === activePart ? "open" : played.has(p.part) ? "played" : "not played"}
                </button>
              ))}
            </div>

            <div className="mt-5 border border-rule bg-paper-raised p-5">
              <p className="bw-label text-accent">Part {part.part}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{part.role}</p>
              <p className="mt-3 text-base font-medium">{part.context}</p>

              {part.audio ? (
                <audio
                  ref={audioRef}
                  src={part.audio}
                  preload="none"
                  className="hidden"
                  onEnded={() => setFilePlaying(false)}
                  onError={() => {
                    setFileFailed((previous) => new Set(previous).add(part.part));
                    setFilePlaying(false);
                  }}
                />
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={playActivePart}
                  disabled={hasPlayed && !playingNow}
                  className={
                    "px-5 py-3 text-sm font-semibold transition-colors " +
                    (hasPlayed && !playingNow
                      ? "cursor-not-allowed border border-rule text-ink-mute"
                      : "bg-accent text-paper hover:bg-accent-ink")
                  }
                >
                  {playingNow ? "Stop playback" : hasPlayed ? "Already played" : `Play part ${part.part}`}
                </button>
                {speech.speaking ? (
                  <span className="bw-numeric text-xs text-ink-soft">
                    speaking: {part.turns[Math.max(0, speech.turnIndex)]?.speaker ?? "…"} ·{" "}
                    {speech.progress}%
                  </span>
                ) : null}
                {filePlaying ? (
                  <span className="bw-numeric text-xs text-ink-soft">playing the recording</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (speech.speaking) {
                      speech.stop();
                      return;
                    }
                    speech.play(
                      [
                        {
                          speaker: "Sound check",
                          accent: "en-AU",
                          line: "This is a sound check for the listening test. If you can hear this sentence, your audio is working.",
                        },
                      ],
                      { rate: speed },
                    );
                  }}
                  className="bw-underline-sweep text-xs font-medium text-ink-soft hover:text-ink hover:bw-underline-sweep-on"
                >
                  Check your sound
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-3">
                <span className="bw-label text-ink-mute">Practice speed</span>
                <div className="flex gap-1 border border-rule p-0.5">
                  {SPEEDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSpeed(value);
                        if (audioRef.current) audioRef.current.playbackRate = value;
                      }}
                      className={
                        "bw-numeric px-2.5 py-1.5 text-xs transition-colors " +
                        (value === speed ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                      }
                    >
                      {value}×
                    </button>
                  ))}
                </div>
                <span className="text-[0.7rem] text-ink-mute">
                  A practice aid. The real paper plays at natural speed.
                </span>
              </div>

              {speech.engineFailed ? (
                <div className="mt-4 border border-wrong px-4 py-3">
                  <p className="text-xs font-semibold text-wrong">
                    This browser did not play the recording.
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                    Some browsers have no speech voices installed, and some block them inside an
                    embedded frame. The written recording for each part is now open below, so you can
                    still sit the paper. Opening this site in Chrome, Safari or Edge in its own window
                    usually restores the audio.
                  </p>
                </div>
              ) : null}

              {hasPlayed && !playingNow ? (
                <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                  This part has been played once. Under exam conditions a recording is never repeated,
                  so work from your notes.
                </p>
              ) : null}

              {speech.state === "unavailable" ? (
                <div className="mt-4 border border-flag px-4 py-3">
                  <p className="text-xs font-semibold text-flag">
                    This browser has no speech engine, so playback is not possible.
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                    You can read the recording instead. The attempt is then labelled as read, not heard,
                    so the number stays honest.
                  </p>
                </div>
              ) : null}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setReadMode((previous) => {
                      const next = new Set(previous);
                      if (next.has(part.part)) next.delete(part.part);
                      else next.add(part.part);
                      return next;
                    })
                  }
                  className="bw-underline-sweep text-xs font-medium text-ink-soft hover:text-ink hover:bw-underline-sweep-on"
                >
                  {hasRead ? "Hide the recording text" : "Read the recording text instead"}
                </button>
                {hasRead ? (
                  <div className="mt-3 border border-rule bg-paper p-4">
                    {part.turns.map((turn, index) => (
                      <p key={index} className="mb-2 text-[0.8rem] leading-relaxed text-ink-soft">
                        <span className="bw-label mr-2 text-ink-mute">{turn.speaker}</span>
                        {turn.line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 border border-rule bg-paper-raised p-5">
              <p className="bw-label text-ink-mute">Before you press play</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                <li>Read the questions for this part first, then play the recording once.</li>
                <li>Write numbers down as you hear them, and cross out figures that are corrected.</li>
                <li>Check the word limit printed in each instruction line.</li>
              </ul>
            </div>
          </div>
        ) : null
      }
      questionsHeader={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="bw-label text-accent">
            Questions {partQuestions[0]?.n ?? 0} to {partQuestions[partQuestions.length - 1]?.n ?? 0}
          </p>
          <p className="bw-numeric text-[0.7rem] text-ink-mute">
            {answeredCount} of {questions.length} answered · part {activePart} of {payload.parts.length}
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
          <EmptyState
            title="No questions in this part"
            body="Choose another part from the panel on the left."
          />
        )
      }
      nav={{ questions, answers, flagged, current, onJump: jump, onToggleFlag: toggleFlag }}
      onFinish={() => onSubmit(answers, mode())}
      finishing={busy}
      error={error}
    />
  );
}
