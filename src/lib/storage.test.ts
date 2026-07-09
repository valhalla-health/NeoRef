import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProgress, markLesson, isLessonDone, toggleBookmark, isBookmarked } from './storage';

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

  it('degrades silently (no throw) when localStorage.setItem throws (quota exceeded / private mode)', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

    expect(() => markLesson(1, true)).not.toThrow();
    expect(() => toggleBookmark('x')).not.toThrow();

    setItem.mockRestore();
  });
});
