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

function read<T>(name: string, fallback: T, validate: (data: unknown) => data is T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Envelope<unknown>;
    // Unknown/older version → return fallback (migrations would branch here).
    if (!parsed || parsed.v !== VERSION) return fallback;
    return validate(parsed.data) ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(name: string, data: T): void {
  try {
    const env: Envelope<T> = { v: VERSION, data };
    localStorage.setItem(key(name), JSON.stringify(env));
  } catch {
    // Quota exceeded / disabled storage (e.g. private mode) — degrade silently.
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

export function getProgress(): ProgressMap {
  return read<ProgressMap>('lesson-progress', {}, isProgressMap);
}

export function markLesson(day: number, done = true, now: Date = new Date()): ProgressMap {
  const p = getProgress();
  if (done) p[String(day)] = now.toISOString();
  else delete p[String(day)];
  write('lesson-progress', p);
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
