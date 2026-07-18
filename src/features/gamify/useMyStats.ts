import { useEffect, useState } from 'react';
import { storageKey } from '../../lib/storage';
import * as gamifyApi from './gamifyApi';
import type { StatsResponse } from './gamifyApi';

// Namespaced per signed-in account (storageKey, see storage.ts / AUDIT C-3/S-5)
// so a second account signing in on the same device doesn't briefly show the
// previous account's own points/streak/lessonsDone as "your" stats while the
// real fetch is in flight — this is private per-account data, not the shared
// leaderboard.
function readCache(): StatsResponse | null {
  try {
    const raw = localStorage.getItem(storageKey('my-stats-cache'));
    return raw ? (JSON.parse(raw) as StatsResponse) : null;
  } catch {
    return null;
  }
}

function writeCache(data: StatsResponse): void {
  try {
    localStorage.setItem(storageKey('my-stats-cache'), JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Cached snapshot shown immediately (works offline), refreshed fire-and-forget
// on mount — same pattern as LeaderboardScreen's cache.
export function useMyStats(): StatsResponse | null {
  const [stats, setStats] = useState<StatsResponse | null>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    gamifyApi
      .getMyStats()
      .then((resp) => {
        if (cancelled || gamifyApi.isErrorResponse(resp)) return;
        writeCache(resp);
        setStats(resp);
      })
      .catch(() => {
        // offline / unreachable — keep showing the cached snapshot, if any
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
