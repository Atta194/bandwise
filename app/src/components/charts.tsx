/**
 * Charts and data figures. Two jobs in one file:
 *  - renderChart draws a Task 1 figure from its stored specification, so every
 *    Writing prompt carries a real chart with a named source;
 *  - BandSeries draws the trend line on the Analytics dashboard.
 */
import type { ChartSpec } from "../content";

export function renderChart(spec: ChartSpec | undefined) {
  if (!spec) return null;
  return (
    <figure className="border border-rule bg-paper-raised">
      <figcaption className="border-b border-rule px-4 py-3">
        <span className="bw-label text-ink-mute">Figure</span>
        <p className="mt-1 text-sm font-semibold">{spec.title}</p>
      </figcaption>
      <div className="px-4 py-5">
        {spec.kind === "line" ? <LineChart spec={spec} /> : null}
        {spec.kind === "bar" ? <BarChart spec={spec} /> : null}
        {spec.kind === "pie" ? <PieChart spec={spec} /> : null}
        {spec.kind === "table" ? <DataTable spec={spec} /> : null}
        {spec.kind === "process" ? <ProcessDiagram spec={spec} /> : null}
        {spec.kind === "map" ? <MapCompare spec={spec} /> : null}
      </div>
      <p className="border-t border-rule px-4 py-2.5 text-[0.7rem] leading-relaxed text-ink-mute">
        Source: {spec.source}
      </p>
    </figure>
  );
}

type LineSpec = Extract<ChartSpec, { kind: "line" }>;
type BarSpec = Extract<ChartSpec, { kind: "bar" }>;
type PieSpec = Extract<ChartSpec, { kind: "pie" }>;
type TableSpec = Extract<ChartSpec, { kind: "table" }>;
type ProcessSpec = Extract<ChartSpec, { kind: "process" }>;
type MapSpec = Extract<ChartSpec, { kind: "map" }>;

function LineChart({ spec }: { spec: LineSpec }) {
  const width = 620;
  const height = 240;
  const padding = { top: 16, right: 58, bottom: 28, left: 44 };
  const allValues = spec.series.flatMap((s) => s.values);
  const max = niceMax(Math.max(...allValues));
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const x = (i: number) => padding.left + (i / Math.max(1, spec.categories.length - 1)) * innerW;
  const y = (v: number) => padding.top + innerH - (v / max) * innerH;
  const colours = ["#2438c9", "#151a21", "#9aa096", "#1f7a63"];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={spec.title}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * f}
              y2={padding.top + innerH * f}
              stroke="#c7cac0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={padding.top + innerH * f + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#6b7280"
            >
              {Math.round(max * (1 - f))}
            </text>
          </g>
        ))}
        {spec.series.map((series, si) => (
          <polyline
            key={series.name}
            fill="none"
            stroke={colours[si % colours.length]}
            strokeWidth="2"
            points={series.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {spec.series.map((series, si) =>
          series.values.map((v, i) => (
            <circle key={`${series.name}-${i}`} cx={x(i)} cy={y(v)} r="2.5" fill={colours[si % colours.length]} />
          )),
        )}
        {spec.categories.map((c, i) => (
          <text
            key={c}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="#6b7280"
          >
            {c}
          </text>
        ))}
      </svg>
      <Legend names={spec.series.map((s) => s.name)} colours={colours} unit={spec.unit} />
    </div>
  );
}

function BarChart({ spec }: { spec: BarSpec }) {
  const width = 620;
  const height = 250;
  const padding = { top: 16, right: 12, bottom: 54, left: 52 };
  const max = niceMax(Math.max(...spec.series.flatMap((s) => s.values)));
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const groups = spec.categories.length;
  const groupWidth = innerW / groups;
  const barWidth = Math.max(8, (groupWidth * 0.62) / spec.series.length);
  const colours = ["#2438c9", "#151a21", "#9aa096"];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={spec.title}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * f}
              y2={padding.top + innerH * f}
              stroke="#c7cac0"
            />
            <text
              x={padding.left - 8}
              y={padding.top + innerH * f + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#6b7280"
            >
              {Math.round(max * (1 - f))}
            </text>
          </g>
        ))}
        {spec.categories.map((category, ci) => (
          <g key={category}>
            {spec.series.map((series, si) => {
              const value = series.values[ci] ?? 0;
              const barH = (value / max) * innerH;
              const bx =
                padding.left + ci * groupWidth + groupWidth / 2 -
                (barWidth * spec.series.length) / 2 +
                si * barWidth;
              return (
                <rect
                  key={series.name}
                  x={bx}
                  y={padding.top + innerH - barH}
                  width={barWidth - 2}
                  height={barH}
                  fill={colours[si % colours.length]}
                />
              );
            })}
            <text
              x={padding.left + ci * groupWidth + groupWidth / 2}
              y={height - 36}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#6b7280"
            >
              {category.length > 11 ? `${category.slice(0, 10)}.` : category}
            </text>
          </g>
        ))}
      </svg>
      <Legend names={spec.series.map((s) => s.name)} colours={colours} unit={spec.unit} />
    </div>
  );
}

function PieChart({ spec }: { spec: PieSpec }) {
  const total = spec.slices.reduce((t, s) => t + s.value, 0);
  const colours = ["#2438c9", "#151a21", "#9aa096", "#1f7a63", "#c0392b"];
  let cursor = -90;
  const radius = 78;
  const cx = 100;
  const cy = 100;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" className="h-44 w-44" role="img" aria-label={spec.title}>
        {spec.slices.map((slice, i) => {
          const sweep = (slice.value / total) * 360;
          const path = describeSlice(cx, cy, radius, cursor, cursor + sweep);
          cursor += sweep;
          return <path key={slice.label} d={path} fill={colours[i % colours.length]} />;
        })}
        <circle cx={cx} cy={cy} r="34" fill="#f7f8f4" stroke="#c7cac0" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="#3d4550">
          {spec.unit.replace(/[^0-9]/g, "") ? spec.unit.split(" ")[0] : "share"}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {spec.slices.map((slice, i) => (
          <li key={slice.label} className="flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3"
              style={{ background: colours[i % colours.length] }}
              aria-hidden="true"
            />
            <span className="text-ink-soft">{slice.label}</span>
            <span className="bw-numeric text-ink">{slice.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataTable({ spec }: { spec: TableSpec }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule-strong">
            {spec.columns.map((column, i) => (
              <th
                key={column}
                className={
                  "py-2.5 " +
                  (i === 0 ? "text-left" : "text-right") +
                  " bw-label text-ink-mute"
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row) => (
            <tr key={row[0]} className="border-b border-rule last:border-0">
              {row.map((cell, i) => (
                <td
                  key={`${row[0]}-${i}`}
                  className={
                    "py-2.5 " + (i === 0 ? "text-left font-medium" : "bw-numeric text-right text-ink-soft")
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessDiagram({ spec }: { spec: ProcessSpec }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {spec.steps.map((step, i) => (
        <li key={step.label} className="border border-rule bg-paper p-4">
          <span className="bw-numeric text-[0.7rem] text-accent">
            step {String(i + 1).padStart(2, "0")}
          </span>
          <p className="mt-2 text-sm font-semibold">{step.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

function MapCompare({ spec }: { spec: MapSpec }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { title: "Before", items: spec.before, tint: "bg-paper" },
        { title: "After", items: spec.after, tint: "bg-paper-raised" },
      ].map((column) => (
        <div key={column.title} className={"border border-rule p-4 " + column.tint}>
          <p className="bw-label text-ink-mute">{column.title}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {column.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="bw-numeric text-ink-mute" aria-hidden="true">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Legend({ names, colours, unit }: { names: string[]; colours: string[]; unit: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      {names.map((name, i) => (
        <span key={name} className="flex items-center gap-2 text-xs text-ink-soft">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: colours[i % colours.length] }}
            aria-hidden="true"
          />
          {name}
        </span>
      ))}
      <span className="bw-numeric text-[0.65rem] text-ink-mute">{unit}</span>
    </div>
  );
}

/* ------------------------------------------------------------ analytics */

export function BandSeries({
  series,
  label,
  target,
}: {
  series: { label: string; band: number }[];
  label: string;
  target?: number | null;
}) {
  if (series.length === 0) {
    return (
      <p className="py-6 text-sm text-ink-mute">
        No completed attempts in {label} yet, so there is no trend to plot.
      </p>
    );
  }
  const width = 560;
  const height = 150;
  const padding = { top: 12, right: 12, bottom: 24, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const x = (i: number) => padding.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (band: number) => padding.top + innerH - ((band - 1) / 8) * innerH;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${label} band over time`}>
        {[1, 3, 5, 7, 9].map((band) => (
          <g key={band}>
            <line x1={padding.left} x2={width - padding.right} y1={y(band)} y2={y(band)} stroke="#c7cac0" />
            <text
              x={padding.left - 8}
              y={y(band) + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#6b7280"
            >
              {band}
            </text>
          </g>
        ))}

        {/* The target, so progress over time is read against the aim, not in isolation. */}
        {target && target >= 1 && target <= 9 ? (
          <g>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(target)}
              y2={y(target)}
              stroke="#2438c9"
              strokeWidth="1.25"
              strokeDasharray="5 4"
            />
            <text
              x={width - padding.right}
              y={y(target) - 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#1a2aa0"
            >
              target {target.toFixed(1)}
            </text>
          </g>
        ) : null}

        <polyline
          fill="none"
          stroke="#2438c9"
          strokeWidth="2"
          points={series.map((point, i) => `${x(i)},${y(point.band)}`).join(" ")}
        />
        {series.map((point, i) => (
          <g key={`${point.label}-${i}`}>
            <circle cx={x(i)} cy={y(point.band)} r="3" fill="#2438c9" />
            <title>{`${point.label}: band ${point.band.toFixed(1)}`}</title>
          </g>
        ))}
        <text x={padding.left} y={height - 6} fontSize="10" fontFamily="var(--font-mono)" fill="#6b7280">
          {series[0].label}
        </text>
        <text
          x={width - padding.right}
          y={height - 6}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="#6b7280"
        >
          {series[series.length - 1].label}
        </text>
      </svg>
    </div>
  );
}

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, r, startAngle);
  const end = polarPoint(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
