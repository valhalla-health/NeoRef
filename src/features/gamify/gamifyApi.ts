// POST wrapper for the gamification GAS actions (same text/plain CORS trick
// as authApi.ts). Callers should route an ErrorResponse with error
// "Unauthorized" through useAuth().handleUnauthorized().

import { getSession } from '../../lib/session';

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

export interface StatsResponse {
  points: number;
  streak: number;
  lessonsDone: number;
  lastActivity: string | null;
}
export interface LeaderboardRow {
  name: string;
  points: number;
  streak: number;
  isMe: boolean;
}
export interface LeaderboardResponse {
  rows: LeaderboardRow[];
  asOf: string;
}
export interface CompletionsResponse {
  rows: { day: number; done: boolean; firstCompletedAt: string }[];
}
export interface BookmarksResponse {
  rows: { id: string; bookmarked: boolean; firstBookmarkedAt: string }[];
}
export interface ErrorResponse {
  error: string;
}

async function post<T>(body: Record<string, unknown>): Promise<T | ErrorResponse> {
  const token = getSession()?.token;
  if (!token) return { error: 'Unauthorized' };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, token }),
  });
  return res.json() as Promise<T | ErrorResponse>;
}

export function logLessonDone(day: number, done: boolean): Promise<{ ok: true; points: number; streak: number } | ErrorResponse> {
  return post({ action: 'logLessonDone', day, done });
}

export function getMyStats(): Promise<StatsResponse | ErrorResponse> {
  return post({ action: 'getMyStats' });
}

export function getMyCompletions(): Promise<CompletionsResponse | ErrorResponse> {
  return post({ action: 'getMyCompletions' });
}

export function logBookmark(id: string, bookmarked: boolean): Promise<{ ok: true } | ErrorResponse> {
  return post({ action: 'logBookmark', id, bookmarked });
}

export function getMyBookmarks(): Promise<BookmarksResponse | ErrorResponse> {
  return post({ action: 'getMyBookmarks' });
}

export function getLeaderboard(): Promise<LeaderboardResponse | ErrorResponse> {
  return post({ action: 'getLeaderboard' });
}

export function isErrorResponse(x: unknown): x is ErrorResponse {
  return typeof x === 'object' && x !== null && typeof (x as ErrorResponse).error === 'string';
}
