import { useEffect, useState } from 'react';
import { warm, font } from '../../theme/tokens';
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

export function LeaderboardScreen() {
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

  const showingCached = status !== 'ready' && data !== null;

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
            <span style={{ color: warm.terra }}>Leaderboard</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshToken((t) => t + 1)}
            disabled={status === 'loading'}
            aria-label="Refresh leaderboard"
            style={{
              border: `1.5px solid ${warm.line}`,
              background: warm.card,
              color: warm.terra,
              width: 30,
              height: 30,
              borderRadius: '50%',
              fontSize: 14,
              cursor: status === 'loading' ? 'default' : 'pointer',
              opacity: status === 'loading' ? 0.6 : 1,
            }}
          >
            ⟳
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>
          {data
            ? `As of ${new Date(data.asOf).toLocaleString()}${showingCached ? ' (cached)' : ''}`
            : 'Ranked by lessons completed'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {status === 'loading' && !data && (
          <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
        )}

        {status === 'error' && !data && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: warm.muted, fontSize: 13, marginBottom: 12 }}>
              Couldn&apos;t load the leaderboard. Check your connection.
            </div>
            <button
              type="button"
              onClick={() => setRefreshToken((t) => t + 1)}
              style={{
                border: `1.5px solid ${warm.terra}`,
                background: 'none',
                color: warm.terra,
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 10,
                padding: '9px 18px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {data && data.rows.length === 0 && (
          <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No completions yet — be the first!
          </div>
        )}

        {data?.rows.map((row, i) => (
          <div
            key={`${row.name}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: row.isMe ? '#EBF5E6' : warm.card,
              border: `1.5px solid ${row.isMe ? warm.sage : warm.line}`,
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: warm.muted, width: 24 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: warm.ink }}>
              {row.name}
              {row.isMe && <span style={{ color: warm.sage }}> (you)</span>}
            </span>
            <span style={{ fontSize: 11, color: warm.muted, fontFamily: font.mono }}>🔥 {row.streak}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: warm.terra, fontFamily: font.mono }}>
              {row.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
