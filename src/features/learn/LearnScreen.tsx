import { useMemo, useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { LESSONS, bookLabel, type Lesson } from '../../data/lessons';
import { useProgress } from '../../lib/useProgress';
import { setLessonDone } from '../../lib/progress';
import { useBookmarks } from '../../lib/useBookmarks';
import { toggleBookmark } from '../../lib/storage';
import { lessonBookmarkId } from '../../lib/bookmarkIds';
import { resumeDay } from '../../lib/today';
import { searchLessons } from '../../lib/lessonSearch';

type BookFilter = Lesson['book'] | 'all';

const BOOK_TABS: Array<{ id: BookFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'Avery', label: bookLabel('Avery') },
  { id: 'Fanaroff', label: bookLabel('Fanaroff') },
  { id: 'NewbornLung', label: bookLabel('NewbornLung') },
  { id: 'Pimolrat', label: bookLabel('Pimolrat') },
];

export function LearnScreen({ onOpenLesson }: { onOpenLesson: (day: number) => void }) {
  const progress = useProgress();
  const bookmarks = useBookmarks();
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookFilter, setBookFilter] = useState<BookFilter>('all');
  const today = resumeDay(progress);

  const searched: Lesson[] = useMemo(() => searchLessons(LESSONS, query), [query]);
  const byBook = bookFilter === 'all' ? searched : searched.filter((l) => l.book === bookFilter);
  const results = savedOnly ? byBook.filter((l) => bookmarks[lessonBookmarkId(l.day)]) : byBook;

  function toggleDone(day: number) {
    setLessonDone(day, !progress[String(day)]);
  }

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Daily <span style={{ color: warm.terra }}>Lessons</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4, marginBottom: 10 }}>
          Short-note summaries by the Valhalla Health team (Avery 11th ed. + Fanaroff 12th
          ed. + The Newborn Lung 3rd ed.), plus the full Pimolrat Thaithumyanon textbook,
          used with permission · tap to read, checkmark to mark done
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
              padding: query ? '9px 32px 9px 32px' : '9px 12px 9px 32px',
              borderRadius: 10,
              border: `1.5px solid ${warm.line}`,
              background: warm.card,
              color: warm.ink,
              fontFamily: font.ui,
              fontSize: 13.5,
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 26,
                height: 26,
                border: 'none',
                background: 'none',
                color: warm.muted,
                fontSize: 15,
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Filter by textbook"
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 10,
            overflowX: 'auto',
          }}
        >
          {BOOK_TABS.map((tab) => {
            const active = bookFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setBookFilter(tab.id)}
                style={{
                  flexShrink: 0,
                  border: `1.5px solid ${active ? warm.terra : warm.line}`,
                  background: active ? warm.terra : 'transparent',
                  color: active ? '#fff' : warm.muted,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '5px 10px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: font.ui,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
            border: `1.5px solid ${savedOnly ? warm.ochre : warm.line}`,
            background: savedOnly ? '#FBEFE3' : 'transparent',
            color: savedOnly ? warm.ochre : warm.muted,
            fontSize: 11.5,
            fontWeight: 700,
            padding: '5px 10px',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: font.ui,
          }}
        >
          {savedOnly ? '★' : '☆'} Saved
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', color: warm.muted, fontSize: 13, marginTop: 24, fontFamily: font.ui }}>
            {savedOnly ? 'No bookmarked lessons yet.' : `No lessons match “${query}”.`}
          </div>
        )}
        {results.map((l) => {
          const done = Boolean(progress[String(l.day)]);
          const isToday = l.day === today;
          const bookmarkId = lessonBookmarkId(l.day);
          const bookmarked = Boolean(bookmarks[bookmarkId]);
          return (
            <div
              key={l.day}
              style={{
                position: 'relative',
                background: done ? '#EBF5E6' : warm.card,
                border: `1.5px solid ${isToday ? warm.terra : done ? warm.sage : warm.line}`,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => onOpenLesson(l.day)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderRadius: 12,
                  padding: '11px 72px 11px 14px',
                  cursor: 'pointer',
                  fontFamily: font.ui,
                }}
              >
                <span style={{ display: 'block', fontFamily: font.mono, fontSize: 10.5, color: warm.muted }}>
                  Day {l.day} · {bookLabel(l.book)} Ch {l.chapter}
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: warm.ink, marginTop: 3, lineHeight: 1.25 }}>
                  {l.title}
                </div>
                <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2, fontStyle: 'italic' }}>{l.authors}</div>
              </button>
              <button
                type="button"
                aria-pressed={bookmarked}
                aria-label={bookmarked ? `Remove bookmark for day ${l.day}` : `Bookmark day ${l.day}`}
                onClick={() => toggleBookmark(bookmarkId)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 36,
                  width: 28,
                  height: 28,
                  border: 'none',
                  background: 'none',
                  color: bookmarked ? warm.ochre : warm.muted,
                  fontSize: 15,
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
              >
                {bookmarked ? '★' : '☆'}
              </button>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={done ? `Mark day ${l.day} as not done` : `Mark day ${l.day} as done`}
                onClick={() => toggleDone(l.day)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  border: 'none',
                  background: 'none',
                  color: done ? warm.sage : warm.muted,
                  fontSize: 15,
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
              >
                {done ? '✓' : '○'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
