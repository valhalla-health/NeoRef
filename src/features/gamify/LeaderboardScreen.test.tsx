import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardScreen } from './LeaderboardScreen';
import { setSession, onUnauthorized } from '../../lib/session';

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

  it('re-fetches when the refresh button is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          rows: [{ name: 'Alice', points: 10, streak: 3, isMe: false }],
          asOf: new Date().toISOString(),
        }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<LeaderboardScreen />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /refresh leaderboard/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('falls back to a cached response when offline, marked as cached', async () => {
    localStorage.setItem(
      'neoref:a@b.com:leaderboard-cache',
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

  it('notifies the app to sign out on an Unauthorized response, instead of just showing a generic error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ error: 'Unauthorized' }) }),
    );
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    render(<LeaderboardScreen />);
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    off();
  });

  it('does not show a previous account\'s cached leaderboard snapshot (regression for AUDIT C-3/S-5)', () => {
    localStorage.setItem(
      'neoref:a@b.com:leaderboard-cache',
      JSON.stringify({
        rows: [{ name: 'Account A view', points: 2, streak: 1, isMe: true }],
        asOf: new Date(2026, 0, 1).toISOString(),
      }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    setSession({ email: 'other@b.com', name: 'Other', role: 'user', token: 'tok-o', hasPassword: true });
    render(<LeaderboardScreen />);
    expect(screen.queryByText('Account A view')).not.toBeInTheDocument();
  });
});
