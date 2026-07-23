import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonDetail } from './LessonDetail';
import { isBookmarked, getFontScale } from '../../lib/storage';

beforeEach(() => localStorage.clear());

const SAMPLE_CONTENT = {
  day: 1,
  book: 'Avery',
  chapter: 1,
  title: 'Neonatal and Perinatal Epidemiology',
  authors: "Paneth, Patel & O'Shea Jr.",
  blocks: [
    { type: 'callout', text: 'Why this matters' },
    { type: 'h1', text: 'Key Definitions' },
    { type: 'li', text: 'A bullet point' },
    { type: 'table', rows: [['Header'], ['Value']] },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<LessonDetail />', () => {
  it('shows a loading state, then renders fetched lesson content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SAMPLE_CONTENT) }),
    );

    render(<LessonDetail day={1} />);
    expect(screen.getByText(/Loading lesson/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Key Definitions')).toBeInTheDocument());
    expect(screen.getByText('Why this matters')).toBeInTheDocument();
    expect(screen.getByText('A bullet point')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/lessons/day-001.json');
  });

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    render(<LessonDetail day={1} />);
    await waitFor(() => expect(screen.getByText(/Couldn't load/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('retries the fetch when "Try again" is clicked after a failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(SAMPLE_CONTENT) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<LessonDetail day={1} />);
    await waitFor(() => expect(screen.getByText(/Couldn't load/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('Key Definitions')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('toggles the mark-done button and persists to storage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SAMPLE_CONTENT) }),
    );
    const user = userEvent.setup();
    render(<LessonDetail day={1} />);

    const button = await screen.findByRole('button', { name: /Mark done/i });
    await user.click(button);
    expect(screen.getByRole('button', { name: /✓ Done/i })).toBeInTheDocument();
  });

  it('toggles the bookmark button and persists to storage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SAMPLE_CONTENT) }),
    );
    const user = userEvent.setup();
    render(<LessonDetail day={1} />);

    const button = await screen.findByRole('button', { name: /Bookmark this lesson/i });
    await user.click(button);
    expect(screen.getByRole('button', { name: /Remove bookmark/i })).toBeInTheDocument();
    expect(isBookmarked('lesson-1')).toBe(true);

    await user.click(screen.getByRole('button', { name: /Remove bookmark/i }));
    expect(screen.getByRole('button', { name: /Bookmark this lesson/i })).toBeInTheDocument();
    expect(isBookmarked('lesson-1')).toBe(false);
  });

  it('cycles the text-size zoom through 2x/3x/4x back to normal and persists it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SAMPLE_CONTENT) }),
    );
    const user = userEvent.setup();
    render(<LessonDetail day={1} />);
    await screen.findByText('Key Definitions');

    const zoomButton = screen.getByRole('button', { name: /Text size 1×/i });
    const bulletText = screen.getByText('A bullet point');
    const baseFontSize = getComputedStyle(bulletText.parentElement!).fontSize;

    await user.click(zoomButton);
    expect(screen.getByRole('button', { name: /Text size 2×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(2);
    expect(getComputedStyle(bulletText.parentElement!).fontSize).not.toBe(baseFontSize);

    await user.click(screen.getByRole('button', { name: /Text size 2×/i }));
    expect(screen.getByRole('button', { name: /Text size 3×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(3);

    await user.click(screen.getByRole('button', { name: /Text size 3×/i }));
    expect(screen.getByRole('button', { name: /Text size 4×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(4);

    await user.click(screen.getByRole('button', { name: /Text size 4×/i }));
    expect(screen.getByRole('button', { name: /Text size 1×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(1);
  });
});
