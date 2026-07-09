// Gamification engine.
//
// Deliberately a pure read-side computation over the existing stores
// (lesson-progress, tool-usage, bookmarks) rather than a new source of
// truth — XP/streaks/badges can never drift from what the learner actually
// did, and there is nothing extra to keep in sync once per-account storage
// (email login + GAS history, see AUDIT C-3/S-5) lands later.

import { getProgress, getBookmarks, getToolUsage, type ProgressMap } from './storage';
import { CURRICULUM_LENGTH } from './today';
import { CALCS } from '../data/calcs';

const XP_PER_LESSON = 10;
const XP_PER_TOOL = 5;

// Career-ladder theme to match the app's NICU-training subject matter.
const LEVEL_TITLES = [
  'Med Student',
  'Intern',
  'Resident',
  'Senior Resident',
  'Fellow',
  'Senior Fellow',
  'Attending',
  'Senior Attending',
  'Master Clinician',
];

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  /** XP earned within the current level. */
  xpIntoLevel: number;
  /** XP required to span the current level (0 once titles are exhausted at max XP). */
  xpForNextLevel: number;
  /** 0..1 progress toward the next level. */
  progress: number;
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  progress: { current: number; target: number };
}

export interface GamifyState {
  xp: number;
  lessonsDone: number;
  toolsUsed: number;
  totalTools: number;
  bookmarks: number;
  streak: StreakInfo;
  level: LevelInfo;
  badges: Badge[];
}

/** Cumulative XP required to *reach* level n (1-indexed; level 1 = 0 XP). Triangular growth: 0, 50, 150, 300, 500... */
function xpForLevel(n: number): number {
  return (50 * (n - 1) * n) / 2;
}

function levelTitle(n: number): string {
  const title = LEVEL_TITLES[Math.min(n, LEVEL_TITLES.length) - 1];
  return n > LEVEL_TITLES.length ? `${title} · Lv ${n}` : title;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;

  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  const xpIntoLevel = xp - floor;

  return {
    level,
    title: levelTitle(level),
    xp,
    xpIntoLevel,
    xpForNextLevel: span,
    progress: span === 0 ? 1 : xpIntoLevel / span,
  };
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local calendar date → day-count-since-epoch, for consecutive-day arithmetic (DST safe, same approach as today.ts). */
function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Current + longest consecutive-calendar-day streak of completed lessons. "Current" allows a grace day (today not done yet) so it doesn't reset until a full day is missed. */
export function computeStreak(progress: ProgressMap, now: Date = new Date()): StreakInfo {
  const days = new Set(Object.values(progress).map((iso) => dayNumber(dateKey(new Date(iso)))));
  if (days.size === 0) return { current: 0, longest: 0 };

  const sorted = [...days].sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = dayNumber(dateKey(now));
  let anchor = days.has(today) ? today : today - 1;
  let current = 0;
  while (days.has(anchor)) {
    current++;
    anchor--;
  }

  return { current, longest };
}

interface Facts {
  lessonsDone: number;
  toolsUsed: number;
  totalTools: number;
  bookmarks: number;
  streakLongest: number;
}

interface BadgeDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  target: (f: Facts) => number;
  current: (f: Facts) => number;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first-lesson',
    emoji: '🌱',
    title: 'First Steps',
    description: 'Complete your first daily lesson.',
    target: () => 1,
    current: (f) => f.lessonsDone,
  },
  {
    id: 'streak-3',
    emoji: '✨',
    title: 'Warming Up',
    description: 'Hit a 3-day lesson streak.',
    target: () => 3,
    current: (f) => f.streakLongest,
  },
  {
    id: 'streak-7',
    emoji: '🔥',
    title: 'Week One',
    description: 'Hit a 7-day lesson streak.',
    target: () => 7,
    current: (f) => f.streakLongest,
  },
  {
    id: 'streak-30',
    emoji: '🏅',
    title: 'On Rotation',
    description: 'Hit a 30-day lesson streak.',
    target: () => 30,
    current: (f) => f.streakLongest,
  },
  {
    id: 'quarter',
    emoji: '📘',
    title: 'Quarter Curriculum',
    description: `Complete 25% of the ${CURRICULUM_LENGTH}-day curriculum.`,
    target: () => Math.ceil(CURRICULUM_LENGTH * 0.25),
    current: (f) => f.lessonsDone,
  },
  {
    id: 'half',
    emoji: '📗',
    title: 'Halfway There',
    description: 'Complete 50% of the curriculum.',
    target: () => Math.ceil(CURRICULUM_LENGTH * 0.5),
    current: (f) => f.lessonsDone,
  },
  {
    id: 'complete',
    emoji: '🎓',
    title: 'Curriculum Complete',
    description: `Finish all ${CURRICULUM_LENGTH} days.`,
    target: () => CURRICULUM_LENGTH,
    current: (f) => f.lessonsDone,
  },
  {
    id: 'toolsmith',
    emoji: '🧰',
    title: 'Toolsmith',
    description: 'Open every clinical tool at least once.',
    target: (f) => f.totalTools,
    current: (f) => f.toolsUsed,
  },
  {
    id: 'bookworm',
    emoji: '🔖',
    title: 'Bookworm',
    description: 'Bookmark 10 items for later.',
    target: () => 10,
    current: (f) => f.bookmarks,
  },
];

function toBadge(def: BadgeDef, facts: Facts): Badge {
  const target = def.target(facts);
  const current = Math.min(def.current(facts), target);
  return {
    id: def.id,
    emoji: def.emoji,
    title: def.title,
    description: def.description,
    earned: current >= target,
    progress: { current, target },
  };
}

export function getGamifyState(now: Date = new Date()): GamifyState {
  const progress = getProgress();
  const bookmarks = getBookmarks();
  const toolUsage = getToolUsage();

  const lessonsDone = Object.keys(progress).length;
  const toolsUsed = Object.keys(toolUsage).length;
  const bookmarkCount = Object.keys(bookmarks).length;
  const totalTools = CALCS.length;
  const streak = computeStreak(progress, now);

  const xp = lessonsDone * XP_PER_LESSON + toolsUsed * XP_PER_TOOL;
  const level = levelFromXp(xp);

  const facts: Facts = {
    lessonsDone,
    toolsUsed,
    totalTools,
    bookmarks: bookmarkCount,
    streakLongest: streak.longest,
  };
  const badges = BADGE_DEFS.map((def) => toBadge(def, facts));

  return {
    xp,
    lessonsDone,
    toolsUsed,
    totalTools,
    bookmarks: bookmarkCount,
    streak,
    level,
    badges,
  };
}
