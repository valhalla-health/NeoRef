import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnScreen } from './LearnScreen';
import { AVERY_LESSONS } from '../../data/lessons';
import { isLessonDone } from '../../lib/storage';

beforeEach(() => localStorage.clear());

function titlePattern(title: string): RegExp {
  return new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

describe('LearnScreen', () => {
  it('lists every lesson, none marked done initially', () => {
    render(<LearnScreen />);
    const first = AVERY_LESSONS[0];
    expect(screen.getByText(first.t)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: titlePattern(first.t) });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks a lesson done on click, persists it, and toggles back off on a second click', async () => {
    const user = userEvent.setup();
    render(<LearnScreen />);
    const lesson = AVERY_LESSONS[2];
    const button = screen.getByRole('button', { name: titlePattern(lesson.t) });

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(isLessonDone(lesson.d)).toBe(true);

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(isLessonDone(lesson.d)).toBe(false);
  });
});
