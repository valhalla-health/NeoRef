import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamifyScreen } from './GamifyScreen';
import { markLesson, recordToolOpen } from '../../lib/storage';
import { CALCS } from '../../data/calcs';
import { setSession } from '../../lib/session';

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1', hasPassword: true });
});
afterEach(() => vi.unstubAllGlobals());

describe('GamifyScreen', () => {
  it('starts at level 1 with no achievements earned', () => {
    render(<GamifyScreen />);
    expect(screen.getByText('Med Student')).toBeInTheDocument();
    expect(screen.getByText(`Achievements · 0/${9}`)).toBeInTheDocument();
    // "0/365" appears twice: the "Lessons" stat tile and the locked "complete" badge.
    expect(screen.getAllByText('0/365').length).toBe(2);
  });

  it('shows the "First Steps" badge as earned once a lesson is completed', () => {
    markLesson(1, true, new Date(2026, 0, 1));
    render(<GamifyScreen />);
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Earned').length).toBeGreaterThan(0);
    // "1/365" appears twice: the "Lessons" stat tile and the locked "complete" badge.
    expect(screen.getAllByText('1/365').length).toBe(2);
  });

  it('shows tool-usage progress toward the Toolsmith badge', () => {
    recordToolOpen(CALCS[0].id);
    render(<GamifyScreen />);
    expect(screen.getByText('Toolsmith')).toBeInTheDocument();
    // Both the "Tools tried" stat tile and the Toolsmith badge render "1/12".
    expect(screen.getAllByText(`1/${CALCS.length}`).length).toBe(2);
  });

  it('shows a top-3 leaderboard preview above Achievements, with a "Show more" button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            rows: [
              { name: 'Alice', points: 40, streak: 5, isMe: false },
              { name: 'Me', points: 30, streak: 2, isMe: true },
              { name: 'Bob', points: 20, streak: 1, isMe: false },
              { name: 'Carol', points: 10, streak: 0, isMe: false },
            ],
            asOf: new Date().toISOString(),
          }),
      }),
    );

    const onShowLeaderboard = vi.fn();
    const user = userEvent.setup();
    render(<GamifyScreen onShowLeaderboard={onShowLeaderboard} />);

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Only the top 3 rows render in the preview — "Carol" (4th place) is left
    // for the full leaderboard behind "Show more".
    expect(screen.queryByText('Carol')).not.toBeInTheDocument();

    const leaderboardHeading = screen.getByText('Leaderboard');
    const achievementsHeading = screen.getByText(/Achievements ·/);
    expect(leaderboardHeading.compareDocumentPosition(achievementsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /show more/i }));
    expect(onShowLeaderboard).toHaveBeenCalledTimes(1);
  });
});
