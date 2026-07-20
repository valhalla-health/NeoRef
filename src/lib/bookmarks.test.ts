import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { setSession } from './session';
import { isBookmarked } from './storage';
import { setBookmark, flushBookmarkOutbox } from './bookmarks';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-123', hasPassword: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setBookmark', () => {
  it('updates local storage synchronously regardless of network state', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    setBookmark('lesson-7', true);
    expect(isBookmarked('lesson-7')).toBe(true);
  });

  it('does not throw when the remote sync fails (offline)', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(() => setBookmark('lesson-7', true)).not.toThrow();
  });

  it('queues the event to the outbox when the remote call fails, and flushes it later', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    setBookmark('lesson-7', true);
    // Let the fire-and-forget async handler run.
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:bookmark-pending') ?? '[]')).toEqual([
      { id: 'lesson-7', bookmarked: true },
    ]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) }));
    await flushBookmarkOutbox();
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:bookmark-pending') ?? '[]')).toEqual([]);
  });

  it('does not enqueue when the remote call succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) }));
    setBookmark('lesson-7', true);
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:bookmark-pending') ?? '[]')).toEqual([]);
  });
});
