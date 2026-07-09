// Lesson index — generated from the "Daily Neonatology Lessons" bilingual
// Thai/English series via scripts/extract_lessons.py (python-docx). Do not
// hand-edit; re-run the script against an updated source folder and commit
// the regenerated lessons-index.json + public/lessons/day-*.json instead.
//
// Full lesson content (headings, bullets, callouts, tables) is NOT bundled
// here — it's fetched on demand from public/lessons/day-{day}.json by
// LessonDetail, keeping the initial app bundle small.

import lessonsIndexData from './lessons-index.json';

export interface Lesson {
  day: number;
  book: 'Avery' | 'Fanaroff';
  chapter: number;
  title: string;
  authors: string;
}

export const LESSONS: Lesson[] = lessonsIndexData as unknown as Lesson[];

/** Number of lessons with actual content available (vs. the 365-day curriculum plan). */
export const LESSON_COUNT = LESSONS.length;

/** Lesson for a given curriculum day, or the nearest earlier available one, else the first. */
export function lessonForDay(day: number): Lesson {
  const exact = LESSONS.find((l) => l.day === day);
  if (exact) return exact;
  const earlier = [...LESSONS].reverse().find((l) => l.day <= day);
  return earlier ?? LESSONS[0];
}

export function lessonPath(day: number): string {
  return `${import.meta.env.BASE_URL}lessons/day-${String(day).padStart(3, '0')}.json`;
}

/**
 * Shared OneDrive folder containing the original .docx for every lesson
 * (formatted source, richer than the in-app parsed view). This links to the
 * FOLDER, not the individual file — there's no per-file link available, so
 * readers browse to the matching "Day N ..." file themselves once inside.
 */
export const LESSON_SOURCE_FOLDER_URL =
  'https://1drv.ms/f/c/d6f3cdd93d71e377/IgDDaaB5TkxNTrydpwecYNL4AVmR-XUSXGEwa5CX3V6xWGY';
