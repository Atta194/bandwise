/**
 * Speaking runner.
 *
 * Flow: every question is spoken twice before recording begins, Part 1 and
 * Part 3 allow up to one minute per answer, and Part 2 gives one minute of
 * preparation followed by up to two minutes of speech. Answers are recorded with
 * the browser's own recorder and can be played back. Where the browser can also
 * return a transcript, it is sent with the answer so the rubric engine can mark
 * vocabulary and grammar rather than only delivery; where it cannot, the
 * criteria say so instead of inventing a judgement.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { StartResponse } from "../lib/session";
import { EmptyState } from "./test-ui";
import { IconMic } from "./ui";

type Part1Set = { topic: string; questions: string[] };
type CueCard = { topic: string; bullets: string[]; closing: string };
type Part3Set = { topic: string; questions: string[] };

type Item = {
  part: 1 | 2 | 3;
  question: string;
  topic: string;
  kind: "question" | "cue";
  prepareSeconds: number;
  maxSeconds: number;
};

type Phase = "ready" | "prompt" | "prep" | "recording" | "recorded" | "finished";

export type SpeakingResult = {
  part: number;
  question: string;
  seconds: number;
  transcript: string | null;
};

export function SpeakingTest({
  run,
  onSubmit,
  busy,
  error,
}: {
  run: StartResponse;
  onSubmit: (results: SpeakingResult[]) => void;
  busy: boolean;
  error: string | null;
}) {
  const payload = run.payload as { part1: Part1Set[]; part2: CueCard; part3: Part3Set[] };

  const items = useMemo<Item[]>(() => {
    const built: Item[] = [];
    for (const set of payload.part1) {
      for (const question of set.questions) {
        built.push({
          part: 1,
          question,
          topic: set.topic,
          kind: "question",
          prepareSeconds: 0,
          maxSeconds: 60,
        });
      }
    }
    built.push({
      part: 2,
      question: payload.part2.topic,
      topic: "Long turn",
      kind: "cue",
      prepareSeconds: 60,
      maxSeconds: 120,
    });
    for (const set of payload.part3) {
      for (const question of set.questions) {
        built.push({
          part: 3,
          question,
          topic: set.topic,
          kind: "question",
          prepareSeconds: 0,
          maxSeconds: 60,
        });
      }
    }
    return built;
  }, [payload]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<SpeakingResult[]>([]);
  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcriptSupported, setTranscriptSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const recognition = useRef<{ stop: () => void; start: () => void } | null>(null);
  const tick = useRef<number | null>(null);
  const startedAt = useRef<number>(0);
  const cancelled = useRef(false);

  const item = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    setTranscriptSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (tick.current) window.clearInterval(tick.current);
      recorder.current?.state === "recording" && recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakTwice = useCallback((line: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone();
      return;
    }
    cancelled.current = false;
    window.speechSynthesis.cancel();
    const first = new SpeechSynthesisUtterance(line);
    first.lang = "en-GB";
    first.rate = 0.95;
    first.onend = () => {
      if (cancelled.current) return;
      const second = new SpeechSynthesisUtterance(line);
      second.lang = "en-GB";
      second.rate = 0.95;
      second.onend = () => {
        if (!cancelled.current) onDone();
      };
      second.onerror = () => {
        if (!cancelled.current) onDone();
      };
      window.speechSynthesis.speak(second);
    };
    first.onerror = () => {
      const second = new SpeechSynthesisUtterance(line);
      second.onend = () => onDone();
      second.onerror = () => onDone();
      window.speechSynthesis.speak(second);
    };
    window.speechSynthesis.speak(first);
  }, []);

  const stopRecording = useCallback(() => {
    if (tick.current) {
      window.clearInterval(tick.current);
      tick.current = null;
    }
    recognition.current?.stop();
    recognition.current = null;
    const active = recorder.current;
    if (active && active.state !== "inactive") active.stop();
  }, []);

  const beginRecording = useCallback(async () => {
    setMicError(null);
    setTranscript("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      const active = new MediaRecorder(media);
      recorder.current = active;

      active.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      active.onstop = () => {
        const blob = new Blob(chunks.current, { type: active.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setLastAudio(url);
        const seconds = (Date.now() - startedAt.current) / 1000;
        media.getTracks().forEach((track) => track.stop());
        stream.current = null;
        setResults((previous) => {
          const next = previous.filter((r) => r.question !== item.question);
          next.push({
            part: item.part,
            question: item.question,
            seconds: Math.round(seconds * 10) / 10,
            transcript: transcriptRef.current.trim() ? transcriptRef.current.trim() : null,
          });
          return next;
        });
        setPhase("recorded");
      };

      const w = window as unknown as {
        SpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
        };
        webkitSpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
        };
      };
      const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (Recognition) {
        const recognitionInstance = new Recognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "en-GB";
        recognitionInstance.onresult = (event) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            text += `${event.results[i][0].transcript} `;
          }
          transcriptRef.current = `${transcriptRef.current} ${text}`.trim();
          setTranscript(transcriptRef.current);
        };
        recognitionInstance.onerror = () => undefined;
        recognitionInstance.start();
        recognition.current = recognitionInstance;
      }

      startedAt.current = Date.now();
      setElapsed(0);
      active.start();
      setPhase("recording");
      tick.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(seconds);
        if (seconds >= item.maxSeconds) stopRecording();
      }, 250);
    } catch {
      setMicError(
        "The microphone is not available. Check that this site has microphone permission, then try again. You can still move on and submit the answers you have recorded.",
      );
      setPhase("ready");
    }
  }, [item.maxSeconds, item.part, item.question, stopRecording]);

  const transcriptRef = useRef("");

  const goToNext = useCallback(
    (collected: SpeakingResult[]) => {
      if (index + 1 >= items.length) {
        setPhase("finished");
        onSubmit(collected);
        return;
      }
      setIndex((previous) => previous + 1);
      setElapsed(0);
      setLastAudio(null);
      transcriptRef.current = "";
      setTranscript("");
      setPhase("ready");
    },
    [index, items.length, onSubmit],
  );

  const startQuestion = () => {
    setPhase("prompt");
    speakTwice(item.question, () => {
      if (cancelled.current) return;
      if (item.prepareSeconds > 0) {
        setPhase("prep");
        setElapsed(0);
        tick.current = window.setInterval(() => {
          const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
          setElapsed(seconds);
          if (seconds >= item.prepareSeconds) {
            if (tick.current) window.clearInterval(tick.current);
            tick.current = null;
            void beginRecording();
          }
        }, 250);
        startedAt.current = Date.now();
      } else {
        void beginRecording();
      }
    });
  };

  const progress = `Question ${index + 1} of ${items.length}`;

  if (phase === "finished" || busy) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-24 text-center">
        <p className="bw-label text-ink-mute">{busy ? "Marking" : "Submitted"}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {busy ? "Your answers are being marked against the four criteria." : "Speaking attempt sent"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {busy
            ? "The rubric engine is reading each answer for fluency, lexical range and grammatical range, and reporting pronunciation as a delivery based estimate."
            : "Your result is ready in the review."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="bw-label text-ink-mute">
            Speaking · {run.mockTitle} · Part {item.part}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Answer aloud. The examiner hears each question twice first.
          </h1>
        </div>
        <p className="bw-numeric text-sm text-ink-soft">{progress}</p>
      </div>

      {error ? (
        <p className="mt-6 border border-wrong px-4 py-3 text-sm text-wrong">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="border border-rule bg-paper-raised p-6">
          {item.kind === "cue" ? (
            <div>
              <p className="bw-label text-accent">Part 2 · cue card</p>
              <p className="mt-3 text-lg font-medium">{payload.part2.topic}</p>
              <p className="mt-4 text-sm text-ink-mute">You should say:</p>
              <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                {payload.part2.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="bw-numeric text-ink-mute" aria-hidden="true">
                      ·
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-soft">{payload.part2.closing}</p>
            </div>
          ) : (
            <div>
              <p className="bw-label text-accent">
                Part {item.part} · {item.topic}
              </p>
              <p className="mt-3 text-lg font-medium">{item.question}</p>
            </div>
          )}

          <div className="mt-6 border-t border-rule pt-6">
            {phase === "ready" ? (
              <button
                type="button"
                onClick={startQuestion}
                className="inline-flex items-center gap-3 bg-accent px-6 py-3.5 text-sm font-semibold text-paper hover:bg-accent-ink"
              >
                <IconMic className="h-4 w-4" />
                {item.kind === "cue" ? "Start preparation" : "Hear the question, then answer"}
              </button>
            ) : null}

            {phase === "prompt" ? (
              <p className="bw-numeric text-sm text-ink-soft">
                The question is being read aloud, twice. Recording starts by itself afterwards.
              </p>
            ) : null}

            {phase === "prep" ? (
              <div>
                <p className="bw-numeric text-3xl font-semibold">
                  {Math.max(0, item.prepareSeconds - elapsed)}s
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Preparation time. You may make notes. Recording starts automatically at zero.
                </p>
              </div>
            ) : null}

            {phase === "recording" ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-block h-2.5 w-2.5 animate-pulse bg-wrong" aria-hidden="true" />
                  <span className="bw-numeric text-3xl font-semibold">
                    {Math.max(0, item.maxSeconds - elapsed)}s
                  </span>
                  <span className="bw-label text-ink-mute">remaining</span>
                </div>
                <div className="mt-4 h-1 w-full bg-rule">
                  <div
                    className="h-full bg-wrong transition-[width] duration-200"
                    style={{ width: `${Math.min(100, (elapsed / item.maxSeconds) * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="mt-5 border border-ink px-5 py-3 text-sm font-semibold hover:bg-ink hover:text-paper"
                >
                  Stop and finish this answer
                </button>
                <p className="mt-3 text-xs text-ink-mute">
                  {transcriptSupported
                    ? "A transcript is being taken so vocabulary and grammar can be marked as well as delivery."
                    : "This browser cannot transcribe speech, so only delivery will be measured for this answer."}
                </p>
              </div>
            ) : null}

            {phase === "recorded" ? (
              <div>
                <p className="text-sm font-medium">Answer recorded.</p>
                {lastAudio ? (
                  <audio controls src={lastAudio} className="mt-3 w-full">
                    <track kind="captions" />
                  </audio>
                ) : null}
                {transcript ? (
                  <p className="mt-3 border border-rule bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
                    {transcript}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => goToNext(results)}
                  className="mt-5 bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-accent"
                >
                  {index + 1 >= items.length ? "Finish and mark" : "Next question"}
                </button>
              </div>
            ) : null}

            {micError ? (
              <div className="mt-4 border border-wrong px-4 py-3">
                <p className="text-xs leading-relaxed text-wrong">{micError}</p>
                <button
                  type="button"
                  onClick={() => goToNext(results)}
                  className="mt-3 border border-ink px-4 py-2 text-xs font-medium hover:bg-ink hover:text-paper"
                >
                  Skip to the next question
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Part timing</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft">
              <li>Part 1: up to 1 minute per answer.</li>
              <li>Part 2: 1 minute to prepare, then up to 2 minutes.</li>
              <li>Part 3: up to 1 minute per answer.</li>
            </ul>
          </div>

          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Answers recorded</p>
            <p className="bw-numeric mt-2 text-2xl font-semibold">{results.length}</p>
            <ul className="mt-3 space-y-2 text-xs text-ink-soft">
              {results.slice(-4).map((result) => (
                <li key={result.question} className="flex justify-between gap-3">
                  <span className="truncate">P{result.part} · {result.question.slice(0, 28)}</span>
                  <span className="bw-numeric shrink-0">{Math.round(result.seconds)}s</span>
                </li>
              ))}
            </ul>
            {results.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                Nothing recorded yet. You can stop at any point and submit what you have.
              </p>
            ) : null}
          </div>

          <div className="border border-rule bg-paper-raised p-5">
            <p className="bw-label text-ink-mute">Honest limits</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Pronunciation cannot be judged from a transcript, so it is reported as a delivery based
              estimate. Everything else is marked from what you actually said.
            </p>
          </div>

          {results.length > 0 ? (
            <button
              type="button"
              onClick={() => onSubmit(results)}
              className="w-full border border-ink px-4 py-3 text-xs font-semibold hover:bg-ink hover:text-paper"
            >
              Submit what I have recorded
            </button>
          ) : (
            <EmptyState
              title="Microphone check"
              body="Your browser will ask for microphone permission when you start the first answer. Nothing is uploaded: answers are recorded in your browser and only the timing and transcript are sent for marking."
            />
          )}
        </div>
      </div>
    </div>
  );
}
