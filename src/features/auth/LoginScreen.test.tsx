import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { LoginScreen } from './LoginScreen';

function renderLogin() {
  return render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>,
  );
}

function stubLoginOk() {
  const fetchSpy = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        status: 'ok',
        token: 'tok',
        email: 'mew@chula.ac.th',
        role: 'user',
        name: 'Mew',
        hasPassword: true,
      }),
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

function sentBody(fetchSpy: ReturnType<typeof vi.fn>) {
  return JSON.parse(fetchSpy.mock.calls[0][1].body as string) as Record<string, unknown>;
}

async function openPasswordForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(/Use email & password instead/));
}

afterEach(() => vi.unstubAllGlobals());

describe('<LoginScreen />', () => {
  it('tells the user Google Sign-In could not load instead of showing an empty button slot', async () => {
    // No GIS <script> in the document — the same end state as offline, blocked,
    // or a connection too slow to deliver it on a phone.
    renderLogin();
    expect(await screen.findByText(/ไม่สามารถโหลด Google Sign-In ได้/)).toBeInTheDocument();
  });

  it('trims and lowercases the typed email, as mobile keyboards mangle it', async () => {
    const fetchSpy = stubLoginOk();
    const user = userEvent.setup();
    renderLogin();
    await openPasswordForm(user);

    await user.type(screen.getByPlaceholderText('Email'), '  Mew@Chula.AC.TH ');
    await user.type(screen.getByPlaceholderText('Password'), 'pw-1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(sentBody(fetchSpy)).toMatchObject({ email: 'mew@chula.ac.th', password: 'pw-1' });
  });

  it('leaves the password untouched — only the email is normalised', async () => {
    const fetchSpy = stubLoginOk();
    const user = userEvent.setup();
    renderLogin();
    await openPasswordForm(user);

    await user.type(screen.getByPlaceholderText('Email'), 'mew@chula.ac.th');
    await user.type(screen.getByPlaceholderText('Password'), '  MiXeD Case  ');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(sentBody(fetchSpy).password).toBe('  MiXeD Case  ');
  });

  it('marks up both fields so mobile password managers can fill them', async () => {
    const user = userEvent.setup();
    renderLogin();
    await openPasswordForm(user);

    const email = screen.getByPlaceholderText('Email');
    expect(email).toHaveAttribute('autocomplete', 'username');
    expect(email).toHaveAttribute('inputmode', 'email');
    expect(email).toHaveAttribute('autocapitalize', 'none');
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('surfaces the backend error when the account is not on the roster', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ error: 'Unknown user' }) }),
    );
    const user = userEvent.setup();
    renderLogin();
    await openPasswordForm(user);

    await user.type(screen.getByPlaceholderText('Email'), 'nobody@chula.ac.th');
    await user.type(screen.getByPlaceholderText('Password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown user');
  });
});
