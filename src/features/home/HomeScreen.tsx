import { useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { DisclaimerBanner } from '../../components/Disclaimer';
import { myCurriculumDay, CURRICULUM_LENGTH } from '../../lib/today';
import { useProgress } from '../../lib/useProgress';
import { lessonForDay } from '../../data/lessons';
import { CALCS } from '../../data/calcs';
import { useMyStats } from '../gamify/useMyStats';
import { useAuth } from '../auth/AuthContext';

export function HomeScreen({
  onOpenCalc,
  onOpenLearn,
  onOpenLesson,
}: {
  onOpenCalc: (id: string) => void;
  onOpenLearn: () => void;
  onOpenLesson: (day: number) => void;
}) {
  const today = myCurriculumDay(); // real clock, anchored to this device's own start date — fixes C-1
  const progress = useProgress();
  const doneCount = Object.keys(progress).length;
  const pct = Math.round((doneCount / CURRICULUM_LENGTH) * 100);
  const lesson = lessonForDay(today);
  const lessonDone = Boolean(progress[String(lesson.day)]);
  const quickCalcs = CALCS.slice(0, 6);
  const stats = useMyStats();
  const { user } = useAuth();

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
              Newborn <span style={{ color: warm.terra }}>In-Hand</span>
            </div>
            <div style={{ fontSize: 12.5, color: warm.muted, marginBottom: 12 }}>
              KCMH · Thai CPG
            </div>
          </div>
          {user && <NameBadge name={user.name || user.email} />}
        </div>

        {/* Today's lesson */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: warm.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Today · Day {today}
          </div>
          <button
            type="button"
            onClick={() => onOpenLesson(lesson.day)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: lessonDone ? '#EBF5E6' : warm.card,
              border: `1.5px solid ${lessonDone ? warm.sage : warm.line}`,
              borderRadius: 16,
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: font.ui,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: warm.muted }}>
                Ch {lesson.chapter} · {lesson.book}
              </span>
              {lessonDone && (
                <span style={{ background: warm.sage, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                  ✓ Done
                </span>
              )}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: warm.ink, lineHeight: 1.3, marginBottom: 6 }}>
              {lesson.title}
            </div>
            <div style={{ fontSize: 12, color: warm.muted, fontStyle: 'italic' }}>{lesson.authors}</div>
          </button>
          <button
            type="button"
            onClick={onOpenLearn}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'right',
              border: 'none',
              background: 'none',
              color: warm.terra,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 2px 0',
              fontFamily: font.ui,
            }}
          >
            See all lessons →
          </button>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 18, background: warm.card, border: `1px solid ${warm.line}`, borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: warm.ink }}>Curriculum progress</span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: warm.muted }}>
              {doneCount}/{CURRICULUM_LENGTH} · {pct}%
            </span>
          </div>
          <div style={{ height: 5, background: warm.line, borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, background: warm.sage, width: `${pct}%` }} />
          </div>
        </div>

        {/* Streak / points */}
        {stats && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div
              style={{
                flex: 1,
                background: warm.card,
                border: `1px solid ${warm.line}`,
                borderRadius: 12,
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: warm.terra, fontFamily: font.mono }}>
                🔥 {stats.streak}
              </div>
              <div style={{ fontSize: 10, color: warm.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                day streak
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: warm.card,
                border: `1px solid ${warm.line}`,
                borderRadius: 12,
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: warm.sage, fontFamily: font.mono }}>
                {stats.points} pts
              </div>
              <div style={{ fontSize: 10, color: warm.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                points
              </div>
            </div>
          </div>
        )}

        {/* Quick tools */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: warm.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Quick Tools
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {quickCalcs.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={!c.ported}
                onClick={() => c.ported && onOpenCalc(c.id)}
                style={{
                  background: warm.card,
                  border: `1.5px solid ${warm.line}`,
                  borderRadius: 12,
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: c.ported ? 'pointer' : 'default',
                  opacity: c.ported ? 1 : 0.55,
                  fontFamily: font.ui,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }} aria-hidden>
                  {c.emoji}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: warm.ink, lineHeight: 1.2 }}>{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        <DisclaimerBanner subtle />

        <div style={{ textAlign: 'center', padding: '0 0 24px', color: warm.muted, fontSize: 11, fontFamily: font.mono }}>
          Newborn In-Hand · v2.0 · 2026
        </div>
      </div>
    </div>
  );
}

// Tap-to-rename badge — the name shown here also drives the row label on
// the leaderboard (LeaderboardScreen.tsx), so saving round-trips through
// the GAS backend (AuthContext.updateName) instead of just editing locally.
function NameBadge({ name }: { name: string }) {
  const { updateName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(name);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    if (draft.trim() === name.trim()) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updateName(draft);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        aria-label="Edit your name"
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: font.head,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: -0.4,
          color: warm.terra,
          whiteSpace: 'nowrap',
        }}
      >
        {name} <span style={{ fontSize: 13 }} aria-hidden>✎</span>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={draft}
          autoFocus
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') cancel();
          }}
          aria-label="Your name"
          style={{
            width: 130,
            fontFamily: font.head,
            fontSize: 14,
            fontWeight: 700,
            color: warm.ink,
            background: warm.card,
            border: `1.5px solid ${warm.terra}`,
            borderRadius: 8,
            padding: '4px 8px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          aria-label="Save name"
          style={{
            border: 'none',
            background: warm.sage,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 999,
            width: 24,
            height: 24,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          ✓
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          aria-label="Cancel"
          style={{
            border: 'none',
            background: 'none',
            color: warm.muted,
            fontSize: 12,
            fontWeight: 700,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      {error && (
        <div style={{ fontSize: 10.5, color: warm.warn, maxWidth: 180, textAlign: 'right' }}>{error}</div>
      )}
    </div>
  );
}
