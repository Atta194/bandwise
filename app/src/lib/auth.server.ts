/**
 * Password hashing and session tokens. Server only.
 *
 * Passwords are never stored, and never leave this module in any form. The
 * derived key is PBKDF2-SHA256 with a per user random salt, using Web Crypto,
 * which is available in the Workers runtime.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { bindings } from "./bindings.server";
import {
  findUserById,
  insertSession,
  insertUser,
  linkProvider,
  refreshSession,
  sessionForToken,
  userForProvider,
  userForToken,
  type UserRow,
} from "./db.server";

const ITERATIONS = 50_000;

/**
 * How long a session lasts.
 *
 * "Keep me signed in" is the pattern every account based site uses: ticked, the
 * device is trusted for six months and the candidate is never asked for a
 * password again on it, so their history and progress are simply there when they
 * return. Unticked, the session lasts a day and the credential is not retained.
 */
const REMEMBERED_DAYS = 180;
const SHORT_DAYS = 1;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function derive(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/** Constant time comparison, so a wrong password leaks nothing by timing. */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64(bytes).replace(/[^A-Za-z0-9]/g, "").slice(0, 43);
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  targetBand: number | null;
  onboarded: boolean;
  provider: string | null;
};

export function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    targetBand: row.target_band ?? null,
    onboarded: Boolean(row.onboarded),
    provider: row.provider ?? null,
  };
}

export async function registerUser(
  db: D1Database,
  input: { email: string; name: string; password: string },
  remember = true,
): Promise<{ token: string; user: PublicUser }> {
  const email = input.email.trim().toLowerCase();
  const salt = newSalt();
  const passwordHash = await derive(input.password, salt, ITERATIONS);
  const now = new Date().toISOString();
  const row: UserRow = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim().slice(0, 80),
    password_hash: passwordHash,
    salt,
    iterations: ITERATIONS,
    created_at: now,
    target_band: null,
    onboarded: 0,
    provider: null,
    provider_id: null,
  };
  await insertUser(db, row);
  const token = newToken();
  await insertSession(db, token, row.id, now, expiry(now, remember), remember);
  return { token, user: publicUser(row) };
}

export async function authenticate(
  db: D1Database,
  input: { email: string; password: string },
  remember = true,
): Promise<{ token: string; user: PublicUser } | null> {
  const row = await verifyPassword(db, input.email, input.password);
  if (!row) return null;
  const now = new Date().toISOString();
  const token = newToken();
  await insertSession(db, token, row.id, now, expiry(now, remember), remember);
  return { token, user: publicUser(row) };
}

function expiry(from: string, remember = true): string {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() + (remember ? REMEMBERED_DAYS : SHORT_DAYS));
  return date.toISOString();
}

/**
 * Resolves the session on the request and keeps it alive while it is in use.
 * The refresh only writes when the session is past half its life, so this adds
 * no meaningful cost to a busy account.
 */
export async function currentUser(db: D1Database, request: Request): Promise<UserRow | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1];

  const session = await sessionForToken(db, token);
  if (!session) return null;
  if (session.expires_at < new Date().toISOString()) {
    await userForToken(db, token);
    return null;
  }

  const remember = session.remember !== 0;
  const days = remember ? REMEMBERED_DAYS : SHORT_DAYS;
  const threshold = new Date(Date.now() + (days / 2) * 86_400_000).toISOString();
  const next = new Date(Date.now() + days * 86_400_000).toISOString();
  await refreshSession(db, token, threshold, next);

  return findUserById(db, session.user_id);
}

/** Shape rules for new accounts, so the client and server agree. */
export function validateCredentials(input: { email?: string; password?: string; name?: string }): string | null {
  const email = (input.email ?? "").trim();
  const password = input.password ?? "";
  const name = (input.name ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password of at least 8 characters.";
  if (name.length < 2) return "Tell us the name you want on your reports.";
  return null;
}

/* ------------------------------------------------------- social sign in */

/**
 * Google sign in. The flow is the standard authorization code exchange and it
 * is only ever offered when both secrets exist, so the button on the account
 * page cannot lead anywhere that does not work.
 */
export type ProviderProfile = { email: string; name: string; providerId: string };

export function googleConfigured(): boolean {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = bindings();
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
}

export function googleAuthUrl(request: Request, state: string): string {
  const { GOOGLE_CLIENT_ID } = bindings();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(request: Request, code: string): Promise<ProviderProfile | null> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = bindings();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return null;
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) return null;

  const infoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoResponse.ok) return null;
  const info = (await infoResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
  };
  if (!info.email || !info.sub) return null;

  return {
    email: info.email.trim().toLowerCase(),
    name: (info.name || info.given_name || info.email.split("@")[0]).slice(0, 80),
    providerId: info.sub,
  };
}

/**
 * Finds or creates the account for a verified provider identity, then starts a
 * session. An existing account with the same email is linked rather than
 * duplicated, so a candidate who signed up with a password can later use the
 * button and keep their history.
 */
export async function signInWithProvider(
  db: D1Database,
  provider: string,
  profile: ProviderProfile,
): Promise<{ token: string; user: PublicUser; created: boolean }> {
  const now = new Date().toISOString();
  let row = await userForProvider(db, provider, profile.providerId);
  let created = false;

  if (!row) {
    const byEmail = await db
      .prepare("SELECT * FROM users WHERE email = ?1")
      .bind(profile.email)
      .first<UserRow>();
    if (byEmail) {
      await linkProvider(db, byEmail.id, provider, profile.providerId);
      row = { ...byEmail, provider, provider_id: profile.providerId };
    } else {
      const salt = newSalt();
      // No password is set for a provider account. The stored value can never
      // match a derivation, so password sign in stays closed until one is set.
      const row_: UserRow = {
        id: crypto.randomUUID(),
        email: profile.email,
        name: profile.name,
        password_hash: "provider-account",
        salt,
        iterations: ITERATIONS,
        created_at: now,
        target_band: null,
        onboarded: 0,
        provider,
        provider_id: profile.providerId,
      };
      await insertUser(db, row_);
      row = row_;
      created = true;
    }
  }

  const token = newToken();
  await insertSession(db, token, row.id, now, expiry(now, true), true);
  return { token, user: publicUser(row), created };
}

/** Accounts created by a provider have no usable password. */
export async function verifyPassword(db: D1Database, email: string, password: string): Promise<UserRow | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE email = ?1")
    .bind(email.trim().toLowerCase())
    .first<UserRow>();
  if (!row || row.password_hash === "provider-account") return null;
  const candidate = await derive(password, row.salt, row.iterations ?? ITERATIONS);
  return sameDigest(candidate, row.password_hash) ? row : null;
}
