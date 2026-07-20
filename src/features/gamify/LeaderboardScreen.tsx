import { warm, font } from '../../theme/tokens';
import { useLeaderboard } from './useLeaderboard';
import { LeaderboardRow } from './LeaderboardRow';

// Full leaderboard. No longer a bottom-nav tab — reached via "Show more" on
// the top-3 preview in the Progress tab, so it takes an `onBack` to return
// there instead of switching tabs itself.
export function LeaderboardScreen({ onBack }: { onBack?: () => void }) {
  const { status, data, refresh } = useLeaderboard();

  const showingCached = status !== 'ready' && data !== null;

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'none',
              color: warm.terra,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 8,
            }}
          >
            ‹ Progress
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
            <span style={{ color: warm.terra }}>Leaderboard</span>
          </div>
          <button
            type="button"
            onClick={refresh}
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
              onClick={refresh}
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
          <LeaderboardRow key={`${row.name}-${i}`} row={row} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
