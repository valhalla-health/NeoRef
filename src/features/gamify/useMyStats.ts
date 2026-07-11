import { useEffect, useState } from 'react';
import * as gamifyApi from './gamifyApi';
import type { StatsResponse } from './gamifyApi';

const CACHE_KEY = 'neoref:my-stats-cache';

function readCache(): StatsResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StatsResponse) : null;
  } catch {
    return null;
  }
}

function writeCache(data: StatsResponse): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
