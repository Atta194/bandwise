import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ApiError, api, useSession, type Providers } from "../lib/session";
import {
  Field,
  GoogleButton,
  SiteFooter,
  SiteNav,
  SocialDivider,
  Wordmark,
} from "../components/ui";

export const Route = createFileRoute("/account")({
  component: AccountRoute,
});

const PROVIDER_ERRORS: Record<string, string> = {
  "google-unavailable":
    "Google sign in is not enabled on this deployment yet. Use your email and password, or add the Google keys for this site.",
  "google-cancelled": "Google sign in was cancelled or refused before it finished. Nothing was changed.",
  "google-state": "That sign in link has already been used or has expired. Start again from this page.",
  "google-failed":
    "Google could not confirm the sign in. Start again, or use your email and password. If this repeats, check that this exact redirect address is listed on the Google OAuth client.",
  access_denied:
    "Google refused the sign in for this account. If the OAuth consent screen is still in Testing, add this Google account under Test users, or publish the app.",
  disallowed_useragent:
    "Google blocks sign in inside an embedded browser. Open this site in a normal browser window, such as Chrome or Safari, and try again.",
  "invalid-client": "Google did not recognise the client. Check the Client ID on this site's secrets.",
};

function AccountRoute() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading, applyToken, rememberedEmail } = useSession();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<Providers | null>(null);

  // The email is filled in from the last visit, so a returning candidate only
  // has to type a password.
  useEffect(() => {
    if (rememberedEmail) setEmail((current) => current || rememberedEmail);
  }, [rememberedEmail]);

  useEffect(() => {
    void api<Providers>("auth/providers")
      .then(setProviders)
      .catch(() => setProviders({ google: false, apple: false }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get("error");
    if (providerError) setNotice(PROVIDER_ERRORS[providerError] ?? "That sign in did not complete.");
  }, []);

  // The social callback hands the session over in the fragment, which never
  // reaches a server. It is stored and then cleared from the address bar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    if (!token) return;
    void applyToken(token)
      .then(() => {
        window.history.replaceState(null, "", "/account");
        void navigate({ to: "/dashboard" });
      })
      .catch(() => setNotice("That sign in could not be completed. Try again."));
  }, [applyToken, navigate]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") await signUp(name, email, password, remember);
      else await signIn(email, password, remember);
      void navigate({ to: "/dashboard" });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not work. Check your details.");
    } finally {
      setBusy(false);
    }
  }, [mode, name, email, password, remember, signUp, signIn, navigate]);

  return (
    <div>
      <SiteNav />
      <main className="mx-auto grid max-w-[1180px] gap-14 px-5 py-16 lg:grid-cols-2">
        <div>
          <p className="bw-label text-ink-mute">
            {mode === "up" ? "Create an account" : "Sign in"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {mode === "up"
              ? "One account for all four modules."
              : "Pick up where you left off."}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
            Every attempt is marked, every wrong answer explained, and every result added to the
            mistake lab and the analytics dashboard. An account keeps that history on the server, not
            in this browser.
          </p>

          <ul className="mt-8 space-y-4 border-t border-rule pt-6 text-sm text-ink-soft">
            <li>A level check of 23 official format questions, so the first thing you see is a number.</li>
            <li>Ten stored mocks in each module, drawn at random on reset.</li>
            <li>Focused practice on the question types costing you marks, with the strategy for each.</li>
            <li>Your obtained band, your target band, and the distance between them.</li>
          </ul>
        </div>

        <div>
          {user ? (
            <div className="border border-rule bg-paper-raised p-6">
              <Wordmark />
              <p className="mt-4 text-sm text-ink-soft">
                You are signed in as {user.name} ({user.email})
                {user.provider ? `, through ${user.provider}` : ""}.
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-accent"
              >
                Go to the desk
              </Link>
            </div>
          ) : (
            <div className="border border-rule bg-paper-raised p-6">
              <GoogleButton enabled={Boolean(providers?.google)} />
              <SocialDivider />

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div className="flex gap-1 border border-rule p-0.5">
                  {(["up", "in"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setMode(id);
                        setError(null);
                      }}
                      className={
                        "flex-1 px-3 py-2 text-xs font-medium transition-colors " +
                        (mode === id ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                      }
                    >
                      {id === "up" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>

                {notice ? (
                  <p className="mt-4 border border-flag px-3 py-2 text-xs leading-relaxed text-flag">
                    {notice}
                  </p>
                ) : null}

                <div className="mt-6 space-y-4">
                  {mode === "up" ? (
                    <Field
                      label="Name on your reports"
                      value={name}
                      onChange={setName}
                      autoComplete="name"
                      hint="Shown on your attempt history in this app only."
                    />
                  ) : null}
                  <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    hint={mode === "up" ? "At least 8 characters." : undefined}
                    error={error}
                  />
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-rule pt-4">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-accent"
                  />
                  <span>
                    <span className="text-sm font-medium">Keep me signed in on this device</span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-mute">
                      You will not be asked for your password again here, and your attempt history,
                      target score and progress will be waiting. Clear the tick on a shared computer.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="mt-6 w-full bg-accent px-5 py-3.5 text-sm font-semibold text-paper hover:bg-accent-ink disabled:opacity-50"
                >
                  {busy ? "Working…" : mode === "up" ? "Create my account" : "Sign in"}
                </button>
              </form>

              <p className="mt-4 text-xs leading-relaxed text-ink-mute">
                Your password is stored only as a derived key with a per account salt. Answers are
                marked on the server, and the answer keys are never sent to your browser before you
                submit.
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
