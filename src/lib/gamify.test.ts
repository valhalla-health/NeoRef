import { describe, it, expect, beforeEach } from 'vitest';
import { markLesson, recordToolOpen, toggleBookmark, recordActivity } from './storage';
import { levelFromXp, computeStreak, getGamifyState } from './gamify';
import { CALCS } from '../data/calcs';

beforeEach(() => localStorage.clear());

describe('levelFromXp', () => {
  it('starts at level 1 with a full span to level 2', () => {
    const l = levelFromXp(0);
    expect(l).toMatchObject({ level: 1, title: 'Med Student', xpIntoLevel: 0, xpForNextLevel: 50, progress: 0 });
  });

  it('advances a level exactly at each triangular threshold (0, 50, 150, 300...)', () => {
    expect(levelFromXp(49).level).toBe(1);
    expect(levelFromXp(50).level).toBe(2);
    expect(levelFromXp(149).level).toBe(2);
    expect(levelFromXp(150).level).toBe(3);
  });

  it('reports progress toward the next level within the current span', () => {
    const l = levelFromXp(75); // level 2 spans 50..150 (span 100), 25 into it
    expect(l).toMatchObject({ level: 2, xpIntoLevel: 25, xpForNextLevel: 100, progress: 0.25 });
  });

  it('falls back to a numbered title once the named ladder is exhausted', () => {
    // Level 10 is past the 9 named titles ('Master Clinician' is index 9).
    const l = levelFromXp(2250);
    expect(l.level).toBe(10);
    expect(l.title).toBe('Master Clinician · Lv 10');
  });
});

describe('computeStreak', () => {
  it('is zero with no completed lessons or activity', () => {
    expect(computeStreak({}, {})).toEqual({ current: 0, longest: 0 });
  });

  it('counts a run of consecutive calendar days as the current streak', () => {
    const progress = {
      '1': new Date(2026, 0, 5).toISOString(),
      '2': new Date(2026, 0, 6).toISOString(),
      '3': new Date(2026, 0, 7).toISOString(),
    };
    expect(computeStreak(progress, {}, new Date(2026, 0, 7, 20))).toEqual({ current: 3, longest: 3 });
  });

  it('keeps the current streak alive with a one-day grace before today is logged', () => {
    const progress = { '1': new Date(2026, 0, 6).toISOString(), '2': new Date(2026, 0, 7).toISOString() };
    // "Now" is Jan 8th and nothing is done yet today — streak shouldn't reset until a full day is missed.
    expect(computeStreak(progress, {}, new Date(2026, 0, 8, 6))).toEqual({ current: 2, longest: 2 });
  });

  it('resets the current streak once a day is fully missed, but preserves the longest', () => {
    const progress = {
      '1': new Date(2026, 0, 1).toISOString(),
      '2': new Date(2026, 0, 2).toISOString(),
      '3': new Date(2026, 0, 3).toISOString(),
      '4': new Date(2026, 0, 10).toISOString(),
    };
    expect(computeStreak(progress, {}, new Date(2026, 0, 12))).toEqual({ current: 0, longest: 3 });
  });

  it('extends the streak from activity (reading a lesson / opening a tool) even with no lesson marked done that day', () => {
    // A lesson was completed on Jan 5th, and nothing was ever marked done on Jan 6th or
    // Jan 7th — but the learner opened the app and read/used something on both of those
    // days, which should be enough on its own to keep the streak running to 3.
    const progress = { '9': new Date(2026, 0, 5).toISOString() };
    const activity = {
      '2026-01-06': new Date(2026, 0, 6, 8).toISOString(),
      '2026-01-07': new Date(2026, 0, 7, 8).toISOString(),
    };
    expect(computeStreak(progress, activity, new Date(2026, 0, 7, 20))).toEqual({ current: 3, longest: 3 });
  });

  it("doesn't extend the streak just because today's already-completed lesson is shown, when nothing new happened today", () => {
    // Reproduces the reported bug: a batch of lessons (including "today's") was
    // completed a day early, so there's no fresh timestamp for today anywhere,
    // and no activity was recorded today either — streak should stay flat.
    const progress: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) progress[String(i)] = new Date(2026, 0, 5, 21).toISOString();
    expect(computeStreak(progress, {}, new Date(2026, 0, 6, 7))).toEqual({ current: 1, longest: 1 });
  });
});

describe('getGamifyState', () => {
  it('awards 10 XP per completed lesson and 5 XP per first tool open', () => {
    markLesson(1, true, new Date(2026, 0, 1));
    markLesson(2, true, new Date(2026, 0, 2));
    recordToolOpen('eos', new Date(2026, 0, 1));
    recordToolOpen('eos', new Date(2026, 0, 2)); // repeat open — no extra XP

    const state = getGamifyState(new Date(2026, 0, 2, 12));
    expect(state.xp).toBe(2 * 10 + 1 * 5);
    expect(state.lessonsDone).toBe(2);
    expect(state.toolsUsed).toBe(1);
    expect(state.totalTools).toBe(CALCS.length);
  });

  it('unlocks the first-lesson badge once a lesson is marked done, and leaves others locked with progress', () => {
    markLesson(1, true, new Date(2026, 0, 1));
    const state = getGamifyState(new Date(2026, 0, 1, 12));

    const first = state.badges.find((b) => b.id === 'first-lesson')!;
    expect(first.earned).toBe(true);
    expect(first.progress).toEqual({ current: 1, target: 1 });

    const quarter = state.badges.find((b) => b.id === 'quarter')!;
    expect(quarter.earned).toBe(false);
    expect(quarter.progress.current).toBe(1);
    expect(quarter.progress.target).toBeGreaterThan(1);
  });

  it('unlocks the toolsmith badge only once every tool has been opened', () => {
    CALCS.slice(0, -1).forEach((c) => recordToolOpen(c.id));
    let state = getGamifyState();
    expect(state.badges.find((b) => b.id === 'toolsmith')!.earned).toBe(false);

    recordToolOpen(CALCS[CALCS.length - 1].id);
    state = getGamifyState();
    expect(state.badges.find((b) => b.id === 'toolsmith')!.earned).toBe(true);
  });

  it('unlocks the bookworm badge at 10 bookmarks', () => {
    for (let i = 0; i < 10; i++) toggleBookmark(`proto-${i}`);
    const state = getGamifyState();
    expect(state.badges.find((b) => b.id === 'bookworm')!.earned).toBe(true);
  });

  it('folds recordActivity() into the streak so opening a lesson/tool keeps it alive without a completion', () => {
    markLesson(1, true, new Date(2026, 0, 1));
    recordActivity(new Date(2026, 0, 2));
    const state = getGamifyState(new Date(2026, 0, 2, 12));
    expect(state.streak).toEqual({ current: 2, longest: 2 });
  });
});
