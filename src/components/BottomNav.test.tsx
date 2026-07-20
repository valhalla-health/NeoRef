import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('<BottomNav />', () => {
  it('renders all 5 tabs including KCMH, with no separate Ranks tab', () => {
    render(<BottomNav active="home" onChange={() => {}} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('KCMH')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.queryByText('Ranks')).not.toBeInTheDocument();
  });

  it('fires onChange with "kcmh" when the KCMH tab is clicked, placed right after Tools', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav active="home" onChange={onChange} />);
    const labels = screen.getAllByText(/^(Tools|KCMH|Learn)$/).map((el) => el.textContent);
    expect(labels).toEqual(['Tools', 'KCMH', 'Learn']);
    await user.click(screen.getByText('KCMH'));
    expect(onChange).toHaveBeenCalledWith('kcmh');
  });

  it('fires onChange with "progress" when the Progress tab is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav active="home" onChange={onChange} />);
    await user.click(screen.getByText('Progress'));
    expect(onChange).toHaveBeenCalledWith('progress');
  });
});
