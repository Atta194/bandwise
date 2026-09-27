/**
 * The band dial: the site's Tier-1 interaction and the hero's real content.
 *
 * The visitor drags the raw mark slider and the needle, the band numeral and the
 * scale ticks answer immediately. It is the product's actual 40 mark conversion,
 * so the hero demonstrates the scoring engine rather than decorating it.
 * Reduced motion is respected in CSS; the control works either way.
 */
import { useMemo, useState } from "react";

import { LISTENING_SCALE, READING_SCALE, bandFromRaw, bandLabel } from "../content";

type Scale = { min: number; band: number }[];

const START = -120;
const SWEEP = 240;

export function BandDial({ compact = false }: { compact?: boolean }) {
  const [module, setModule] = useState<"reading" | "listening">("reading");
  const [raw, setRaw] = useState(28);

  const scale: Scale = module === "reading" ? READING_SCALE : LISTENING_SCALE;
  const band = bandFromRaw(raw, scale);
  const angle = START + (raw / 40) * SWEEP;
  const label = bandLabel(band);

  const ticks = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const value = (i / 8) * 40;
        return {
          value,
          angle: START + (i / 8) * SWEEP,
          major: i % 2 === 0,
        };
      }),
    [],
  );

  return (
    <div
      className={
        "border border-rule bg-paper-raised " + (compact ? "p-5" : "p-6 md:p-7")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="bw-label text-ink-mute">The marking scale</p>
          <p className="mt-2 text-sm font-medium">Drag the raw mark. Watch the band answer.</p>
        </div>
        <div className="flex gap-1 border border-rule p-0.5">
          {(["reading", "listening"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setModule(id)}
              className={
                "px-2.5 py-1 text-[0.7rem] font-medium capitalize transition-colors " +
                (module === id ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
              }
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 200" className={compact ? "h-36 w-36" : "h-44 w-44 md:h-52 md:w-52"}>
            <circle cx="100" cy="100" r="86" fill="none" stroke="#c7cac0" strokeWidth="1" />
            <path
              d={describeArc(100, 100, 74, START, START + SWEEP)}
              fill="none"
              stroke="#c7cac0"
              strokeWidth="1"
            />
            {ticks.map((tick) => (
              <g key={tick.value} transform={`rotate(${tick.angle} 100 100)`}>
                <line
                  x1="100"
                  y1={tick.major ? 18 : 22}
                  x2="100"
                  y2={tick.major ? 30 : 27}
                  stroke="#9aa096"
                  strokeWidth={tick.major ? 1.5 : 1}
                />
              </g>
            ))}
            <g
              className="bw-dial-needle"
              style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              <line x1="100" y1="100" x2="100" y2="40" stroke="#2438c9" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <circle cx="100" cy="100" r="4" fill="#151a21" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="bw-numeric text-5xl font-semibold leading-none md:text-6xl">{band.toFixed(1)}</p>
          <p className="mt-2 text-sm font-medium text-ink-soft">{label}</p>
          <p className="mt-4 bw-numeric text-[0.7rem] text-ink-mute">
            {raw} of 40 correct
            <br />
            {module === "reading" ? "Reading scale" : "Listening scale"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="dial-raw" className="bw-label text-ink-mute">
          Raw mark
        </label>
        <input
          id="dial-raw"
          type="range"
          min={0}
          max={40}
          value={raw}
          onChange={(event) => setRaw(Number(event.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <div className="mt-1 flex justify-between">
          <span className="bw-numeric text-[0.65rem] text-ink-mute">0</span>
          <span className="bw-numeric text-[0.65rem] text-ink-mute">20</span>
          <span className="bw-numeric text-[0.65rem] text-ink-mute">40</span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-mute">
          Reading and Listening convert a 40 mark paper to a band. Writing and Speaking are marked
          against the four official criteria instead, and Task 2 in Writing carries twice the weight
          of Task 1.
        </p>
      </div>
    </div>
  );
}

/** SVG arc path for the dial's scale line. */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
