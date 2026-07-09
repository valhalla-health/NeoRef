import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from './HomeScreen';
import { getProgress, markLesson } from '../../lib/storage';
import { resumeDay } from '../../lib/today';
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

function renderHome(overrides: Partial<Parameters<typeof HomeScreen>[0]> = {}) {
  return render(
    <HomeScreen
      onOpenCalc={vi.fn()}
      onOpenLearn={vi.fn()}
      onOpenLesson={vi.fn()}
      onOpenProgress={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => localStorage.clear());

describe('HomeScreen', () => {
  it('shows 0% progress and no done badge when nothing is completed', () => {
    renderHome();
    expect(screen.getByText(/0\/365 · 0%/)).toBeInTheDocument();
    expect(screen.queryByText('✓ Done')).not.toBeInTheDocument();
  });

  it("shows the done badge and updated progress once today's lesson is marked complete", () => {
    // HomeScreen keys progress by the *resolved* lesson day (lessonForDay
    // falls back to the nearest earlier lesson), not the raw resume day.
    markLesson(lessonForDay(resumeDay(getProgress())).day, true);
    renderHome();
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
    expect(screen.getByText(/1\/365/)).toBeInTheDocument();
  });

  it("opens today's lesson via onOpenLesson with its day number", async () => {
    const user = userEvent.setup();
    const onOpenLesson = vi.fn();
    renderHome({ onOpenLesson });
    const lesson = lessonForDay(resumeDay(getProgress()));
    await user.click(screen.getByText(lesson.title));
    expect(onOpenLesson).toHaveBeenCalledWith(lesson.day);
  });

  it('opens the full lesson list via "See all lessons"', async () => {
    const user = userEvent.setup();
    const onOpenLearn = vi.fn();
    renderHome({ onOpenLearn });
    await user.click(screen.getByText(/See all lessons/));
    expect(onOpenLearn).toHaveBeenCalledTimes(1);
  });

  it('opens a ported quick tool via onOpenCalc with its id', async () => {
    const user = userEvent.setup();
    const onOpenCalc = vi.fn();
    renderHome({ onOpenCalc });
    await user.click(screen.getByText('EOS factors'));
    expect(onOpenCalc).toHaveBeenCalledWith('eos');
  });

  it('renders an unported quick tool as disabled and does not call onOpenCalc when clicked', async () => {
    const user = userEvent.setup();
    const onOpenCalc = vi.fn();
    renderHome({ onOpenCalc });
    const stubButton = screen.getByRole('button', { name: /Stub Calc/ });
    expect(stubButton).toBeDisabled();
    await user.click(stubButton);
    expect(onOpenCalc).not.toHaveBeenCalled();
  });

  it('shows the starting level and opens the Progress tab when the level card is tapped', async () => {
    const user = userEvent.setup();
    const onOpenProgress = vi.fn();
    renderHome({ onOpenProgress });
    expect(screen.getByText('Med Student')).toBeInTheDocument();
    await user.click(screen.getByText('Med Student'));
    expect(onOpenProgress).toHaveBeenCalledTimes(1);
  });

  it('gains XP and levels up as lessons are completed', () => {
    markLesson(lessonForDay(resumeDay(getProgress())).day, true);
    renderHome();
    expect(screen.getByText(/10\/50 XP/)).toBeInTheDocument();
  });

  it('labels the lesson card honestly when the dataset lags behind the real curriculum day', () => {
    // lessonForDay falls back to the nearest earlier lesson once the real-clock
    // curriculum day outruns the authored dataset. The header must never claim
    // "Today · Day N" for content that is actually from an earlier day.
    const today = curriculumDay();
    const lesson = lessonForDay(today);
    renderHome();
    if (lesson.day === today) {
      expect(screen.getByText(`Today · Day ${today}`)).toBeInTheDocument();
    } else {
      expect(screen.getByText(`Latest lesson · Day ${lesson.day}`)).toBeInTheDocument();
      expect(screen.queryByText(`Today · Day ${today}`)).not.toBeInTheDocument();
    }
    expect(screen.getByText(new RegExp(`Day ${lesson.day} · Ch ${lesson.chapter}`))).toBeInTheDocument();
  });
});
