import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { setSession } from './session';
import { isLessonDone } from './storage';
import { setLessonDone, flushGamifyOutbox } from './progress';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-123', hasPassword: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setLessonDone', () => {
  it('updates local storage synchronously regardless of network state', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    setLessonDone(7, true);
    expect(isLessonDone(7)).toBe(true);
  });

  it('does not throw when the remote sync fails (offline)', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(() => setLessonDone(7, true)).not.toThrow();
  });

  it('queues the event to the outbox when the remote call fails, and flushes it later', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    setLessonDone(7, true);
    // Let the fire-and-forget async handler run.
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:gamify-pending') ?? '[]')).toEqual([
      { day: 7, done: true },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true, points: 1, streak: 1 }) }),
    );
    await flushGamifyOutbox();
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:gamify-pending') ?? '[]')).toEqual([]);
  });

  it('does not enqueue when the remote call succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true, points: 1, streak: 1 }) }),
    );
    setLessonDone(7, true);
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem('neoref:a@b.com:gamify-pending') ?? '[]')).toEqual([]);
  });
});
