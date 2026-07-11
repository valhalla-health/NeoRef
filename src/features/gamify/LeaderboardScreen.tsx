import { useEffect, useState } from 'react';
import { warm, font } from '../../theme/tokens';
import * as gamifyApi from './gamifyApi';
import type { LeaderboardResponse } from './gamifyApi';

const CACHE_KEY = 'neoref:leaderboard-cache';

function readCache(): LeaderboardResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardResponse) : null;
  } catch {
    return null;
  }
}

function writeCache(data: LeaderboardResponse): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function LeaderboardScreen() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<LeaderboardResponse | null>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    gamifyApi
      .getLeaderboard()
      .then((resp) => {
        if (cancelled) return;
        if (gamifyApi.isErrorResponse(resp)) {
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
  }, []);

  const showingCached = status !== 'ready' && data !== null;

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          <span style={{ color: warm.terra }}>Leaderboard</span>
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
          <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Couldn&apos;t load the leaderboard. Check your connection.
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
