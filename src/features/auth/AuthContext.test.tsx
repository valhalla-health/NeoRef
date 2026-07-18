import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { setSession, getSession } from '../../lib/session';

function Probe() {
  const { status, user, loginWithGoogle, handleUnauthorized } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="email">{user?.email ?? ''}</div>
      <button onClick={() => void loginWithGoogle('fake.jwt.token')}>login</button>
      <button onClick={handleUnauthorized}>unauthorized</button>
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
    setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1', hasPassword: true });
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
          Promise.resolve({ status: 'ok', token: 'tok-2', email: 'c@d.com', role: 'user', name: 'C D', hasPassword: false }),
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
    setSession({ email: 'a@b.com', name: 'A', role: 'user', token: 'tok-1', hasPassword: true });
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
});
