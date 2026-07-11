import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from './HomeScreen';
import { AuthProvider } from '../auth/AuthContext';
import { setSession } from '../../lib/session';

const noop = () => {};

function renderHome() {
  return render(
    <AuthProvider>
      <HomeScreen onOpenCalc={noop} onOpenLearn={noop} onOpenLesson={noop} />
    </AuthProvider>,
  );
}

// Routes every GAS POST by its `action` field so unrelated fire-and-forget
// calls (useMyStats, useProgress) get a harmless response instead of
// interfering with the updateName assertions under test.
function stubGas(handlers: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, opts: { body: string }) => {
      const body = JSON.parse(opts.body) as { action: string };
      const resp = handlers[body.action] ?? { error: 'unhandled action in test' };
      return Promise.resolve({ json: () => Promise.resolve(resp) });
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'a@b.com', name: 'Peeraporn P', role: 'user', token: 'tok-1' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<HomeScreen /> — name badge', () => {
  it('shows the signed-in user’s name, tappable to edit', () => {
    stubGas({});
    renderHome();
    expect(screen.getByRole('button', { name: /Edit your name/i })).toHaveTextContent('Peeraporn P');
  });

  it('tapping the name opens an editable input pre-filled with the current name', async () => {
    stubGas({});
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /Edit your name/i }));
    expect(screen.getByRole('textbox', { name: /Your name/i })).toHaveValue('Peeraporn P');
  });

  it('saves a new name, which becomes what is shown (and therefore what the leaderboard reads via session.name)', async () => {
    stubGas({ updateName: { ok: true, name: 'Peeraporn Tv' } });
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Edit your name/i }));
    const input = screen.getByRole('textbox', { name: /Your name/i });
    await user.clear(input);
    await user.type(input, 'Peeraporn Tv');
    await user.click(screen.getByRole('button', { name: /Save name/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Edit your name/i })).toHaveTextContent('Peeraporn Tv'));
  });

  it('cancel reverts without saving', async () => {
    stubGas({});
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Edit your name/i }));
    const input = screen.getByRole('textbox', { name: /Your name/i });
    await user.clear(input);
    await user.type(input, 'Someone Else');
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.getByRole('button', { name: /Edit your name/i })).toHaveTextContent('Peeraporn P');
  });

  it('shows a backend error and keeps editing open instead of losing the draft', async () => {
    stubGas({ updateName: { error: 'ชื่อนี้ถูกใช้แล้ว' } });
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Edit your name/i }));
    const input = screen.getByRole('textbox', { name: /Your name/i });
    await user.clear(input);
    await user.type(input, 'Taken Name');
    await user.click(screen.getByRole('button', { name: /Save name/i }));

    await waitFor(() => expect(screen.getByText('ชื่อนี้ถูกใช้แล้ว')).toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: /Your name/i })).toHaveValue('Taken Name');
  });
});
