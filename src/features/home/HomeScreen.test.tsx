import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from './HomeScreen';
import { markLesson } from '../../lib/storage';
import { curriculumDay } from '../../lib/today';
import { lessonForDay } from '../../data/lessons';

// CALCS currently has every entry `ported: true`, so the disabled/"not yet
// ported" quick-tool branch (HomeScreen.tsx onClick guard) is otherwise
// unreachable through real data. Mock a fixture with one unported entry so
// that branch is actually exercised.
vi.mock('../../data/calcs', () => ({
  CALCS: [
    { id: 'eos', label: 'EOS factors', emoji: '🦠', kind: 'education', ported: true },
    { id: 'stub', label: 'Stub Calc', emoji: '🧪', kind: 'reference', ported: false },
  ],
}));

beforeEach(() => localStorage.clear());

describe('HomeScreen', () => {
  it('shows 0% progress and no done badge when nothing is completed', () => {
    render(<HomeScreen onOpenCalc={vi.fn()} onOpenLearn={vi.fn()} />);
    expect(screen.getByText(/0\/365 · 0%/)).toBeInTheDocument();
    expect(screen.queryByText('✓ Done')).not.toBeInTheDocument();
  });

  it("shows the done badge and updated progress once today's lesson is marked complete", () => {
    // HomeScreen keys progress by the *resolved* lesson day (lessonForDay
    // falls back to the nearest earlier lesson), not the raw curriculum day.
    markLesson(lessonForDay(curriculumDay()).d, true);
    render(<HomeScreen onOpenCalc={vi.fn()} onOpenLearn={vi.fn()} />);
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
    expect(screen.getByText(/1\/365/)).toBeInTheDocument();
  });

  it("opens today's lesson via onOpenLearn", async () => {
    const user = userEvent.setup();
    const onOpenLearn = vi.fn();
    render(<HomeScreen onOpenCalc={vi.fn()} onOpenLearn={onOpenLearn} />);
    const lesson = lessonForDay(curriculumDay());
    await user.click(screen.getByText(lesson.t));
    expect(onOpenLearn).toHaveBeenCalledTimes(1);
  });

  it('opens a ported quick tool via onOpenCalc with its id', async () => {
    const user = userEvent.setup();
    const onOpenCalc = vi.fn();
    render(<HomeScreen onOpenCalc={onOpenCalc} onOpenLearn={vi.fn()} />);
    await user.click(screen.getByText('EOS factors'));
    expect(onOpenCalc).toHaveBeenCalledWith('eos');
  });

  it('renders an unported quick tool as disabled and does not call onOpenCalc when clicked', async () => {
    const user = userEvent.setup();
    const onOpenCalc = vi.fn();
    render(<HomeScreen onOpenCalc={onOpenCalc} onOpenLearn={vi.fn()} />);
    const stubButton = screen.getByRole('button', { name: /Stub Calc/ });
    expect(stubButton).toBeDisabled();
    await user.click(stubButton);
    expect(onOpenCalc).not.toHaveBeenCalled();
  });
});
