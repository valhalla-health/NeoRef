// Sync wrapper for bookmarks, mirroring progress.ts's push side exactly:
// updates local storage (storage.ts, unchanged) and fire-and-forget syncs
// the event to the GAS backend. Bookmarks used to be purely local ("no
// server round-trip" per the old comment on useBookmarks.ts) — that's the
// same gap AUDIT C-3 flagged for progress, just never ported over here: a
// bookmark set on one device silently didn't exist on any other device or
// after a reinstall. Same fix, same shape: a small localStorage outbox so a
// toggle made offline isn't lost, flushed opportunistically and on 'online'.

import { setBookmarkState, storageKey, type BookmarkMap } from './storage';
import { notifyUnauthorized } from './session';
import * as gamifyApi from '../features/gamify/gamifyApi';

interface PendingEvent {
  id: string;
  bookmarked: boolean;
}

// Resolved fresh on every call, same reasoning as progress.ts's outboxKey():
// must track whichever account is currently signed in.
function outboxKey(): string {
  return storageKey('bookmark-pending');
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

export async function flushBookmarkOutbox(): Promise<void> {
  if (flushing) return;
  const pending = readOutbox();
  if (pending.length === 0) return;
  flushing = true;
  try {
    const remaining: PendingEvent[] = [];
    for (const event of pending) {
      try {
        const resp = await gamifyApi.logBookmark(event.id, event.bookmarked);
        if (gamifyApi.isErrorResponse(resp)) {
          if (resp.error === 'Unauthorized') notifyUnauthorized();
          remaining.push(event);
        }
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
    void flushBookmarkOutbox();
  });
}

export function setBookmark(id: string, bookmarked: boolean): BookmarkMap {
  const bookmarks = setBookmarkState(id, bookmarked);
  void (async () => {
    try {
      const resp = await gamifyApi.logBookmark(id, bookmarked);
      if (gamifyApi.isErrorResponse(resp)) {
        if (resp.error === 'Unauthorized') notifyUnauthorized();
        enqueue({ id, bookmarked });
      } else {
        void flushBookmarkOutbox(); // opportunistically drain any older backlog too
      }
    } catch {
      enqueue({ id, bookmarked });
    }
  })();
  return bookmarks;
}
