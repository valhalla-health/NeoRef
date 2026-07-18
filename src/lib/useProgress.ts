// Reactive lesson-progress read, plus a one-shot pull-and-merge from the GAS
// backend on mount. Fixes AUDIT C-3: `setLessonDone` (progress.ts) already
// pushes every completion to the server, but nothing ever pulled it back
// down — so a second device (or a reinstall) showed 0 done lessons even
// though the backend had the full history. `getMyCompletions` already
// existed for this; it just had no caller.
//
// Merge is additive and local-wins: a day the server has as done but this
// device doesn't gets filled in (the whole point — recover progress from
// elsewhere). A day already marked locally is left untouched, so an
// unflushed offline completion (still sitting in progress.ts's outbox)
// never gets clobbered by a stale server response.

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { getProgress, setProgress, subscribeProgress, type ProgressMap } from './storage';
import { notifyUnauthorized } from './session';
import * as gamifyApi from '../features/gamify/gamifyApi';

export function useProgress(): ProgressMap {
  const progress = useSyncExternalStore(subscribeProgress, getProgress, getProgress);

  useEffect(() => {
    let cancelled = false;
    gamifyApi
      .getMyCompletions()
      .then((resp) => {
        if (cancelled) return;
        if (gamifyApi.isErrorResponse(resp)) {
          if (resp.error === 'Unauthorized') notifyUnauthorized();
          return;
        }
        const merged = { ...getProgress() };
        let changed = false;
        for (const row of resp.rows) {
          const day = String(row.day);
          if (row.done && !merged[day]) {
            merged[day] = row.firstCompletedAt;
            changed = true;
          }
        }
        if (changed) setProgress(merged);
      })
      .catch(() => {
        // offline / unreachable — keep showing the local snapshot
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return progress;
}
