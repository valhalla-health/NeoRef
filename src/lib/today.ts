// Curriculum day helpers.
//
// Fixes AUDIT C-1: the prototype hardcoded `new Date('2026-05-19')`, freezing
// "today" at day 139 (outside its 1–20 dataset) so it never advanced. Here the
// day is computed from the real clock, in local time, and is injectable for tests.

import { getCurriculumStartDate } from './storage';

export const CURRICULUM_START = new Date(2026, 0, 1); // 2026-01-01, local time — default/fallback start
export const CURRICULUM_LENGTH = 365;

/** Day-of-curriculum (1..CURRICULUM_LENGTH) for a given date relative to `start`, local-time safe. */
export function curriculumDay(now: Date = new Date(), start: Date = CURRICULUM_START): number {
  // Compare calendar dates at local midnight to avoid DST / timezone drift.
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayIndex = Math.floor((nowMid - startMid) / 86_400_000) + 1;
  return Math.min(Math.max(dayIndex, 1), CURRICULUM_LENGTH);
}

/**
 * Day-of-curriculum anchored to when this device first opened the app (stored
 * in localStorage on first use), not a fixed calendar date — so "today" tracks
 * each user's own pace rather than everyone sharing the same start date.
 */
export function myCurriculumDay(now: Date = new Date()): number {
  return curriculumDay(now, getCurriculumStartDate(now));
}
