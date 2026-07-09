import { describe, it, expect } from 'vitest';
import { AVERY_LESSONS, lessonForDay } from './lessons';

describe('lessonForDay', () => {
  it('returns the exact match when the day exists', () => {
    expect(lessonForDay(5)).toBe(AVERY_LESSONS.find((l) => l.d === 5));
  });

  it('falls back to the nearest earlier lesson when the day is past the last entry', () => {
    // Real curriculum runs 365 days but only the first 20 have lessons —
    // this is the branch HomeScreen/LearnScreen hit every day past day 20.
    expect(lessonForDay(365)).toBe(AVERY_LESSONS[AVERY_LESSONS.length - 1]);
  });

  it('falls back to the first lesson when the day is before any entry exists', () => {
    expect(lessonForDay(0)).toBe(AVERY_LESSONS[0]);
  });
});
