import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setSession } from './session';
import { getProgress, markLesson } from './storage';
import { useProgress } from './useProgress';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-123' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useProgress', () => {
  it('fills in days the server has done but this device does not (regression for C-3)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            rows: [
              { day: 5, done: true, firstCompletedAt: '2026-01-05T00:00:00.000Z' },
              { day: 6, done: false, firstCompletedAt: '' },
            ],
          }),
      }),
    );

    renderHook(() => useProgress());

    await waitFor(() => expect(getProgress()['5']).toBe('2026-01-05T00:00:00.000Z'));
    expect(getProgress()['6']).toBeUndefined();
  });

  it('does not clobber a local completion with a stale/missing server value', async () => {
    markLesson(7, true, new Date('2026-02-01T00:00:00.000Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rows: [] }) }),
    );

    const { result } = renderHook(() => useProgress());
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current['7']).toBe('2026-02-01T00:00:00.000Z');
  });

  it('keeps showing the local snapshot when the server is unreachable', async () => {
    markLesson(8, true, new Date('2026-02-02T00:00:00.000Z'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { result } = renderHook(() => useProgress());
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current['8']).toBe('2026-02-02T00:00:00.000Z');
  });
});
