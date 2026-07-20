import { warm, font } from '../../theme/tokens';
import type { LeaderboardRow as Row } from './gamifyApi';

export function LeaderboardRow({ row, rank }: { row: Row; rank: number }) {
  return (
    <div
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
        {rank}
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
  );
}
