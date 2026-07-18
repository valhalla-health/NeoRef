import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setSession } from '../../lib/session';
import { useMyStats } from './useMyStats';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-a', hasPassword: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMyStats', () => {
  it('caches the fetched stats under this account\'s namespaced key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ points: 10, streak: 2, lessonsDone: 3, lastActivity: null }),
      }),
    );

    const { result } = renderHook(() => useMyStats());
    await waitFor(() => expect(result.current?.points).toBe(10));
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:my-stats-cache') ?? 'null')).toEqual({
      points: 10,
      streak: 2,
      lessonsDone: 3,
      lastActivity: null,
    });
  });

  it(
    'does not show a previous account\'s cached stats as this account\'s own (regression for AUDIT C-3/S-5)',
    async () => {
      localStorage.setItem(
        'neoref:a@b.com:my-stats-cache',
        JSON.stringify({ points: 999, streak: 30, lessonsDone: 50, lastActivity: null }),
      );
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      setSession({ email: 'other@b.com', name: 'Other', role: 'user', token: 'tok-o', hasPassword: true });
      const { result } = renderHook(() => useMyStats());
      await new Promise((r) => setTimeout(r, 0));

      expect(result.current).toBeNull(); // a different, offline account starts with no stats, not A's
    },
  );
});
