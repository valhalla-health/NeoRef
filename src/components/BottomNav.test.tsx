import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('<BottomNav />', () => {
  it('renders all 4 tabs including the leaderboard tab', () => {
    render(<BottomNav active="home" onChange={() => {}} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Ranks')).toBeInTheDocument();
  });

  it('fires onChange with "leaderboard" when the Ranks tab is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav active="home" onChange={onChange} />);
    await user.click(screen.getByText('Ranks'));
    expect(onChange).toHaveBeenCalledWith('leaderboard');
  });
});
