import { describe, it, expect } from 'vitest';
import { curriculumDay, resumeDay, CURRICULUM_LENGTH } from './today';
import type { ProgressMap } from './storage';

describe('curriculumDay', () => {
  it('returns day 1 on the curriculum start date', () => {
    expect(curriculumDay(new Date(2026, 0, 1, 9, 0))).toBe(1);
  });

  it('advances by one per calendar day', () => {
    expect(curriculumDay(new Date(2026, 0, 2, 0, 30))).toBe(2);
    expect(curriculumDay(new Date(2026, 0, 15, 23, 59))).toBe(15);
  });

  it('is not frozen — different real dates give different days (regression for C-1)', () => {
    const a = curriculumDay(new Date(2026, 4, 19)); // the prototype hardcoded this
    const b = curriculumDay(new Date(2026, 4, 20));
    expect(b).toBe(a + 1);
  });

  it('clamps below 1 for dates before the start', () => {
    expect(curriculumDay(new Date(2025, 11, 20))).toBe(1);
  });

  it('clamps at the curriculum length', () => {
    expect(curriculumDay(new Date(2030, 0, 1))).toBe(CURRICULUM_LENGTH);
  });

  it('is timezone/DST safe across a day boundary (uses local midnight)', () => {
    // Late-evening local time must still map to that same calendar day.
    expect(curriculumDay(new Date(2026, 0, 10, 23, 30))).toBe(10);
    expect(curriculumDay(new Date(2026, 0, 11, 0, 1))).toBe(11);
  });
});

describe('resumeDay', () => {
  it('starts a never-read learner at Day 1, regardless of how far curriculumDay has drifted', () => {
    expect(resumeDay({})).toBe(1);
  });

  it('stays on Day 1 for the rest of the day the first lesson is completed (done badge does not vanish)', () => {
    const progress: ProgressMap = { '1': new Date(2026, 6, 9, 8, 0).toISOString() };
    expect(resumeDay(progress, new Date(2026, 6, 9, 22, 0))).toBe(1);
  });

  it('advances one day per elapsed calendar day since the first completion, not a fixed epoch', () => {
    const progress: ProgressMap = { '1': new Date(2026, 6, 9, 8, 0).toISOString() };
    expect(resumeDay(progress, new Date(2026, 6, 12, 8, 0))).toBe(4);
  });

  it('anchors on the earliest completion even if lessons were completed out of order', () => {
    const progress: ProgressMap = {
      '5': new Date(2026, 6, 10).toISOString(),
      '1': new Date(2026, 6, 9).toISOString(),
    };
    expect(resumeDay(progress, new Date(2026, 6, 9))).toBe(1);
  });

  it('clamps at the curriculum length', () => {
    const progress: ProgressMap = { '1': new Date(2020, 0, 1).toISOString() };
    expect(resumeDay(progress, new Date(2030, 0, 1))).toBe(CURRICULUM_LENGTH);
  });
});
