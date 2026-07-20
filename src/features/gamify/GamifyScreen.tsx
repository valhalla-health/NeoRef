import { warm, font } from '../../theme/tokens';
import { Chip } from '../../components/ui';
import { getGamifyState, type Badge } from '../../lib/gamify';
import { CURRICULUM_LENGTH } from '../../lib/today';
import { LevelCard } from './LevelCard';
import { LeaderboardPreview } from './LeaderboardPreview';

export function GamifyScreen({ onShowLeaderboard }: { onShowLeaderboard?: () => void }) {
  const state = getGamifyState();
  const earnedCount = state.badges.filter((b) => b.earned).length;

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Your <span style={{ color: warm.terra }}>Progress</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>
          Earn XP by finishing lessons and exploring the clinical tools
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>
        <LevelCard level={state.level} streak={state.streak} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '14px 0' }}>
          <StatTile label="Lessons" value={`${state.lessonsDone}/${CURRICULUM_LENGTH}`} />
          <StatTile label="Tools tried" value={`${state.toolsUsed}/${state.totalTools}`} />
          <StatTile label="Best streak" value={`${state.streak.longest}d`} />
        </div>

        <LeaderboardPreview onShowMore={onShowLeaderboard ?? (() => {})} />

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
          Achievements · {earnedCount}/{state.badges.length}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {state.badges.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: warm.card,
        border: `1px solid ${warm.line}`,
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: font.mono, fontSize: 15, fontWeight: 700, color: warm.ink }}>{value}</div>
      <div style={{ fontSize: 9.5, color: warm.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const pct =
    badge.progress.target > 0 ? Math.round((badge.progress.current / badge.progress.target) * 100) : 100;

  return (
    <div
      style={{
        background: badge.earned ? warm.card : warm.paperDeep,
        border: `1.5px solid ${badge.earned ? warm.ochre : warm.line}`,
        borderRadius: 14,
        padding: '12px 10px',
        opacity: badge.earned ? 1 : 0.8,
      }}
    >
      <div
        style={{ fontSize: 24, marginBottom: 4, filter: badge.earned ? 'none' : 'grayscale(70%)' }}
        aria-hidden
      >
        {badge.emoji}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: warm.ink, lineHeight: 1.25 }}>{badge.title}</div>
      <div style={{ fontSize: 10, color: warm.muted, marginTop: 2, lineHeight: 1.35 }}>{badge.description}</div>

      {badge.earned ? (
        <div style={{ marginTop: 8 }}>
          <Chip tone="ochre" size={9.5}>
            ✓ Earned
          </Chip>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 4, background: warm.line, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: warm.sage, width: `${pct}%` }} />
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 9, color: warm.muted, marginTop: 3 }}>
            {badge.progress.current}/{badge.progress.target}
          </div>
        </div>
      )}
    </div>
  );
}
