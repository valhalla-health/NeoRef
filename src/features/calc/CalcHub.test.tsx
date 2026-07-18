import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalcHub } from './CalcHub';

// CALCS currently has every entry `ported: true`, so the disabled/"porting"
// branch is otherwise unreachable through real data. Mock a fixture with
// one unported entry so that branch is actually exercised.
vi.mock('../../data/calcs', () => ({
  CALCS: [
    { id: 'eos', label: 'EOS factors', emoji: '🦠', kind: 'education', ported: true },
    { id: 'stub', label: 'Stub Calc', emoji: '🧪', kind: 'reference', ported: false },
  ],
}));

describe('CalcHub', () => {
  it('calls onSelect with the id of a ported calc when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalcHub onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /EOS factors/ }));
    expect(onSelect).toHaveBeenCalledWith('eos');
  });

  it('renders an unported calc as disabled, labelled "porting", and does not call onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalcHub onSelect={onSelect} />);
    const stubButton = screen.getByRole('button', { name: /Stub Calc/ });
    expect(stubButton).toBeDisabled();
    expect(screen.getByText('porting')).toBeInTheDocument();
    await user.click(stubButton);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
