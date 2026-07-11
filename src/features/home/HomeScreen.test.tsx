import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from './HomeScreen';
import { AuthProvider } from '../auth/AuthContext';
import { setSession } from '../../lib/session';
import { getProgress, markLesson } from '../../lib/storage';
import { resumeDay } from '../../lib/today';
import { lessonForDay } from '../../data/lessons';

// HomeScreen shows the signed-in user's name (useAuth) and server-synced
// stats (useMyStats, useProgress's pull-sync), so every render needs an
// AuthProvider and a stubbed fetch — same pattern as App.test.tsx.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
});
afterEach(() => vi.unstubAllGlobals());

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
    <AuthProvider>
      <HomeScreen
        onOpenCalc={vi.fn()}
        onOpenLearn={vi.fn()}
        onOpenLesson={vi.fn()}
        onOpenProgress={vi.fn()}
        {...overrides}
      />
    </AuthProvider>,
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

  it('labels the lesson card honestly when the resume day outruns the authored dataset', () => {
    // lessonForDay falls back to the nearest earlier lesson once resumeDay
    // outruns the authored dataset (a learner whose first completion was long
    // ago advances further than there is content for). The header must never
    // claim "Today · Day N" for content that is actually from an earlier day.
    markLesson(1, true, new Date(2020, 0, 1));
    const today = resumeDay(getProgress());
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

describe('<HomeScreen /> — name badge', () => {
  beforeEach(() => {
    setSession({ email: 'a@b.com', name: 'Peeraporn P', role: 'user', token: 'tok-1' });
  });

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
