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
  book: 'Avery' | 'Fanaroff' | 'NewbornLung' | 'Pimolrat';
  chapter: number;
  title: string;
  authors: string;
  /** ~10 distinctive clinical terms pulled from the lesson body (acronyms,
   * named entities) so search can match content beyond the title/authors. */
  keywords?: string[];
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

/** All lessons for a single textbook, in chapter order (day is the tiebreaker
 * for lessons sharing a chapter number). Used to group the Learn tab by book
 * and to walk chapter-to-chapter within one textbook. */
export function lessonsForBook(book: Lesson['book']): Lesson[] {
  return LESSONS.filter((l) => l.book === book).sort((a, b) => a.chapter - b.chapter || a.day - b.day);
}

/** The previous/next chapter within the same textbook as `day` (null at
 * either end of that book's chapter list), for the reader's chapter nav. */
export function adjacentLessons(day: number): { prev: Lesson | null; next: Lesson | null } {
  const current = lessonForDay(day);
  const siblings = lessonsForBook(current.book);
  const idx = siblings.findIndex((l) => l.day === current.day);
  if (idx === -1) return { prev: null, next: null };
  return { prev: siblings[idx - 1] ?? null, next: siblings[idx + 1] ?? null };
}

export function lessonPath(day: number): string {
  return `${import.meta.env.BASE_URL}lessons/day-${String(day).padStart(3, '0')}.json`;
}

/** Resolves a lesson image block's relative src (e.g. "images/day-227-fig-1.png") to a fetchable URL. */
export function lessonImagePath(src: string): string {
  return `${import.meta.env.BASE_URL}lessons/${src}`;
}

/** Display name for a lesson's source book. */
export function bookLabel(book: string): string {
  if (book === 'NewbornLung') return 'The Newborn Lung';
  if (book === 'Pimolrat') return 'คู่มือการดูแลทารกแรกเกิด';
  return book;
}

/**
 * Attribution shown alongside a lesson's book/chapter/author citation.
 * Avery/Fanaroff/Newborn Lung lessons are the Valhalla Health team's own
 * short-note study summaries written while reading the cited chapter — not a
 * reproduction of it. Pimolrat lessons are the opposite: the full original
 * textbook text, used with the author's explicit permission — so they get a
 * distinct attribution rather than the "not the original text" disclaimer
 * (see README's License & copyright section for the full rationale).
 */
export function lessonAttribution(book: string): string {
  if (book === 'Pimolrat') {
    return 'เนื้อหาต้นฉบับจากตำรา คู่มือการดูแลทารกแรกเกิด โดย ศ.กิตติคุณ พญ.พิมลรัตน์ ไทยธรรมยานนท์ · ใช้โดยได้รับอนุญาตจากผู้เขียน';
  }
  return 'สรุปย่อ (short note) จัดทำโดยทีม Valhalla Health · ไม่ใช่เนื้อหาต้นฉบับจากตำรา';
}

/**
 * Whether a lesson has a separate original source document worth linking to.
 * Avery/Fanaroff/Newborn Lung lessons are shortnotes distilled from an
 * external docx, so LessonDetail links back to it. Pimolrat lessons ARE the
 * full source text - there's no separate "original" to open, so no link is
 * shown for them. Future shortnote-style additions should default to true.
 */
export function hasSourceDoc(book: string): boolean {
  return book !== 'Pimolrat';
}

/**
 * Hint for finding a lesson's source file inside the OneDrive folder. The
 * Newborn Lung series uses its own "NL Day N" filename numbering (independent
 * of the unified app `day`, which continues past Fanaroff's Day 200), so its
 * hint must reference the chapter number rather than the app-internal day.
 */
export function lessonSourceHint(l: { day: number; book: string; chapter: number }): string {
  if (l.book === 'NewbornLung') {
    return `NL Day ${l.chapter} · The Newborn Lung Ch ${l.chapter}`;
  }
  return `Day ${l.day} · ${l.book} Ch ${l.chapter}`;
}

/**
 * Shared OneDrive folder containing the original .docx for every lesson
 * (formatted source, richer than the in-app parsed view). This links to the
 * FOLDER, not the individual file — there's no per-file link available, so
 * readers browse to the matching "Day N ..." file themselves once inside.
 */
export const LESSON_SOURCE_FOLDER_URL =
  'https://1drv.ms/f/c/d6f3cdd93d71e377/IgDDaaB5TkxNTrydpwecYNL4AY1fG7n-D2ulYXhaJqUgib0';
