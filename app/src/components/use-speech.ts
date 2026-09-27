/**
 * The recording player.
 *
 * Two faults were making the listening paper silent, and both are fixed here.
 *
 * 1. Long utterances. A monologue line runs 300 to 800 characters, and the
 *    speech engine in Chrome truncates or drops utterances of that length. Every
 *    line is now cut at sentence boundaries into short pieces and the pieces are
 *    spoken in sequence, which is also what makes the pauses land where a
 *    speaker would pause.
 * 2. The cancel race. Calling cancel() and then speak() in the same tick loses
 *    the first utterance in Chrome. The engine is now cancelled, given a short
 *    pause, and only then started.
 *
 * It also waits for the voice list to arrive (it is empty on first paint in
 * several browsers), watches for an engine that never actually starts, and
 * reports that failure so the paper can fall back to the written recording
 * instead of sitting in silence.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type Turn = { speaker: string; accent: string; line: string };

/** Speech engines mishandle long utterances, so lines are spoken in pieces. */
const MAX_PIECE = 170;

export function splitForSpeech(line: string): string[] {
  const sentences = line.match(/[^.!?]+[.!?]*\s*/g) ?? [line];
  const pieces: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && (current + sentence).length > MAX_PIECE) {
      pieces.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces.length ? pieces : [line];
}

type Piece = { text: string; accent: string; speaker: string; turn: number };

export function useSpeechEngine() {
  const [state, setState] = useState<"unknown" | "ready" | "unavailable">("unknown");
  const [speaking, setSpeaking] = useState(false);
  const [turnIndex, setTurnIndex] = useState(-1);
  const [engineFailed, setEngineFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  const cancelled = useRef(false);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setState("unavailable");
      return;
    }
    const load = () => {
      voices.current = window.speechSynthesis.getVoices();
      if (voices.current.length > 0) setState("ready");
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    // Some browsers populate the list late; ask again shortly after mount.
    const late = window.setTimeout(load, 800);
    return () => {
      cancelled.current = true;
      if (timer.current) window.clearTimeout(timer.current);
      window.clearTimeout(late);
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    cancelled.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setTurnIndex(-1);
  }, []);

  /** Waits briefly for the voice list, which is empty on first paint. */
  const ensureVoices = useCallback(async (): Promise<SpeechSynthesisVoice[]> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    if (voices.current.length) return voices.current;
    const first = window.speechSynthesis.getVoices();
    if (first.length) {
      voices.current = first;
      return first;
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.speechSynthesis.removeEventListener("voiceschanged", finish);
        voices.current = window.speechSynthesis.getVoices();
        resolve(voices.current);
      };
      window.speechSynthesis.addEventListener("voiceschanged", finish);
      window.setTimeout(finish, 1200);
    });
  }, []);

  const pickVoice = (available: SpeechSynthesisVoice[], accent: string) => {
    const normalise = (value: string) => value.replace("_", "-").toLowerCase();
    const wanted = normalise(accent);
    const exact = available.filter((voice) => normalise(voice.lang) === wanted);
    const region = available.filter((voice) => normalise(voice.lang).startsWith(wanted.slice(0, 2)));
    return (
      exact.find((voice) => voice.localService) ??
      exact[0] ??
      region.find((voice) => voice.localService) ??
      region[0]
    );
  };

  /**
   * Plays every turn in order, in pieces. `onDone` fires when the last piece of
   * the last pass finishes. `repeat` replays the whole thing for a question that
   * must be heard twice.
   */
  const play = useCallback(
    (turns: Turn[], options?: { repeat?: number; onDone?: () => void; rate?: number }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setState("unavailable");
        options?.onDone?.();
        return;
      }

      const repeat = Math.max(1, options?.repeat ?? 1);
      const pieces: Piece[] = [];
      turns.forEach((turn, turnNumber) => {
        for (const text of splitForSpeech(turn.line)) {
          pieces.push({ text, accent: turn.accent, speaker: turn.speaker, turn: turnNumber });
        }
      });
      if (pieces.length === 0) {
        options?.onDone?.();
        return;
      }

      cancelled.current = false;
      setEngineFailed(false);
      setSpeaking(true);
      setProgress(0);

      // Cancel anything still playing, then wait a beat before speaking: doing
      // both in the same tick loses the first utterance in Chrome.
      window.speechSynthesis.cancel();

      void (async () => {
        const available = await ensureVoices();
        await new Promise((resolve) => window.setTimeout(resolve, 90));
        if (cancelled.current) return;

        let pass = 0;
        let index = 0;
        let started = false;

        const speakPiece = () => {
          if (cancelled.current) return;
          if (index >= pieces.length) {
            pass += 1;
            if (pass >= repeat) {
              setSpeaking(false);
              setTurnIndex(-1);
              setProgress(100);
              options?.onDone?.();
              return;
            }
            index = 0;
            setProgress(0);
          }

          const piece = pieces[index];
          setTurnIndex(piece.turn);
          setProgress(Math.round((index / pieces.length) * 100));

          const utterance = new SpeechSynthesisUtterance(piece.text);
          utterance.lang = piece.accent;
          // A shade under normal pace reads like a speaker rather than a machine,
          // scaled by whatever practice speed the candidate has chosen.
          utterance.rate = 0.93 * Math.min(2, Math.max(0.5, options?.rate ?? 1));
          utterance.pitch = 1;
          utterance.volume = 1;
          const voice = pickVoice(available, piece.accent);
          if (voice) utterance.voice = voice;

          let advanced = false;
          const advance = () => {
            if (advanced) return;
            advanced = true;
            index += 1;
            speakPiece();
          };

          // If the engine never starts, it is not going to speak at all: say so
          // rather than leaving the candidate in silence.
          const startWatch = window.setTimeout(() => {
            if (!started && !advanced) {
              setEngineFailed(true);
              setState("unavailable");
              setSpeaking(false);
              setTurnIndex(-1);
            }
          }, 2500);

          utterance.onstart = () => {
            started = true;
            window.clearTimeout(startWatch);
          };
          utterance.onend = () => {
            window.clearTimeout(startWatch);
            advance();
          };
          utterance.onerror = () => {
            window.clearTimeout(startWatch);
            advance();
          };

          // A piece that hangs (some engines do) must not stall the recording.
          const stallGuard = window.setTimeout(advance, 4000 + piece.text.length * 90);
          const clearGuard = () => window.clearTimeout(stallGuard);
          utterance.addEventListener?.("end", clearGuard);

          window.speechSynthesis.speak(utterance);
        };

        speakPiece();
      })();
    },
    [ensureVoices],
  );

  return { state, speaking, turnIndex, progress, engineFailed, play, stop };
}
