// Curriculum day helpers.
//
// Fixes AUDIT C-1: the prototype hardcoded `new Date('2026-05-19')`, freezing
// "today" at day 139 (outside its 1–20 dataset) so it never advanced. Here the
// day is computed from the real clock, in local time, and is injectable for tests.

import type { ProgressMap } from './storage';

export const CURRICULUM_START = new Date(2026, 0, 1); // 2026-01-01, local time
export const CURRICULUM_LENGTH = 365;

/** Whole calendar days between two dates, local-time safe (DST-proof — compares local midnights). */
function daysBetween(start: Date, now: Date): number {
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor((nowMid - startMid) / 86_400_000);
}

/** Day-of-curriculum (1..CURRICULUM_LENGTH) for a given date, local-time safe. */
export function curriculumDay(now: Date = new Date()): number {
  return Math.min(Math.max(daysBetween(CURRICULUM_START, now) + 1, 1), CURRICULUM_LENGTH);
}

/**
 * Which lesson day to present as "today's" lesson.
 *
 * `curriculumDay()` alone ties the shown day to elapsed calendar time since a
 * fixed epoch, so a learner opening the app for the first time long after
 * CURRICULUM_START lands mid-curriculum (e.g. "Day 191") with 0 lessons
 * read — the day label and the progress bar disagree. Anchor on the learner's
 * own progress instead: a never-read learner starts at Day 1, and a
 * returning learner advances one day per calendar day since the date of
 * their very first completed lesson — so completing "today's" lesson still
 * shows as done for the rest of that day (it doesn't jump ahead), and the
 * daily pace is personal rather than tied to a fixed global start date.
 */
export function resumeDay(progress: ProgressMap, now: Date = new Date()): number {
  const timestamps = Object.values(progress).map((iso) => new Date(iso).getTime());
  if (timestamps.length === 0) return 1;
  const start = new Date(Math.min(...timestamps));
  return Math.min(Math.max(daysBetween(start, now) + 1, 1), CURRICULUM_LENGTH);
}
