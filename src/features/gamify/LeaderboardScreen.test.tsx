import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LeaderboardScreen } from './LeaderboardScreen';
import { setSession } from '../../lib/session';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1', hasPassword: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<LeaderboardScreen />', () => {
  it('shows a loading state, then renders fetched rows with isMe highlighted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            rows: [
              { name: 'Alice', points: 10, streak: 3, isMe: false },
              { name: 'Me', points: 5, streak: 1, isMe: true },
            ],
            asOf: new Date().toISOString(),
          }),
      }),
    );

    render(<LeaderboardScreen />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText(/\(you\)/)).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails and there is no cache', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<LeaderboardScreen />);
    await waitFor(() => expect(screen.getByText(/Couldn't load/i)).toBeInTheDocument());
  });

  it('shows an empty state when there are no completions yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rows: [], asOf: new Date().toISOString() }) }),
    );
    render(<LeaderboardScreen />);
    await waitFor(() => expect(screen.getByText(/be the first/i)).toBeInTheDocument());
  });

  it('falls back to a cached response when offline, marked as cached', async () => {
    localStorage.setItem(
      'neoref:leaderboard-cache',
      JSON.stringify({
        rows: [{ name: 'Offline Alice', points: 2, streak: 1, isMe: false }],
        asOf: new Date(2026, 0, 1).toISOString(),
      }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<LeaderboardScreen />);
    expect(screen.getByText('Offline Alice')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/\(cached\)/i)).toBeInTheDocument());
  });
});
