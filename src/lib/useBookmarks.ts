// Reactive bookmark read, plus a one-shot pull-and-merge from the GAS
// backend on mount — same wiring as useProgress.ts. Bookmarks used to be a
// purely local "read later" list with nothing to pull/merge; that's the
// multi-device gap the user hit ("saved, changed device, no data"). bookmarks.ts
// now pushes every toggle to the server, so this pulls it back down the same
// way useProgress.ts does for lesson completions.
//
// Merge is additive and local-wins, same rationale as useProgress.ts: an id
// the server has bookmarked but this device doesn't gets filled in (the
// point — recover bookmarks from elsewhere). An id already bookmarked
// locally is left untouched, so an unflushed offline toggle (still sitting
// in bookmarks.ts's outbox) never gets clobbered by a stale server response.

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { getBookmarks, setBookmarks, subscribeBookmarks, type BookmarkMap } from './storage';
import { notifyUnauthorized } from './session';
import * as gamifyApi from '../features/gamify/gamifyApi';

export function useBookmarks(): BookmarkMap {
  const bookmarks = useSyncExternalStore(subscribeBookmarks, getBookmarks, getBookmarks);

  useEffect(() => {
    let cancelled = false;
    gamifyApi
      .getMyBookmarks()
      .then((resp) => {
        if (cancelled) return;
        if (gamifyApi.isErrorResponse(resp)) {
          if (resp.error === 'Unauthorized') notifyUnauthorized();
          return;
        }
        const merged = { ...getBookmarks() };
        let changed = false;
        for (const row of resp.rows) {
          if (row.bookmarked && !merged[row.id]) {
            merged[row.id] = row.firstBookmarkedAt;
            changed = true;
          }
        }
        if (changed) setBookmarks(merged);
      })
      .catch(() => {
        // offline / unreachable — keep showing the local snapshot
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return bookmarks;
}
