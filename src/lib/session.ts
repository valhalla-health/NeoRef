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
