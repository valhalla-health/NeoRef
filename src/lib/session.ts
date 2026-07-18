// Typed, versioned localStorage layer for the signed-in session — same
// envelope convention as storage.ts. localStorage (not sessionStorage):
// NeoRef is an installed PWA reopened across days, not a single-shift
// browser tab, so the session should survive closing the app.

const KEY = 'neoref:session';
const VERSION = 1;

export interface Session {
  email: string;
  name: string;
  role: string;
  token: string;
  /** False for Google-only accounts, which have no password_hash to change. */
  hasPassword: boolean;
}

type Envelope<T> = { v: number; data: T };

function isSession(x: unknown): x is Session {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.email === 'string' &&
    typeof s.name === 'string' &&
    typeof s.role === 'string' &&
    typeof s.token === 'string' &&
    typeof s.hasPassword === 'boolean'
  );
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<unknown>;
    if (!parsed || parsed.v !== VERSION) return null;
    return isSession(parsed.data) ? parsed.data : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  try {
    const env: Envelope<Session> = { v: VERSION, data: session };
    localStorage.setItem(KEY, JSON.stringify(env));
  } catch {
    // Quota exceeded / disabled storage (e.g. private mode) — degrade silently.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

const UNAUTHORIZED_EVENT = 'neoref:unauthorized';

// Bridges an expired/invalid session token back to AuthContext (mounted once
// at the app root, see main.tsx) from call sites that aren't React
// components/hooks and so can't call useAuth().handleUnauthorized() directly
// — e.g. progress.ts's fire-and-forget outbox flush. Hook-based call sites
// (useMyStats, useProgress, LeaderboardScreen) use the same event for
// consistency, so there's exactly one path from "backend said Unauthorized"
// to "sign the user out."
export function notifyUnauthorized(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function onUnauthorized(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(UNAUTHORIZED_EVENT, listener);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, listener);
}
