import { describe, it, expect } from 'vitest';
import { LESSONS, lessonForDay } from './lessons';

describe('lessonForDay', () => {
  it('returns the exact match when the day exists', () => {
    const day = LESSONS[5].day;
    expect(lessonForDay(day)).toBe(LESSONS.find((l) => l.day === day));
  });

  it('falls back to the nearest earlier lesson when the day is past the last entry', () => {
    // Real curriculum runs 365 days but content only covers a subset of
    // days — this is the branch HomeScreen/LearnScreen hit whenever the
    // current curriculum day has no lesson of its own.
    const last = LESSONS[LESSONS.length - 1];
    expect(lessonForDay(last.day + 1000)).toBe(last);
  });

  it('falls back to the first lesson when the day is before any entry exists', () => {
    const first = LESSONS[0];
    expect(lessonForDay(first.day - 1)).toBe(first);
  });
});
