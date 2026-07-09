import { useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { AVERY_LESSONS } from '../../data/lessons';
import { getProgress, markLesson } from '../../lib/storage';
import { curriculumDay } from '../../lib/today';

export function LearnScreen() {
  const [progress, setProgress] = useState(getProgress);
  const today = curriculumDay();

  function toggle(day: number) {
    const done = !progress[String(day)];
    setProgress({ ...markLesson(day, done) });
  }

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Daily <span style={{ color: warm.terra }}>Lessons</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>Avery 11th ed. · tap to mark done</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {AVERY_LESSONS.map((l) => {
          const done = Boolean(progress[String(l.d)]);
          const isToday = l.d === today;
          return (
            <button
              key={l.d}
              type="button"
              aria-pressed={done}
              onClick={() => toggle(l.d)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: done ? '#EBF5E6' : warm.card,
                border: `1.5px solid ${isToday ? warm.terra : done ? warm.sage : warm.line}`,
                borderRadius: 12,
                padding: '11px 14px',
                marginBottom: 8,
                cursor: 'pointer',
                fontFamily: font.ui,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: font.mono, fontSize: 10.5, color: warm.muted }}>
                  Day {l.d} · Ch {l.ch}
                </span>
                <span style={{ fontSize: 13 }} aria-hidden>
                  {done ? '✓' : '○'}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: warm.ink, marginTop: 3, lineHeight: 1.25 }}>
                {l.t}
              </div>
              <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2, fontStyle: 'italic' }}>{l.hook}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
