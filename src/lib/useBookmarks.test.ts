import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setSession } from './session';
import { getBookmarks, setBookmarkState } from './storage';
import { useBookmarks } from './useBookmarks';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-123', hasPassword: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useBookmarks', () => {
  it('fills in ids the server has bookmarked but this device does not (multi-device recovery)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            rows: [
              { id: 'lesson-5', bookmarked: true, firstBookmarkedAt: '2026-01-05T00:00:00.000Z' },
              { id: 'lesson-6', bookmarked: false, firstBookmarkedAt: '' },
            ],
          }),
      }),
    );

    renderHook(() => useBookmarks());

    await waitFor(() => expect(getBookmarks()['lesson-5']).toBe('2026-01-05T00:00:00.000Z'));
    expect(getBookmarks()['lesson-6']).toBeUndefined();
  });

  it('does not clobber a local bookmark with a stale/missing server value', async () => {
    setBookmarkState('lesson-7', true, new Date('2026-02-01T00:00:00.000Z'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rows: [] }) }));

    const { result } = renderHook(() => useBookmarks());
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current['lesson-7']).toBe('2026-02-01T00:00:00.000Z');
  });

  it('keeps showing the local snapshot when the server is unreachable', async () => {
    setBookmarkState('lesson-8', true, new Date('2026-02-02T00:00:00.000Z'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { result } = renderHook(() => useBookmarks());
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current['lesson-8']).toBe('2026-02-02T00:00:00.000Z');
  });
});
