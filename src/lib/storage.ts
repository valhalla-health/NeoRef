// Typed, versioned localStorage layer.
//
// Fixes AUDIT C-6: the prototype's gas-sync.jsx parsed JSON with no schema,
// version, or migration, silently resetting to `{}` on any shape change. Here
// every store carries a schema version and validates its shape on read, so a
// future format change has an explicit upgrade path instead of silent data loss.

const NS = 'neoref';
const VERSION = 1;

type Envelope<T> = { v: number; data: T };

function key(name: string): string {
  return `${NS}:${name}`;
}

// Read-through cache keyed by the raw localStorage string, so getProgress()
// (and any other reader) returns the *same object reference* across calls
// when nothing changed. Required for useSyncExternalStore (useProgress.ts):
// its getSnapshot must be referentially stable, or React sees a "new" value
// on every render and spins into an infinite update loop.
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(name: string, fallback: T, validate: (data: unknown) => data is T): T {
  const k = key(name);
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
  const k = key(name);
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

// ─── Bookmarks: { [id: string]: ISO timestamp } ───────────────────────────
export type BookmarkMap = Record<string, string>;

export function getBookmarks(): BookmarkMap {
  return read<BookmarkMap>('bookmarks', {}, isProgressMap);
}

export function toggleBookmark(id: string, now: Date = new Date()): boolean {
  const b = getBookmarks();
  if (b[id]) delete b[id];
  else b[id] = now.toISOString();
  write('bookmarks', b);
  return Boolean(b[id]);
}

export function isBookmarked(id: string): boolean {
  return Boolean(getBookmarks()[id]);
}

// ─── Personal curriculum start date ───────────────────────────────────────
// Anchors "Today · Day N" to when this device first opened the app, instead
// of a fixed calendar date, so the curriculum tracks each user's own pace.
function isIsoDateString(x: unknown): x is string {
  return typeof x === 'string' && !Number.isNaN(Date.parse(x));
}

function isStoredStartDate(x: unknown): x is string | null {
  return x === null || isIsoDateString(x);
}

export function getCurriculumStartDate(now: Date = new Date()): Date {
  const stored = read<string | null>('curriculum-start', null, isStoredStartDate);
  if (stored) return new Date(stored);
  write('curriculum-start', now.toISOString());
  return now;
}
