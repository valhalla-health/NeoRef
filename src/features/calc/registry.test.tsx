// Regression test for the calc registry: every calc marked `ported: true` in
// CALCS must have a working entry in CALC_SCREENS and must actually render
// (via the real App navigation) without throwing, with the disclaimer
// visible and a working back button. Catches import/naming mismatches that
// per-file typechecking alone would not (each screen was ported by a
// separate pass and only typechecked in isolation).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { AuthProvider } from '../auth/AuthContext';
import { setSession } from '../../lib/session';
import { CALCS } from '../../data/calcs';

const ported = CALCS.filter((c) => c.ported);

// See App.test.tsx — the shell now requires a signed-in session.
beforeEach(() => {
  localStorage.clear();
  setSession({ email: 'test@example.com', name: 'Test User', role: 'user', token: 'test-token' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
});
afterEach(() => vi.unstubAllGlobals());

describe('calc registry — every ported calculator renders via the real hub', () => {
  it.each(ported)('$id ($label) renders with a disclaimer and returns to the hub', async (calc) => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    const nav = screen.getByRole('navigation', { name: /primary/i });
    await user.click(within(nav).getByText('Tools'));

    await user.click(screen.getByRole('button', { name: new RegExp(calc.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));

    // Every ported screen shows the educational disclaimer somewhere.
    expect(screen.getByText(/Educational reference only/i)).toBeInTheDocument();

    // Back button returns to the hub (Clinical Tools grid).
    const backButton = screen.getByRole('button', { name: /เครื่องมือ/ });
    await user.click(backButton);
    expect(screen.getByText(/Clinical/)).toBeInTheDocument();
  });
});
