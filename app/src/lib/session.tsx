/**
 * Client side session and API access.
 *
 * The site runs its own accounts, so the browser holds an opaque session token
 * and sends it as a bearer header to this site's own /api routes. The token is
 * only ever read inside effects and handlers, never during render, so the app
 * stays safe to server-render. No answer key, prompt answer or marking logic
 * lives on this side: the server marks every attempt.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const TOKEN_KEY = "bandwise.session";
const EMAIL_KEY = "bandwise.email";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  targetBand: number | null;
  onboarded: boolean;
  provider: string | null;
};

export type Providers = { google: boolean; apple: boolean };

export type AreaRow = {
  module: string;
  taskType: string;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
  reliable: boolean;
  advice: string;
  drillHref: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable, the session simply does not persist */
  }
}

/** The email is kept so a returning visitor is not asked to type it again. */
function storeEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
}

function readEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(action: string, body?: unknown): Promise<T> {
  const token = getToken();
  const response = await fetch(`/api/${action}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new ApiError(String(data.error ?? `Request failed (${response.status})`), response.status);
  }
  return data as T;
}

/* -------------------------------------------------------------- responses */

export type StartResponse = {
  attemptId: string;
  module: "reading" | "listening" | "speaking" | "writing" | "diagnostic";
  mockId: string;
  mockTitle: string;
  focus: string;
  minutes: number;
  questions: number;
  note?: string | null;
  payload: unknown;
};

export type ReadingQuestionView = {
  n: number;
  passage: number;
  type: string;
  group: string;
  instruction: string;
  stem: string;
  options?: string[];
};

export type ListeningPartView = {
  part: number;
  role: string;
  context: string;
  turns: { speaker: string; accent: string; line: string }[];
  /** Path to the recorded audio for this part, when one has been produced. */
  audio?: string;
};

export type ListeningQuestionView = ReadingQuestionView & { part: number };

export type AttemptSummary = {
  id: string;
  module: string;
  kind?: string;
  mockTitle: string;
  band: number | null;
  rawScore: number | null;
  total: number | null;
  durationSec: number | null;
  finishedAt: string | null;
};

export type AttemptItem = {
  id: string;
  question_no: number;
  module: string;
  task_type: string;
  question_group: string | null;
  stem: string | null;
  given: string | null;
  correct: string | null;
  is_correct: number;
  trap: string | null;
  evidence: string | null;
};

export type CriteriaJson = {
  name: string;
  band: number;
  comment: string;
  actions: string[];
};

export type AttemptDetail = {
  attempt: {
    id: string;
    module: string;
    kind: string;
    mockTitle: string;
    status: string;
    rawScore: number | null;
    total: number | null;
    band: number | null;
    bandText: string | null;
    durationSec: number | null;
    startedAt: string;
    finishedAt: string | null;
    summary: {
      equivalent?: number;
      indicative?: boolean;
      mode?: string;
      byTrap?: { trap: string; count: number }[];
      byType?: { type: string; correct: number; total: number }[];
    } | null;
  };
  items: AttemptItem[];
  cefr: { cefr: string; label: string; meaning: string } | null;
  areas: AreaRow[];
  writing: {
    task: number;
    words: number;
    meetsMinimum: boolean;
    band: number;
    criteria: CriteriaJson[];
    flags: { text: string; kind: string; advice: string }[];
  }[];
  speaking: {
    part: number;
    question: string;
    seconds: number;
    words: number;
    transcript: string | null;
    band: number;
    criteria: CriteriaJson[];
  }[];
  recommendation: {
    headline: string;
    body: string;
    actionLabel: string;
    actionHref: string;
  } | null;
};

export type AnalyticsResponse = {
  modules: {
    module: string;
    attempts: number;
    best: number;
    latest: number;
    average: number;
    trend: "up" | "down" | "flat" | "none";
    series: { label: string; band: number }[];
  }[];
  overall: number;
  overallIsEstimate: boolean;
  diagnostic: number;
  targetBand: number | null;
  obtained: number;
  cefr: { cefr: string; label: string; meaning: string } | null;
  gap: { gap: number; reached: boolean } | null;
  progress: number | null;
  totals: { attempts: number; minutes: number; questionsAnswered: number; mistakes: number };
  traps: { trap: string | null; count: number; label: string; coaching: string }[];
  trapsByModule: { module: string; trap: string | null; count: number; label: string; coaching: string }[];
  types: { type: string; correct: number; total: number; rate: number }[];
  areas: AreaRow[];
  weakestModule: string | null;
};

export type MistakeRow = {
  id: string;
  attemptId: string;
  module: string;
  questionNo: number;
  taskType: string;
  group: string | null;
  stem: string | null;
  given: string | null;
  correct: string | null;
  trap: string | null;
  trapLabel: string;
  coach: string;
  evidence: string | null;
};

/* ----------------------------------------------------------------- context */

type SessionValue = {
  user: PublicUser | null;
  loading: boolean;
  rememberedEmail: string | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  applyToken: (token: string) => Promise<void>;
  setProfile: (patch: { targetBand?: number | null; onboarded?: boolean }) => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);

  useEffect(() => {
    setRememberedEmail(readEmail());
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await api<{ user: PublicUser | null }>("auth/me");
      setUser(result.user);
      if (result.user) setRememberedEmail(result.user.email);
    } catch {
      storeToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string, remember = true) => {
    const result = await api<{ token: string; user: PublicUser }>("auth/signin", {
      email,
      password,
      remember,
    });
    storeToken(result.token);
    storeEmail(result.user.email);
    setRememberedEmail(result.user.email);
    setUser(result.user);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, remember = true) => {
      const result = await api<{ token: string; user: PublicUser }>("auth/signup", {
        name,
        email,
        password,
        remember,
      });
      storeToken(result.token);
      storeEmail(result.user.email);
      setRememberedEmail(result.user.email);
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await api("auth/signout");
    } catch {
      /* signing out locally is enough */
    }
    storeToken(null);
    setUser(null);
  }, []);

  /** Used by the social sign in callback, which arrives with a token fragment. */
  const applyToken = useCallback(
    async (token: string) => {
      storeToken(token);
      await refresh();
    },
    [refresh],
  );

  const setProfile = useCallback(
    async (patch: { targetBand?: number | null; onboarded?: boolean }) => {
      const result = await api<{ user: PublicUser }>("profile/set", patch);
      setUser(result.user);
    },
    [],
  );

  const value = useMemo<SessionValue>(
    () => ({
      user,
      loading,
      rememberedEmail,
      refresh,
      signIn,
      signUp,
      signOut,
      applyToken,
      setProfile,
    }),
    [user, loading, rememberedEmail, refresh, signIn, signUp, signOut, applyToken, setProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside the session provider");
  return value;
}
