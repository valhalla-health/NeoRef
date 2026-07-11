import { useMemo, useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { LESSONS, bookLabel, type Lesson } from '../../data/lessons';
import { getProgress } from '../../lib/storage';
import { setLessonDone } from '../../lib/progress';
import { resumeDay } from '../../lib/today';
import { searchLessons } from '../../lib/lessonSearch';

export function LearnScreen({ onOpenLesson }: { onOpenLesson: (day: number) => void }) {
  const [progress, setProgress] = useState(getProgress);
  const [query, setQuery] = useState('');
  const today = resumeDay(progress);

  const results: Lesson[] = useMemo(() => searchLessons(LESSONS, query), [query]);

  function toggleDone(day: number, e: React.MouseEvent) {
    e.stopPropagation();
    const done = !progress[String(day)];
    setProgress({ ...setLessonDone(day, done) });
  }

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Daily <span style={{ color: warm.terra }}>Lessons</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4, marginBottom: 10 }}>
          Avery 11th ed. + Fanaroff 12th ed. + The Newborn Lung 3rd ed. · tap to read, checkmark to mark done
        </div>

        <div style={{ position: 'relative' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              color: warm.muted,
            }}
          >
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters, topics, or authors…"
            aria-label="Search lessons"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px 9px 32px',
              borderRadius: 10,
              border: `1.5px solid ${warm.line}`,
              background: warm.card,
              color: warm.ink,
              fontFamily: font.ui,
              fontSize: 13.5,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', color: warm.muted, fontSize: 13, marginTop: 24, fontFamily: font.ui }}>
            No lessons match “{query}”.
          </div>
        )}
        {results.map((l) => {
          const done = Boolean(progress[String(l.day)]);
          const isToday = l.day === today;
          return (
            <button
              key={l.day}
              type="button"
              onClick={() => onOpenLesson(l.day)}
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
                  Day {l.day} · {bookLabel(l.book)} Ch {l.chapter}
                </span>
                <span
                  role="checkbox"
                  aria-checked={done}
                  aria-label={done ? 'Mark not done' : 'Mark done'}
                  onClick={(e) => toggleDone(l.day, e)}
                  style={{ fontSize: 15, cursor: 'pointer', padding: 2 }}
                >
                  {done ? '✓' : '○'}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: warm.ink, marginTop: 3, lineHeight: 1.25 }}>
                {l.title}
              </div>
              <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2, fontStyle: 'italic' }}>{l.authors}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
