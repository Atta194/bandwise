/**
 * Level check runner, on the same exam workspace as the full papers: the
 * passage and the recording share the source pane with a switch between them,
 * the twenty three questions scroll on their own, and the bottom navigator
 * covers every question.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ListeningPartView, ReadingQuestionView, StartResponse } from "../lib/session";
import { ExamShell } from "./exam-shell";
import { AnswerMap, QuestionList, useCountdown, useScrollToCurrent } from "./test-ui";
import { useSpeechEngine } from "./use-speech";

type Passage = {
  index: number;
  title: string;
  standfirst: string;
  paragraphs: string[];
  wordCount: number;
};

type DiagnosticPayload = {
  passages: Passage[];
  reading: ReadingQuestionView[];
  parts: ListeningPartView[];
  listening: ReadingQuestionView[];
};

/** The paper is numbered continuously, so block labels are rebuilt from it. */
function relabel(questions: ReadingQuestionView[], offset: number) {
  const out = questions.map((q) => ({ ...q }));
  let i = 0;
  while (i < out.length) {
    let j = i;
    while (j + 1 < out.length && out[j + 1].instruction === out[i].instruction) j += 1;
    const label =
      j > i ? `Questions ${offset + i + 1} to ${offset + j + 1}` : `Question ${offset + i + 1}`;
    for (let k = i; k <= j; k += 1) out[k].group = label;
    i = j + 1;
  }
  return out;
}

export function DiagnosticTest({
  run,
  onSubmit,
  busy,
  error,
}: {
  run: StartResponse;
  onSubmit: (answers: AnswerMap, mode: "heard" | "read") => void;
  busy: boolean;
  error: string | null;
}) {
  const payload = run.payload as DiagnosticPayload;
  const reading = useMemo(() => relabel(payload.reading, 0), [payload.reading]);
  const listening = useMemo(
    () => relabel(payload.listening, payload.reading.length),
    [payload.listening, payload.reading.length],
  );
  const allQuestions = useMemo(() => [...reading, ...listening], [reading, listening]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(1);
  const [played, setPlayed] = useState(false);
  const [readText, setReadText] = useState(false);
  const [sourceTab, setSourceTab] = useState<"passage" | "recording">("passage");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [filePlaying, setFilePlaying] = useState(false);
  const [fileFailed, setFileFailed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const SPEEDS = [0.75, 1, 1.25, 1.5];

  const speech = useSpeechEngine();
  const part = payload.parts[0];
  const passage = payload.passages[0];

  const remaining = useCountdown(run.minutes * 60, () =>
    onSubmit(answers, readText ? "read" : "heard"),
  );
  useScrollToCurrent(current, false);

  // A silent engine must not leave the candidate with nothing: open the written
  // conversation as soon as the failure is known.
  useEffect(() => {
    if (speech.engineFailed || speech.state === "unavailable") setReadText(true);
  }, [speech.engineFailed, speech.state]);

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
    setCurrent(n);
    if (typeof window !== "undefined") {
      document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // The recorded file is the real thing; the spoken script is the fallback.
  const useFile = Boolean(part?.audio) && !fileFailed;
  const playingNow = speech.speaking || filePlaying;

  const playConversation = useCallback(() => {
    if (!part) return;
    if (playingNow) {
      speech.stop();
      audioRef.current?.pause();
      setFilePlaying(false);
      return;
    }
    setPlayed(true);
    if (useFile && audioRef.current) {
      setFilePlaying(true);
      audioRef.current.playbackRate = speed;
      void audioRef.current.play().catch(() => {
        setFileFailed(true);
        setFilePlaying(false);
        speech.play(part.turns, { rate: speed });
      });
      return;
    }
    speech.play(part.turns, { rate: speed });
  }, [part, playingNow, useFile, speed, speech]);

  return (
    <ExamShell
      moduleLabel="Level check"
      paperTitle={run.mockTitle}
      focus={run.focus}
      note={run.note}
      remainingSeconds={remaining}
      totalSeconds={run.minutes * 60}
      sourceLabel={sourceTab === "passage" ? "Passage" : "Recording"}
      sourceNote={passage ? `${passage.wordCount} words` : undefined}
      source={
        <div>
          <div className="sticky top-0 z-10 flex gap-1 border-b border-rule bg-paper p-2">
            {(["passage", "recording"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSourceTab(tab)}
                className={
                  "px-3 py-2 text-xs font-semibold capitalize transition-colors " +
                  (sourceTab === tab ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                }
              >
                {tab}
              </button>
            ))}
          </div>

          {sourceTab === "passage" && passage ? (
            <div className="bw-prose px-4 py-5 sm:px-5">
              <p className="bw-label text-accent">Reading passage · {passage.wordCount} words</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{passage.title}</h2>
              <p className="mt-1 text-sm text-ink-mute">{passage.standfirst}</p>
              <div className="mt-4">
                {passage.paragraphs.map((paragraph, index) => (
                  <p key={index}>
                    <span className="bw-numeric mr-2 font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {sourceTab === "recording" && part ? (
            <div className="px-4 py-5 sm:px-5">
              <div className="border border-rule bg-paper-raised p-5">
                <p className="bw-label text-accent">Part 1 · Listening</p>
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
                      setFileFailed(true);
                      setFilePlaying(false);
                    }}
                  />
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={playConversation}
                    disabled={played && !playingNow}
                    className={
                      "px-5 py-3 text-sm font-semibold transition-colors " +
                      (played && !playingNow
                        ? "cursor-not-allowed border border-rule text-ink-mute"
                        : "bg-accent text-paper hover:bg-accent-ink")
                    }
                  >
                    {playingNow ? "Stop playback" : played ? "Already played" : "Play the conversation"}
                  </button>
                  {speech.speaking ? (
                    <span className="bw-numeric text-xs text-ink-soft">
                      speaking: {part.turns[Math.max(0, speech.turnIndex)]?.speaker ?? "…"}
                    </span>
                  ) : null}
                  {filePlaying ? (
                    <span className="bw-numeric text-xs text-ink-soft">playing the recording</span>
                  ) : null}
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
                  <span className="text-[0.7rem] text-ink-mute">Natural speed is 1×.</span>
                </div>

                {speech.state === "unavailable" ? (
                  <p className="mt-3 border border-flag px-3 py-2 text-xs leading-relaxed text-flag">
                    This browser has no speech engine, so read the conversation instead. The result is
                    then labelled as read, not heard.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => setReadText((previous) => !previous)}
                  className="bw-underline-sweep mt-4 text-xs font-medium text-ink-soft hover:text-ink hover:bw-underline-sweep-on"
                >
                  {readText ? "Hide the conversation text" : "Read the conversation text instead"}
                </button>
                {readText ? (
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

              <div className="mt-5 border border-rule bg-paper-raised p-5">
                <p className="bw-label text-ink-mute">How this works</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                  <li>Questions 1 to {payload.reading.length} come from the passage.</li>
                  <li>
                    Questions {payload.reading.length + 1} to {allQuestions.length} come from the
                    conversation. Play it once, as the real paper does.
                  </li>
                  <li>Every question is one click away along the bottom of the questions pane.</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      }
      questionsHeader={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="bw-label text-accent">
            Questions 1 to {allQuestions.length}
          </p>
          <p className="bw-numeric text-[0.7rem] text-ink-mute">
            1 to {payload.reading.length}: reading · {payload.reading.length + 1} to{" "}
            {allQuestions.length}: listening
          </p>
        </div>
      }
      questions={
        <QuestionList
          questions={allQuestions}
          answers={answers}
          current={current}
          flagged={flagged}
          onAnswer={setAnswer}
          onToggleFlag={toggleFlag}
          locked={busy}
          anchorId={(n) => `q-${n}`}
        />
      }
      nav={{ questions: allQuestions, answers, flagged, current, onJump: jump, onToggleFlag: toggleFlag }}
      onFinish={() => onSubmit(answers, readText ? "read" : "heard")}
      finishing={busy}
      error={error}
    />
  );
}
