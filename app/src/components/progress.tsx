/**
 * The progress blocks shared by the desk, the level check result and the
 * focused practice page: what you have, what you are aiming at, what is
 * costing you marks, and what to do next.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { TARGET_PRESETS, cefrForBand } from "../content";
import type { AnalyticsResponse, AreaRow } from "../lib/session";
import { MODULE_LABELS, formatBand } from "./ui";

export function BandStat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "accent" | "wrong" | "muted";
}) {
  const colour =
    tone === "accent" ? "text-accent" : tone === "wrong" ? "text-wrong" : tone === "muted" ? "text-ink-mute" : "";
  return (
    <div>
      <p className="bw-label text-ink-mute">{label}</p>
      <p className={"bw-numeric mt-2 text-3xl font-semibold " + colour}>{value}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-ink-soft">{note}</p> : null}
    </div>
  );
}

/** Obtained against target, with the distance stated in bands. */
export function ProgressMeter({
  obtained,
  target,
  progress,
}: {
  obtained: number;
  target: number | null;
  progress: number | null;
}) {
  const low = 4;
  const high = 9;
  const position = (band: number) => ((band - low) / (high - low)) * 100;
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="bw-label text-ink-mute">You are here</p>
          <p className="bw-numeric mt-1 text-4xl font-semibold">{formatBand(obtained)}</p>
        </div>
        <div className="text-right">
          <p className="bw-label text-ink-mute">Target</p>
          <p className="bw-numeric mt-1 text-2xl font-semibold text-accent">
            {target ? formatBand(target) : "not set"}
          </p>
        </div>
      </div>

      <div className="relative mt-5 h-2 w-full bg-rule">
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${Math.max(2, Math.min(100, position(obtained)))}%` }}
        />
        {target ? (
          <div
            className="absolute -top-1.5 h-5 w-0.5 bg-ink"
            style={{ left: `${Math.min(100, position(target))}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-1.5 flex justify-between">
        {[4, 5, 6, 7, 8, 9].map((band) => (
          <span key={band} className="bw-numeric text-[0.65rem] text-ink-mute">
            {band.toFixed(1)}
          </span>
        ))}
      </div>

      {target ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {obtained >= target
            ? "Your latest overall estimate is at or above your target. Keep the profile level so a resit cannot surprise you."
            : `You need ${formatBand(target - obtained)} of a band to reach your target, which in Reading or Listening is roughly ${Math.max(1, Math.round((target - obtained) * 6))} more correct answers on a 40 question paper.`}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Set a target and the desk will show how far you still have to travel, and which question types
          stand between you and it.
        </p>
      )}

      {progress !== null && target ? (
        <div className="mt-4 border-t border-rule pt-4">
          <div className="flex items-baseline justify-between">
            <p className="bw-label text-ink-mute">Progress since your first result</p>
            <p className="bw-numeric text-sm font-semibold">{progress}%</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            {progress >= 100
              ? "The whole distance to your target has been covered."
              : progress <= 0
                ? "The work towards the target has not started yet. One focused drill a day moves this number."
                : "Measured from your earliest result to your target, so it only moves when a marked attempt improves."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Choose the band being worked towards. */
export function TargetSetter({
  value,
  onChange,
  busy,
}: {
  value: number | null;
  onChange: (band: number | null) => void;
  busy?: boolean;
}) {
  return (
    <div>
      <p className="bw-label text-ink-mute">Your target</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TARGET_PRESETS.map((preset) => (
          <button
            key={preset.band}
            type="button"
            disabled={busy}
            onClick={() => onChange(preset.band)}
            title={preset.note}
            className={
              "border px-3 py-2 text-left text-xs transition-colors " +
              (value === preset.band
                ? "border-ink bg-ink text-paper"
                : "border-rule-strong text-ink-soft hover:border-ink")
            }
          >
            <span className="bw-numeric mr-2 font-semibold">{formatBand(preset.band)}</span>
            {preset.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-mute">
        {value
          ? TARGET_PRESETS.find((preset) => preset.band === value)?.note ??
            "A custom target. Most programmes ask for the band printed in their own entry requirements."
          : "Pick the figure the institution or employer you are applying to asks for."}
      </p>
    </div>
  );
}

/** The CEFR half of a result. */
export function CefrPanel({ band }: { band: number }) {
  const level = cefrForBand(band);
  return (
    <div className="border border-rule bg-paper-raised p-5">
      <p className="bw-label text-ink-mute">CEFR level</p>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="bw-numeric text-3xl font-semibold">{level.cefr}</p>
        <p className="text-sm text-ink-soft">{level.label}</p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">{level.meaning}</p>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-mute">
        Estimated from a practice band using the published IELTS and CEFR alignment. Not an official
        result.
      </p>
    </div>
  );
}

/** What is costing marks, worst first, with the drill for each. */
export function PriorityList({
  areas,
  limit = 5,
  compact,
}: {
  areas: AreaRow[];
  limit?: number;
  compact?: boolean;
}) {
  if (areas.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-soft">
        No question type has been measured yet. Finish a mock or the level check and the engine will
        name the types costing you marks, worst first.
      </p>
    );
  }
  const shown = areas.slice(0, limit);
  return (
    <ol className="divide-y divide-rule">
      {shown.map((area, index) => (
        <li key={`${area.module}-${area.taskType}`} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="bw-numeric text-xs text-ink-mute">{index + 1}</span>
              <p className="text-sm font-semibold">
                {MODULE_LABELS[area.module] ?? area.module}: {area.label}
              </p>
            </div>
            <p
              className={
                "bw-numeric text-sm " + (area.accuracy < 50 ? "text-wrong" : area.accuracy < 70 ? "text-flag" : "text-correct")
              }
            >
              {area.accuracy}% ({area.correct}/{area.total})
            </p>
          </div>
          {!compact ? (
            <p className="mt-2 max-w-[80ch] text-xs leading-relaxed text-ink-soft">{area.advice}</p>
          ) : null}
          {!area.reliable ? (
            <p className="mt-2 text-[0.7rem] text-ink-mute">
              Only {area.total} question{area.total === 1 ? "" : "s"} answered of this type so far, so
              this is a weak signal rather than a verdict.
            </p>
          ) : null}
          <div className="mt-3">
            <Link
              to="/practice"
              search={{ module: area.module, type: area.taskType }}
              className="bw-underline-sweep text-xs font-medium text-accent hover:bw-underline-sweep-on"
            >
              Drill this question type
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Tips to improve, taken from the traps that have taken the most marks. */
export function TipList({
  traps,
  limit = 3,
}: {
  traps: AnalyticsResponse["traps"];
  limit?: number;
}) {
  if (traps.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-soft">
        Tips appear here once marks have been lost, because each one comes from a trap that actually
        cost you something.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {traps.slice(0, limit).map((trap) => (
        <li key={trap.trap ?? "unclassified"} className="border-t border-rule pt-4 first:border-0 first:pt-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">{trap.label}</p>
            <p className="bw-numeric text-xs text-ink-mute">{trap.count} marks</p>
          </div>
          <p className="mt-1.5 max-w-[80ch] text-xs leading-relaxed text-ink-soft">{trap.coaching}</p>
        </li>
      ))}
    </ul>
  );
}

export function ScoreRow({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3 last:border-0">
      <div>
        <p className="text-sm">{label}</p>
        {note ? <p className="mt-0.5 text-xs text-ink-mute">{note}</p> : null}
      </div>
      <p className="bw-numeric shrink-0 text-sm font-semibold">{value}</p>
    </div>
  );
}

export type RecommendationView = {
  headline: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

/**
 * The recommendation's call to action.
 *
 * The engine returns a plain href, but every one of them is turned into a real
 * typed route here, so a recommendation can never produce a link that does not
 * resolve. Unknown values fall back to the desk rather than dead-ending.
 */
export function RecommendationCTA({
  recommendation,
  className,
}: {
  recommendation: RecommendationView;
  className?: string;
}) {
  const style =
    className ??
    "mt-5 inline-block bg-accent px-5 py-3 text-sm font-semibold text-paper hover:bg-accent-ink";

  switch (recommendation.actionHref) {
    case "/test/reading":
      return (
        <Link to="/test/$module" params={{ module: "reading" }} className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/test/listening":
      return (
        <Link to="/test/$module" params={{ module: "listening" }} className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/test/writing":
      return (
        <Link to="/test/$module" params={{ module: "writing" }} className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/test/speaking":
      return (
        <Link to="/test/$module" params={{ module: "speaking" }} className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/mistakes":
      return (
        <Link to="/mistakes" className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/analytics":
      return (
        <Link to="/analytics" className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/diagnostic":
      return (
        <Link to="/diagnostic" className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    case "/practice":
      return (
        <Link to="/practice" className={style}>
          {recommendation.actionLabel}
        </Link>
      );
    default:
      return (
        <Link to="/dashboard" className={style}>
          {recommendation.actionLabel}
        </Link>
      );
  }
}
