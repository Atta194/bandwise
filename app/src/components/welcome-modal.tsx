/**
 * The welcome popup.
 *
 * It appears once, on the desk, for a candidate who has not yet been measured,
 * and it asks them to take the level check so the engine has something to aim
 * at. Dismissing it is remembered on the account, not just in the browser.
 */
import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

import { DIAGNOSTIC_COPY } from "../content/diagnostic";

export function WelcomeModal({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
}) {
  const primary = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    primary.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="bw-enter w-full max-w-lg border border-ink bg-paper p-6 shadow-none"
      >
        <p className="bw-label text-accent">Level check</p>
        <h2 id="welcome-title" className="mt-3 text-2xl font-semibold tracking-tight">
          {DIAGNOSTIC_COPY.headline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Hello {name.split(" ")[0]}. {DIAGNOSTIC_COPY.body}
        </p>

        <ul className="mt-5 grid gap-2 border-y border-rule py-4 text-xs text-ink-soft sm:grid-cols-2">
          <li className="bw-numeric">{DIAGNOSTIC_COPY.duration}</li>
          <li className="bw-numeric">{DIAGNOSTIC_COPY.questions}</li>
          <li>One Reading passage</li>
          <li>One Listening Part 1</li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            ref={primary}
            to="/diagnostic"
            className="inline-flex items-center gap-2 bg-accent px-5 py-3 text-sm font-semibold text-paper hover:bg-accent-ink"
          >
            Take the test to find my level
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="border border-rule-strong px-4 py-3 text-xs font-medium hover:border-ink"
          >
            Not now
          </button>
        </div>

        <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-mute">
          You can take it later from the desk, and every full mock you sit feeds the same dashboard.
        </p>
      </div>
    </div>
  );
}
