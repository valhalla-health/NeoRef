import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('<App /> — end-to-end shell', () => {
  it('renders home with the educational disclaimer and a live curriculum day', () => {
    render(<App />);
    expect(screen.getAllByText(/Newborn/).length).toBeGreaterThan(0);
    expect(screen.getByRole('note')).toHaveTextContent(/Educational reference only/i);
    // "Today · Day N" is computed from the real clock, never the frozen 139.
    expect(screen.getByText(/Today · Day \d+/)).toBeInTheDocument();
  });

  it('navigates Home → Tools → EOS and shows the educational screen (no invented risk)', async () => {
    const user = userEvent.setup();
    render(<App />);

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
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });
    await user.click(within(nav).getByText('Learn'));
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
    expect(screen.getByText(/Neonatal and Perinatal Epidemiology/i)).toBeInTheDocument();
  });
});
