import { warm, font } from '../../theme/tokens';
import { DisclaimerBanner } from '../../components/Disclaimer';
import { resumeDay, CURRICULUM_LENGTH } from '../../lib/today';
import { getProgress } from '../../lib/storage';
import { getGamifyState } from '../../lib/gamify';
import { lessonForDay } from '../../data/lessons';
import { CALCS } from '../../data/calcs';
import { LevelCard } from '../gamify/LevelCard';

export function HomeScreen({
  onOpenCalc,
  onOpenLearn,
  onOpenLesson,
  onOpenProgress,
}: {
  onOpenCalc: (id: string) => void;
  onOpenLearn: () => void;
  onOpenLesson: (day: number) => void;
  onOpenProgress: () => void;
}) {
  const progress = getProgress();
  const today = resumeDay(progress); // resumes from the learner's own progress, not the calendar
  const doneCount = Object.keys(progress).length;
  const pct = Math.round((doneCount / CURRICULUM_LENGTH) * 100);
  const lesson = lessonForDay(today);
  const lessonDone = Boolean(progress[String(lesson.day)]);
  // lessonForDay falls back to the nearest earlier lesson once the curriculum
  // day outruns the authored lesson dataset — label it honestly so the header
  // never claims to show content for a day it isn't.
  const isExactMatch = lesson.day === today;
  const quickCalcs = CALCS.slice(0, 6);
  const gamify = getGamifyState();

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Newborn <span style={{ color: warm.terra }}>In-Hand</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginBottom: 12 }}>
          KCMH · Thai CPG
        </div>

        <div style={{ marginBottom: 16 }}>
          <LevelCard level={gamify.level} streak={gamify.streak} compact onClick={onOpenProgress} />
        </div>

        {/* Today's lesson */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: warm.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {isExactMatch ? `Today · Day ${today}` : `Latest lesson · Day ${lesson.day}`}
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
                Day {lesson.day} · Ch {lesson.chapter} · {lesson.book}
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

        <DisclaimerBanner muted />

        <div style={{ textAlign: 'center', padding: '0 0 24px', color: warm.muted, fontSize: 11, fontFamily: font.mono }}>
          Newborn In-Hand · v2.0 · 2026
        </div>
      </div>
    </div>
  );
}
