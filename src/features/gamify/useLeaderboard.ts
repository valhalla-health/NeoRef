import { useEffect, useState, useCallback } from 'react';
import { notifyUnauthorized } from '../../lib/session';
import { storageKey } from '../../lib/storage';
import * as gamifyApi from './gamifyApi';
import type { LeaderboardResponse } from './gamifyApi';

// Namespaced per signed-in account (storageKey, see storage.ts / AUDIT C-3/S-5)
// so a second account signing in on the same device doesn't briefly render
// the previous account's cached `isMe` row as its own while the real fetch
// is in flight.
function readCache(): LeaderboardResponse | null {
  try {
    const raw = localStorage.getItem(storageKey('leaderboard-cache'));
    return raw ? (JSON.parse(raw) as LeaderboardResponse) : null;
  } catch {
    return null;
  }
}

function writeCache(data: LeaderboardResponse): void {
  try {
    localStorage.setItem(storageKey('leaderboard-cache'), JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Shared fetch/cache logic behind the full LeaderboardScreen and the
// top-3 preview embedded in the Progress tab, so both stay in sync instead
// of drifting into two copies of the same request/cache dance.
export function useLeaderboard() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<LeaderboardResponse | null>(() => readCache());
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus((s) => (s === 'error' ? 'loading' : s));
    gamifyApi
      .getLeaderboard()
      .then((resp) => {
        if (cancelled) return;
        if (gamifyApi.isErrorResponse(resp)) {
          if (resp.error === 'Unauthorized') notifyUnauthorized();
          setStatus('error');
          return;
        }
        writeCache(resp);
        setData(resp);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { status, data, refresh };
}
