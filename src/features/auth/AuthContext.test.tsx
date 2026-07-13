import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { setSession, getSession } from '../../lib/session';

function Probe() {
  const { status, user, loginWithGoogle, handleUnauthorized, updateName } = useAuth();
  const [renameError, setRenameError] = useState('');
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="email">{user?.email ?? ''}</div>
      <div data-testid="name">{user?.name ?? ''}</div>
      <div data-testid="rename-error">{renameError}</div>
      <button onClick={() => void loginWithGoogle('fake.jwt.token')}>login</button>
      <button onClick={handleUnauthorized}>unauthorized</button>
      <button onClick={() => void updateName('New Name').then((err) => setRenameError(err ?? ''))}>rename</button>
    </div>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('<AuthProvider />', () => {
  it('starts signed-out when there is no cached session', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('status').textContent).toBe('signed-out');
  });

  it('starts signed-in immediately from a cached session, with no network call', () => {
    setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1' });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('status').textContent).toBe('signed-in');
    expect(screen.getByTestId('email').textContent).toBe('a@b.com');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('signs in on a successful Google login response and persists the session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ status: 'ok', token: 'tok-2', email: 'c@d.com', role: 'user', name: 'C D' }),
      }),
    );
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('signed-in'));
    expect(getSession()?.email).toBe('c@d.com');
  });

  it('clears the session and flips to signed-out on handleUnauthorized', async () => {
    setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1' });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('status').textContent).toBe('signed-in');
    await user.click(screen.getByText('unauthorized'));
    expect(screen.getByTestId('status').textContent).toBe('signed-out');
    expect(getSession()).toBeNull();
  });

  describe('updateName', () => {
    it('persists the new name locally and to the session on success — shows up wherever session.name is read (e.g. the leaderboard)', async () => {
      setSession({ email: 'a@b.com', name: 'Old Name', role: 'user', token: 'tok-1' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true, name: 'New Name' }) }),
      );
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await user.click(screen.getByText('rename'));
      await waitFor(() => expect(screen.getByTestId('name').textContent).toBe('New Name'));
      expect(getSession()?.name).toBe('New Name');
    });

    it('surfaces a backend error and leaves the old name in place', async () => {
      setSession({ email: 'a@b.com', name: 'Old Name', role: 'user', token: 'tok-1' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ json: () => Promise.resolve({ error: 'Name already taken' }) }),
      );
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await user.click(screen.getByText('rename'));
      await waitFor(() => expect(screen.getByTestId('rename-error').textContent).toBe('Name already taken'));
      expect(screen.getByTestId('name').textContent).toBe('Old Name');
      expect(getSession()?.name).toBe('Old Name');
    });

    it('returns an error instead of calling the network when signed out', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await user.click(screen.getByText('rename'));
      await waitFor(() => expect(screen.getByTestId('rename-error').textContent).not.toBe(''));
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('signs the user out on an Unauthorized response, instead of just showing the raw error', async () => {
      setSession({ email: 'a@b.com', name: 'Old Name', role: 'user', token: 'stale-tok' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ json: () => Promise.resolve({ error: 'Unauthorized' }) }),
      );
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await user.click(screen.getByText('rename'));
      await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('signed-out'));
      expect(getSession()).toBeNull();
    });
  });
});
