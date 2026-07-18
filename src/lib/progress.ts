// Single choke point for marking a lesson done/undone: updates local storage
// (storage.ts, unchanged) and fire-and-forget syncs the event to the GAS
// gamification backend. If that call fails (offline, expired session), the
// event is queued in a small localStorage outbox and flushed opportunistically
// instead of silently dropped — otherwise every completion logged while
// offline (the whole point of this being a PWA) would just vanish from the
// leaderboard/streak.

import { markLesson, storageKey, type ProgressMap } from './storage';
import * as gamifyApi from '../features/gamify/gamifyApi';

interface PendingEvent {
  day: number;
  done: boolean;
}

// Resolved fresh on every call (not cached in a module-level const): it must
// track whichever account is currently signed in, same as storage.ts's other
// stores, so one account's queued offline completions never sync under (or
// leak into) another account sharing the device.
function outboxKey(): string {
  return storageKey('gamify-pending');
}

function readOutbox(): PendingEvent[] {
  try {
    const raw = localStorage.getItem(outboxKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PendingEvent[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(events: PendingEvent[]): void {
  try {
    localStorage.setItem(outboxKey(), JSON.stringify(events));
  } catch {
    // ignore — best-effort only
  }
}

function enqueue(event: PendingEvent): void {
  const events = readOutbox();
  events.push(event);
  writeOutbox(events);
}

let flushing = false;

export async function flushGamifyOutbox(): Promise<void> {
  if (flushing) return;
  const pending = readOutbox();
  if (pending.length === 0) return;
  flushing = true;
  try {
    const remaining: PendingEvent[] = [];
    for (const event of pending) {
      try {
        const resp = await gamifyApi.logLessonDone(event.day, event.done);
        if (gamifyApi.isErrorResponse(resp)) remaining.push(event);
      } catch {
        remaining.push(event);
      }
    }
    writeOutbox(remaining);
  } finally {
    flushing = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushGamifyOutbox();
  });
}

export function setLessonDone(day: number, done: boolean): ProgressMap {
  const progress = markLesson(day, done);
  void (async () => {
    try {
      const resp = await gamifyApi.logLessonDone(day, done);
      if (gamifyApi.isErrorResponse(resp)) {
        enqueue({ day, done });
      } else {
        void flushGamifyOutbox(); // opportunistically drain any older backlog too
      }
    } catch {
      enqueue({ day, done });
    }
  })();
  return progress;
}
