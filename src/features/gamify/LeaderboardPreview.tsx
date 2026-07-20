import { warm, font } from '../../theme/tokens';
import { useLeaderboard } from './useLeaderboard';
import { LeaderboardRow } from './LeaderboardRow';

// Top-3 snapshot embedded in the Progress tab. "Show more" hands off to the
// full LeaderboardScreen (see App.tsx's leaderboardOpen state) instead of
// this owning its own drill-down.
export function LeaderboardPreview({ onShowMore }: { onShowMore: () => void }) {
  const { status, data } = useLeaderboard();
  const rows = data?.rows.slice(0, 3) ?? [];

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: warm.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        Leaderboard
      </div>

      {status === 'loading' && !data && (
        <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Loading…</div>
      )}

      {status === 'error' && !data && (
        <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Couldn&apos;t load the leaderboard.
        </div>
      )}

      {data && rows.length === 0 && (
        <div style={{ color: warm.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          No completions yet — be the first!
        </div>
      )}

      {rows.length > 0 && (
        <div
          style={{
            border: `1px solid ${warm.line}`,
            borderRadius: 12,
            overflow: 'hidden',
            background: warm.card,
          }}
        >
          {rows.map((row, i) => (
            <LeaderboardRow
              key={`${row.name}-${i}`}
              row={row}
              rank={i + 1}
              compact
              isLast={i === rows.length - 1}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onShowMore}
        style={{
          width: '100%',
          marginTop: 8,
          border: `1.5px solid ${warm.line}`,
          background: warm.card,
          color: warm.terra,
          fontWeight: 700,
          fontSize: 12.5,
          borderRadius: 10,
          padding: '9px 0',
          cursor: 'pointer',
          fontFamily: font.ui,
        }}
      >
        Show more ▾
      </button>
    </div>
  );
}
