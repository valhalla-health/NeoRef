import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProgress,
  markLesson,
  isLessonDone,
  toggleBookmark,
  isBookmarked,
  setProgress,
  subscribeProgress,
} from './storage';

beforeEach(() => localStorage.clear());

describe('lesson progress', () => {
  it('marks and unmarks a lesson', () => {
    markLesson(5, true, new Date(2026, 0, 5));
    expect(isLessonDone(5)).toBe(true);
    expect(getProgress()['5']).toBe(new Date(2026, 0, 5).toISOString());

    markLesson(5, false);
    expect(isLessonDone(5)).toBe(false);
  });

  it('starts empty', () => {
    expect(getProgress()).toEqual({});
    expect(isLessonDone(1)).toBe(false);
  });
});

describe('bookmarks', () => {
  it('toggles on and off', () => {
    expect(toggleBookmark('proto-caffeine')).toBe(true);
    expect(isBookmarked('proto-caffeine')).toBe(true);
    expect(toggleBookmark('proto-caffeine')).toBe(false);
    expect(isBookmarked('proto-caffeine')).toBe(false);
  });
});

describe('reference stability (regression for useSyncExternalStore infinite loop)', () => {
  it('returns the same object reference across calls when nothing changed', () => {
    markLesson(3, true, new Date(2026, 0, 3));
    expect(getProgress()).toBe(getProgress());
  });

  it('returns a new reference after markLesson changes the data', () => {
    markLesson(3, true, new Date(2026, 0, 3));
    const before = getProgress();
    markLesson(4, true, new Date(2026, 0, 4));
    expect(getProgress()).not.toBe(before);
  });

  it('returns a new reference after setProgress overwrites the map', () => {
    markLesson(3, true, new Date(2026, 0, 3));
    const before = getProgress();
    setProgress({ '3': before['3'], '9': new Date(2026, 0, 9).toISOString() });
    const after = getProgress();
    expect(after).not.toBe(before);
    expect(after['9']).toBeDefined();
  });
});

describe('setProgress + subscribeProgress', () => {
  it('bulk-overwrites the progress map', () => {
    setProgress({ '10': '2026-01-10T00:00:00.000Z', '11': '2026-01-11T00:00:00.000Z' });
    expect(getProgress()).toEqual({ '10': '2026-01-10T00:00:00.000Z', '11': '2026-01-11T00:00:00.000Z' });
  });

  it('notifies subscribers on markLesson and setProgress', () => {
    let calls = 0;
    const unsubscribe = subscribeProgress(() => calls++);
    markLesson(1, true);
    setProgress({ '1': new Date().toISOString() });
    expect(calls).toBe(2);
    unsubscribe();
    markLesson(2, true);
    expect(calls).toBe(2); // no longer subscribed
  });
});

describe('schema/version safety (regression for C-6)', () => {
  it('ignores an unversioned/legacy payload instead of crashing', () => {
    localStorage.setItem('neoref:lesson-progress', JSON.stringify({ '5': '2026-01-05' }));
    // No version envelope → treated as absent, returns fallback, no throw.
    expect(getProgress()).toEqual({});
  });

  it('ignores a wrong-shape payload (array) gracefully', () => {
    localStorage.setItem('neoref:lesson-progress', JSON.stringify({ v: 1, data: [1, 2, 3] }));
    expect(getProgress()).toEqual({});
  });

  it('ignores corrupt JSON gracefully', () => {
    localStorage.setItem('neoref:bookmarks', '{not json');
    expect(isBookmarked('x')).toBe(false);
  });
});
