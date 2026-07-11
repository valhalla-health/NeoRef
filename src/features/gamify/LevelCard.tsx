// Level/streak summary — shared between the Home screen (compact teaser)
// and the full Progress screen so the visual language stays in one place.

import { warm, font } from '../../theme/tokens';
import type { LevelInfo, StreakInfo } from '../../lib/gamify';

export function LevelCard({
  level,
  streak,
  compact = false,
  onClick,
}: {
  level: LevelInfo;
  streak: StreakInfo;
  compact?: boolean;
  onClick?: () => void;
}) {
  const pct = Math.round(level.progress * 100);
  const badgeSize = compact ? 42 : 56;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        background: `linear-gradient(135deg, ${warm.card}, ${warm.paperDeep})`,
        border: `1.5px solid ${warm.line}`,
        borderRadius: 16,
        padding: compact ? '12px 14px' : '16px',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: font.ui,
      }}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          background: warm.terra,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font.head,
          fontWeight: 800,
          fontSize: compact ? 16 : 20,
          boxShadow: `0 0 0 3px ${warm.paper}, 0 0 0 4.5px rgba(192,89,58,0.35)`,
        }}
      >
        {level.level}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: compact ? 13 : 15.5, fontWeight: 700, color: warm.ink }}>{level.title}</span>
          <span style={{ fontFamily: font.mono, fontSize: 10.5, color: warm.muted, whiteSpace: 'nowrap' }}>
            {level.xpForNextLevel === 0 ? `${level.xp} XP` : `${level.xpIntoLevel}/${level.xpForNextLevel} XP`}
          </span>
        </div>
        <div style={{ height: 5, background: warm.line, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              background: warm.terra,
              width: `${pct}%`,
              transition: 'width 400ms ease',
            }}
          />
        </div>
        {streak.current > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: warm.ochre, fontWeight: 700 }}>
            🔥 {streak.current}-day streak
          </div>
        )}
      </div>
    </button>
  );
}
