// Typed, versioned localStorage layer.
//
// Fixes AUDIT C-6: the prototype's gas-sync.jsx parsed JSON with no schema,
// version, or migration, silently resetting to `{}` on any shape change. Here
// every store carries a schema version and validates its shape on read, so a
// future format change has an explicit upgrade path instead of silent data loss.

import { getSession } from './session';

const NS = 'neoref';
const VERSION = 1;

type Envelope<T> = { v: number; data: T };

function legacyKey(name: string): string {
  return `${NS}:${name}`;
}

// Fixes AUDIT C-3/S-5: every store below used to live under one fixed
// per-device key, so logging in as a second account on the same browser/PWA
// instantly inherited whatever the previous account had done — streak,
// progress, bookmarks, all of it. Namespacing by the signed-in email keeps
// each account's data in its own slot, and switching back to an earlier
// account on the same device recovers that account's own data instead of
// showing someone else's (or an empty slate).
//
// The first read/write for a given store after this landed migrates any
// pre-existing unnamespaced data to whichever account is currently signed
// in, then clears the legacy key — so the account that already had local
// history keeps it, but no other account can inherit it afterward.
export function storageKey(name: string): string {
  const email = getSession()?.email;
  if (!email) return legacyKey(name);

  const k = `${NS}:${email}:${name}`;
  try {
    if (localStorage.getItem(k) === null) {
      const legacyRaw = localStorage.getItem(legacyKey(name));
      if (legacyRaw !== null) {
        localStorage.setItem(k, legacyRaw);
        localStorage.removeItem(legacyKey(name));
      }
    }
  } catch {
    // best-effort only — fall through and use the namespaced key regardless
  }
  return k;
}

// Read-through cache keyed by the raw localStorage string, so getProgress()
// (and any other reader) returns the *same object reference* across calls
// when nothing changed. Required for useSyncExternalStore (useProgress.ts):
// its getSnapshot must be referentially stable, or React sees a "new" value
// on every render and spins into an infinite update loop.
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(name: string, fallback: T, validate: (data: unknown) => data is T): T {
  const k = storageKey(name);
  let raw: string | null;
  try {
    raw = localStorage.getItem(k);
  } catch {
    return fallback;
  }
  const cached = cache.get(k);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    if (!raw) {
      value = fallback;
    } else {
      const parsed = JSON.parse(raw) as Envelope<unknown>;
      // Unknown/older version → return fallback (migrations would branch here).
      value = parsed && parsed.v === VERSION && validate(parsed.data) ? parsed.data : fallback;
    }
  } catch {
    value = fallback;
  }
  cache.set(k, { raw, value });
  return value;
}

function write<T>(name: string, data: T): void {
  const k = storageKey(name);
  try {
    const env: Envelope<T> = { v: VERSION, data };
    const raw = JSON.stringify(env);
    localStorage.setItem(k, raw);
    cache.set(k, { raw, value: data });
  } catch {
    // Quota exceeded / disabled storage (e.g. private mode) — degrade silently,
    // and drop any cached entry so a later successful read isn't served stale data.
    cache.delete(k);
  }
}

// ─── Lesson progress: { [dayNumber: string]: ISO timestamp } ──────────────
export type ProgressMap = Record<string, string>;

function isProgressMap(x: unknown): x is ProgressMap {
  return (
    typeof x === 'object' &&
    x !== null &&
    !Array.isArray(x) &&
    Object.values(x as Record<string, unknown>).every((v) => typeof v === 'string')
  );
}

// Progress listeners — lets useProgress() (useProgress.ts) re-render every
// screen showing "done" state the moment any write happens here, including
// a server-pulled merge landing asynchronously after the screen mounted.
const progressListeners = new Set<() => void>();

function notifyProgressChanged(): void {
  progressListeners.forEach((l) => l());
}

export function subscribeProgress(listener: () => void): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function getProgress(): ProgressMap {
  return read<ProgressMap>('lesson-progress', {}, isProgressMap);
}

// Bulk overwrite — used to land a server-pulled merge (see useProgress.ts).
export function setProgress(map: ProgressMap): void {
  write('lesson-progress', map);
  notifyProgressChanged();
}

export function markLesson(day: number, done = true, now: Date = new Date()): ProgressMap {
  // Copy rather than mutate the cached object in place — write() re-caches
  // by reference, and a same-reference "update" would look like no change
  // to useSyncExternalStore's Object.is comparison (see cache comment above).
  const p = { ...getProgress() };
  if (done) p[String(day)] = now.toISOString();
  else delete p[String(day)];
  write('lesson-progress', p);
  notifyProgressChanged();
  return p;
}

export function isLessonDone(day: number): boolean {
  return Boolean(getProgress()[String(day)]);
}

// ─── Activity log: { [YYYY-MM-DD]: ISO timestamp of that day's first activity } ─
// Feeds the streak (gamify.ts) independently of lesson completion: opening a
// lesson to read it, or opening a clinical tool, both count as "showing up"
// for the day, even on a day where nothing gets marked done.
export type ActivityMap = Record<string, string>;

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getActivityLog(): ActivityMap {
  return read<ActivityMap>('activity-log', {}, isProgressMap);
}

/** Marks today as active. Idempotent per calendar day — cheap to call from every lesson/tool open. */
export function recordActivity(now: Date = new Date()): void {
  const k = localDateKey(now);
  const log = getActivityLog();
  if (log[k]) return;
  write('activity-log', { ...log, [k]: now.toISOString() });
}

// ─── Bookmarks: { [id: string]: ISO timestamp } ───────────────────────────
export type BookmarkMap = Record<string, string>;

// Same reactive-listener pattern as lesson progress above — lets useBookmarks()
// (useBookmarks.ts) re-render every screen showing a bookmark's star state the
// moment any other screen toggles it.
const bookmarkListeners = new Set<() => void>();

function notifyBookmarksChanged(): void {
  bookmarkListeners.forEach((l) => l());
}

export function subscribeBookmarks(listener: () => void): () => void {
  bookmarkListeners.add(listener);
  return () => bookmarkListeners.delete(listener);
}

export function getBookmarks(): BookmarkMap {
  return read<BookmarkMap>('bookmarks', {}, isProgressMap);
}

// Bulk overwrite — used to land a server-pulled merge (see bookmarks.ts),
// same role as setProgress() above.
export function setBookmarks(map: BookmarkMap): void {
  write('bookmarks', map);
  notifyBookmarksChanged();
}

export function setBookmarkState(id: string, bookmarked: boolean, now: Date = new Date()): BookmarkMap {
  const b = { ...getBookmarks() };
  if (bookmarked) b[id] = now.toISOString();
  else delete b[id];
  write('bookmarks', b);
  notifyBookmarksChanged();
  return b;
}

export function toggleBookmark(id: string, now: Date = new Date()): boolean {
  const bookmarked = !isBookmarked(id);
  setBookmarkState(id, bookmarked, now);
  return bookmarked;
}

export function isBookmarked(id: string): boolean {
  return Boolean(getBookmarks()[id]);
}

// ─── Lesson font scale: 1 (normal) | 2 | 3 | 4 — reading zoom level ────────
export type FontScale = 1 | 2 | 3 | 4;

function isFontScale(x: unknown): x is FontScale {
  return x === 1 || x === 2 || x === 3 || x === 4;
}

export function getFontScale(): FontScale {
  return read<FontScale>('lesson-font-scale', 1, isFontScale);
}

export function setFontScale(scale: FontScale): void {
  write('lesson-font-scale', scale);
}

// ─── Tool usage: { [calcId: string]: ISO timestamp of first open } ────────
export type ToolUsageMap = Record<string, string>;

export function getToolUsage(): ToolUsageMap {
  return read<ToolUsageMap>('tool-usage', {}, isProgressMap);
}

/** Records the first time a tool is opened; later opens are no-ops. */
export function recordToolOpen(id: string, now: Date = new Date()): ToolUsageMap {
  const u = getToolUsage();
  if (!u[id]) {
    u[id] = now.toISOString();
    write('tool-usage', u);
  }
  return u;
}
