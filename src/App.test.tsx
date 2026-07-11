import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { setSession } from './lib/session';

// The shell now requires a signed-in session to show the 4-tab app (see
// AuthContext) — stub one in so these navigation tests exercise the same
// shell as before. Stub fetch too, since HomeScreen's stats chip fires a
// fire-and-forget gamify call that would otherwise hit the network.
beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'test@example.com', name: 'Test User', role: 'user', token: 'test-token' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
});
afterEach(() => vi.unstubAllGlobals());

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe('<App /> — end-to-end shell', () => {
  it('renders home with the educational disclaimer and a live curriculum day', () => {
    renderApp();
    expect(screen.getAllByText(/Newborn/).length).toBeGreaterThan(0);
    expect(screen.getByRole('note')).toHaveTextContent(/Educational reference only/i);
    // The curriculum day is computed from the real clock, never the frozen 139.
    // Once the lesson dataset falls behind today's real day, the header honestly
    // switches to "Latest lesson" instead of misreporting "Today".
    expect(screen.getByText(/(Today|Latest lesson) · Day \d+/)).toBeInTheDocument();
  });

  it('navigates Home → Tools → EOS and shows the educational screen (no invented risk)', async () => {
    const user = userEvent.setup();
    renderApp();

    const nav = screen.getByRole('navigation', { name: /primary/i });
    await user.click(within(nav).getByText('Tools'));
    expect(screen.getByText(/Clinical/)).toBeInTheDocument();

    // EOS is the one ported, interactive tool.
    await user.click(screen.getByRole('button', { name: /EOS factors/i }));
    expect(screen.getByText(/How each factor moves risk/i)).toBeInTheDocument();

    const root = screen.getByText(/How each factor moves risk/i).closest('div')!;
    expect(root.textContent ?? '').not.toMatch(/\/1000|Ampicillin|Gentamicin/i);
  });

  it('navigates to the Learn tab and lists daily lessons', async () => {
    const user = userEvent.setup();
    renderApp();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    await user.click(within(nav).getByText('Learn'));
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
    expect(screen.getByText(/Neonatal and Perinatal Epidemiology/i)).toBeInTheDocument();
  });

  it('navigates to the Progress tab and shows gamification state', async () => {
    const user = userEvent.setup();
    renderApp();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    await user.click(within(nav).getByText('Progress'));
    expect(screen.getByText(/Earn XP by finishing lessons/)).toBeInTheDocument();
    expect(screen.getByText(/Achievements ·/)).toBeInTheDocument();
  });

  it('awards tool-usage XP the first time a calculator is opened', async () => {
    const user = userEvent.setup();
    renderApp();
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await user.click(within(nav).getByText('Tools'));
    await user.click(screen.getByRole('button', { name: /EOS factors/i }));

    await user.click(within(nav).getByText('Progress'));
    expect(screen.getByText(/5\/50 XP/)).toBeInTheDocument();
  });
});
