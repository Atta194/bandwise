/**
 * The site's own component layer. Nothing here is a site-wide button utility:
 * every call to action from the brief's inventory is its own component with its
 * own interaction identity.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { useSession } from "../lib/session";

/* ---------------------------------------------------------------- marks */

export function RecordMark({ className }: { className?: string }) {
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Bandwise">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <g stroke="currentColor" strokeWidth="1" opacity="0.55">
        {ticks.map((deg) => (
          <line
            key={deg}
            x1="24"
            y1="4"
            x2="24"
            y2="8"
            transform={`rotate(${deg} 24 24)`}
          />
        ))}
      </g>
      <line x1="24" y1="22" x2="24" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.25" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2.5 " + (className ?? "")}>
      <RecordMark className="h-6 w-6 shrink-0" />
      <span className="text-[0.95rem] font-semibold tracking-[0.16em] uppercase">Bandwise</span>
    </span>
  );
}

/* ---------------------------------------------------------------- icons */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconBook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 5.5h6a2.5 2.5 0 0 1 2 2v11a2 2 0 0 0-2-1.6H4z" />
      <path {...stroke} d="M20 5.5h-6a2.5 2.5 0 0 0-2 2v11a2 2 0 0 1 2-1.6h6z" />
      <path {...stroke} d="M12 7.5v11" />
    </svg>
  );
}

export function IconHeadphones({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path {...stroke} d="M4 13.5h2.5V19H5.5A1.5 1.5 0 0 1 4 17.5z" />
      <path {...stroke} d="M20 13.5h-2.5V19h1A1.5 1.5 0 0 0 20 17.5z" />
    </svg>
  );
}

export function IconMic({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...stroke} x="9" y="3" width="6" height="10" rx="3" />
      <path {...stroke} d="M5 11a7 7 0 0 0 14 0" />
      <path {...stroke} d="M12 18v3M8.5 21h7" />
    </svg>
  );
}

export function IconPen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 20l1-4.5 10-10 3.5 3.5-10 10z" />
      <path {...stroke} d="M14 6l3.5 3.5" />
      <path {...stroke} d="M4.5 19.5l4-1" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 4v16h16" />
      <path {...stroke} d="M7 16l4-4 3 2.5 4-6" />
      <circle cx="7" cy="16" r="1.1" fill="currentColor" />
      <circle cx="18" cy="8.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconCompass({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="M15 9l-2 4.5L8.5 15l2-4.5z" />
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 12h15" />
      <path {...stroke} d="M13.5 6.5L20 12l-6.5 5.5" />
    </svg>
  );
}

export function IconTick({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function IconCross({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function moduleIcon(module: string, className?: string) {
  if (module === "reading") return <IconBook className={className} />;
  if (module === "listening") return <IconHeadphones className={className} />;
  if (module === "speaking") return <IconMic className={className} />;
  return <IconPen className={className} />;
}

/* ------------------------------------------------------------ structure */

/**
 * The only static destinations a call to action may name. Parameterised routes
 * are never passed as strings: a component takes a module and builds the typed
 * route itself, so a wrong path becomes a compile error rather than a dead link.
 */
export type StaticPath =
  | "/"
  | "/account"
  | "/dashboard"
  | "/mistakes"
  | "/analytics"
  | "/practice"
  | "/diagnostic"
  | "/policy";

export type ModuleParam = "reading" | "listening" | "speaking" | "writing";

export function Rule({ className }: { className?: string }) {
  return <div className={"h-px w-full bg-rule " + (className ?? "")} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="bw-label text-ink-mute">{children}</p>;
}

export function MeasureNote({ children }: { children: ReactNode }) {
  return (
    <p className="bw-numeric text-[0.7rem] leading-relaxed text-ink-mute">{children}</p>
  );
}

/* ------------------------------------------------------------ call to action */

/**
 * Hero primary. Its identity: the arrow slides and the block presses in.
 * It takes a module rather than a path, so it can only ever point at the
 * parameterised test route.
 */
export function StartMockCTA({
  module,
  children,
}: {
  module: ModuleParam;
  children: ReactNode;
}) {
  return (
    <Link
      to="/test/$module"
      params={{ module }}
      className="group inline-flex items-center gap-3 bg-accent px-6 py-3.5 text-sm font-semibold text-paper transition-transform duration-150 hover:bg-accent-ink active:translate-y-[1px]"
    >
      <span>{children}</span>
      <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Hero secondary. Its identity: an inline link whose rule sweeps to accent. */
export function ScoringLink({
  to,
  hash,
  children,
}: {
  to: StaticPath;
  hash?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      hash={hash}
      className="group inline-flex items-baseline gap-1 text-sm font-medium text-ink bw-underline-sweep hover:bw-underline-sweep-on"
    >
      {children}
      <span className="bw-numeric text-ink-mute" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

/** Module card. Its identity: corner ticks draw in on hover. */
export function BeginCTA({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-40"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-px -top-px h-2 w-2 border-l border-t border-current opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-px -right-px h-2 w-2 border-r border-b border-current opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      {children}
    </button>
  );
}

/**
 * The same garment, but a real link, so a module card is navigable by keyboard,
 * by middle click and by anything that reads the page.
 */
export function LinkBeginCTA({
  to,
  params,
  children,
}: {
  to: "/test/$module" | "/practice" | "/diagnostic" | "/mistakes" | "/dashboard";
  params?: { module: ModuleParam };
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      params={params}
      className="group relative inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-ink hover:text-paper"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-px -top-px h-2 w-2 border-l border-t border-current opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-px -right-px h-2 w-2 border-r border-b border-current opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------ social auth */

/**
 * A social sign in button.
 *
 * It is a plain navigation to this site's own start route, not a scripted
 * popup, so it works with third party cookies blocked. It targets the top level
 * window on purpose: this app is often displayed inside the platform's iframe,
 * and Google sends X-Frame-Options DENY on its sign in pages, so an OAuth flow
 * started inside a frame is refused before it reaches anything of ours. Breaking
 * out to the top level also means the session the callback writes lands in the
 * same origin the app reads it from.
 */
export function GoogleButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="border border-dashed border-rule-strong px-4 py-3">
        <p className="text-sm font-medium text-ink-mute">Continue with Google</p>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-mute">
          Not enabled on this deployment yet. The whole flow is built and waiting: add the Google
          Client ID and Client Secret for this site and the button appears here, with no further work.
        </p>
      </div>
    );
  }
  return (
    <a
      href="/api/auth/google"
      target="_top"
      rel="noopener"
      className="flex w-full items-center justify-center gap-3 border border-ink bg-paper-raised px-4 py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 11v2.6h6.1c-.3 1.5-1.9 4.4-6.1 4.4-3.7 0-6.7-3-6.7-6.7S8.3 4.6 12 4.6c2.1 0 3.5.9 4.3 1.6l2-1.9C16.9 2.9 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7z"
        />
      </svg>
      Continue with Google
    </a>
  );
}

/** Shown to the owner when a configured provider is missing, without blaming the visitor. */
export function SocialDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-rule" />
      <span className="bw-label text-ink-mute">or</span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}

/** Analytics section. Its identity: a framed block that inverts. */
export function FramedCTA({ to, children }: { to: StaticPath; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center justify-between gap-6 border border-ink bg-paper-raised px-5 py-4 text-sm font-semibold transition-colors duration-200 hover:bg-ink hover:text-paper"
    >
      {children}
      <IconCompass className="h-4 w-4" />
    </Link>
  );
}

/**
 * Closing. Its identity: a full width band whose tick ring turns on hover.
 * Takes either a static destination or a module, never a path string.
 */
export function BandCTA({
  to,
  module,
  children,
}: {
  to?: StaticPath;
  module?: ModuleParam;
  children: ReactNode;
}) {
  const className =
    "group flex w-full items-center justify-between gap-6 bg-ink px-6 py-5 text-paper transition-colors duration-200 hover:bg-accent";
  const inner = (
    <>
      <span className="text-base font-semibold">{children}</span>
      <RecordMark className="h-7 w-7 transition-transform duration-500 group-hover:rotate-45" />
    </>
  );

  if (module) {
    return (
      <Link to="/test/$module" params={{ module }} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to={to ?? "/account"} className={className}>
      {inner}
    </Link>
  );
}

/** Quiet inline action for tables and lists. */
export function QuietAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bw-underline-sweep text-sm font-medium text-accent hover:bw-underline-sweep-on"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- photography */

/**
 * A graded photograph. Every image on the site goes through this so the set
 * looks like one system; the duotone lives in styles.css, not in each call site.
 */
export function Plate({
  src,
  alt,
  className,
  opacity = 1,
}: {
  src: string;
  alt: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <div className={"bw-plate " + (className ?? "")}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{ opacity }} />
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

export function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  error,
  autoComplete,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string | null;
  autoComplete?: string;
  name?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="bw-label text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={
          "border bg-paper-raised px-3.5 py-3 text-[0.95rem] outline-none transition-colors placeholder:text-ink-mute " +
          (error ? "border-wrong" : "border-rule-strong focus:border-accent")
        }
      />
      {hint && !error ? <p className="text-xs leading-relaxed text-ink-mute">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-wrong">{error}</p> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- chrome */

const NAV_LINKS = [
  { to: "/dashboard", label: "The desk" },
  { to: "/practice", label: "Focused practice" },
  { to: "/mistakes", label: "Mistake lab" },
  { to: "/analytics", label: "Analytics" },
  { to: "/policy", label: "Content policy" },
];

export function SiteNav() {
  const { user, signOut } = useSession();
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-6 px-5">
        <Link to="/" aria-label="Bandwise home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bw-underline-sweep text-sm text-ink-soft hover:text-ink hover:bw-underline-sweep-on"
              activeProps={{ className: "text-ink" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden text-xs text-ink-mute sm:block">{user.email}</span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="border border-rule-strong px-3.5 py-2 text-xs font-medium hover:border-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/account"
              className="bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-accent"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <Wordmark className="text-ink" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Academic practice for people with a test date. Four modules, ten mocks in each, every
            wrong answer explained.
          </p>
        </div>
        <div>
          <Eyebrow>Modules</Eyebrow>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {MODULE_NAV.map((module) => (
              <li key={module.id}>
                <Link
                  to="/test/$module"
                  params={{ module: module.id }}
                  className="hover:text-ink"
                >
                  {module.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Eyebrow>Practice notes</Eyebrow>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Bands shown anywhere in this app are estimates from practice marking. They are not an
            official IELTS score, and this app is not affiliated with IELTS, the British Council,
            IDP or Cambridge University Press and Assessment.
          </p>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-5">
          <MeasureNote>Bandwise · practice marking only · every band is an estimate</MeasureNote>
          <p className="text-xs text-ink-soft">
            Designed and built by <span className="font-semibold text-ink">Attaullah</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-rule pb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {lede ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{lede}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------- formatting */

export function formatBand(band: number | null | undefined): string {
  if (band === null || band === undefined || band === 0) return "not marked";
  return band.toFixed(1);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "not recorded";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "not finished";
  return value.slice(0, 10);
}

export const MODULE_LABELS: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
};

/** Module list for the footer, in the order the paper is usually sat. */
const MODULE_NAV = [
  { id: "reading", title: "Reading" },
  { id: "listening", title: "Listening" },
  { id: "speaking", title: "Speaking" },
  { id: "writing", title: "Writing" },
];
