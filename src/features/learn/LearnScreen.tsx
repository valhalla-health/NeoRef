import { useMemo, useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { LESSONS, bookLabel, type Lesson } from '../../data/lessons';
import { getProgress } from '../../lib/storage';
import { setLessonDone } from '../../lib/progress';
import { myCurriculumDay } from '../../lib/today';

function matchesQuery(l: Lesson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    l.title.toLowerCase().includes(q) ||
    l.authors.toLowerCase().includes(q) ||
    bookLabel(l.book).toLowerCase().includes(q) ||
    String(l.chapter).includes(q) ||
    String(l.day).includes(q)
  );
}

export function LearnScreen({ onOpenLesson }: { onOpenLesson: (day: number) => void }) {
  const [progress, setProgress] = useState(getProgress);
  const [query, setQuery] = useState('');
  const today = myCurriculumDay();
  const visible = useMemo(() => LESSONS.filter((l) => matchesQuery(l, query)), [query]);

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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapter, author, or book…"
          aria-label="Search lessons"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: font.ui,
            color: warm.ink,
            background: warm.card,
            border: `1.5px solid ${warm.line}`,
            borderRadius: 10,
            outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', color: warm.muted, fontSize: 13, padding: '24px 0' }}>
            No lessons match &quot;{query}&quot;.
          </div>
        )}
        {visible.map((l) => {
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
