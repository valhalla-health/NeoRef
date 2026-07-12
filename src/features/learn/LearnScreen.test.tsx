import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnScreen } from './LearnScreen';
import { LESSONS } from '../../data/lessons';
import { isLessonDone } from '../../lib/storage';

beforeEach(() => localStorage.clear());

describe('LearnScreen', () => {
  it('lists every lesson, none marked done initially', () => {
    render(<LearnScreen onOpenLesson={vi.fn()} />);
    const first = LESSONS[0];
    expect(screen.getByText(first.title)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('opens a lesson via onOpenLesson when the card is clicked', async () => {
    const user = userEvent.setup();
    const onOpenLesson = vi.fn();
    render(<LearnScreen onOpenLesson={onOpenLesson} />);
    const lesson = LESSONS[2];
    await user.click(screen.getByText(lesson.title));
    expect(onOpenLesson).toHaveBeenCalledWith(lesson.day);
  });

  it('marks a lesson done via its checkbox (a standalone, keyboard-reachable button — not nested inside the open-lesson button) without opening it, persists it, and toggles back off', async () => {
    const user = userEvent.setup();
    const onOpenLesson = vi.fn();
    render(<LearnScreen onOpenLesson={onOpenLesson} />);
    const lesson = LESSONS[2];
    const checkbox = screen.getAllByRole('checkbox')[2];
    expect(checkbox.closest('button')).not.toBe(screen.getByText(lesson.title).closest('button'));

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(isLessonDone(lesson.day)).toBe(true);
    expect(onOpenLesson).not.toHaveBeenCalled();

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(isLessonDone(lesson.day)).toBe(false);
  });

  it('shows a clear button while searching that resets the query', async () => {
    const user = userEvent.setup();
    render(<LearnScreen onOpenLesson={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: /search lessons/i }), 'jaundice');
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);

    expect(screen.getByRole('searchbox', { name: /search lessons/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });
});
