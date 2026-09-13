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
  it('renders a boxed-list table as one callout with a bullet per row, and splits middle-dot prose', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ...SAMPLE_CONTENT,
            blocks: [
              {
                type: 'table',
                rows: [
                  ['Causes of hypovolemia (Box 33.1)'],
                  ['Decreased blood return from the placenta'],
                  ['Hemorrhage from the fetal side of the placenta'],
                  ['Incision through the placenta at cesarean delivery'],
                ],
              },
              {
                type: 'p',
                text:
                  'Perinatal period: long lead clause describing the definition in use here · WHO (2004) moved the start to 22 weeks of gestation · this chapter uses the second half of pregnancy',
              },
            ],
          }),
      }),
    );

    render(<LessonDetail day={1} />);

    // Boxed list: the heading row becomes the callout's title, the rest bullets -
    // not a one-column table where only the first row looked styled.
    await waitFor(() =>
      expect(screen.getByText('Causes of hypovolemia (Box 33.1)')).toBeInTheDocument(),
    );
    expect(screen.getByText('Decreased blood return from the placenta')).toBeInTheDocument();
    expect(screen.getByText('Incision through the placenta at cesarean delivery')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Middle-dot prose is split into one line per clause.
    expect(screen.getByText('WHO (2004) moved the start to 22 weeks of gestation')).toBeInTheDocument();
  });

  it('renders a multi-line "Key points" callout as one bullet per line, not one block', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ...SAMPLE_CONTENT,
            blocks: [
              {
                type: 'callout',
                text:
                  'Key points\n' +
                  'First key point on its own line\n' +
                  'Second point opens with a long lead clause padded out with extra words so it alone crosses the dense-prose length threshold for splitting · plus a second middle-dot clause of its own\n' +
                  'Third key point, short and simple',
              },
            ],
          }),
      }),
    );

    render(<LessonDetail day={1} />);

    await waitFor(() => expect(screen.getByText('Key points')).toBeInTheDocument());
    // Each authored line is its own bullet...
    expect(screen.getByText('First key point on its own line')).toBeInTheDocument();
    expect(screen.getByText('Third key point, short and simple')).toBeInTheDocument();
    // ...and a line that's itself dense (has a middle dot) is split further.
    expect(
      screen.getByText(
        'Second point opens with a long lead clause padded out with extra words so it alone crosses the dense-prose length threshold for splitting',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('plus a second middle-dot clause of its own')).toBeInTheDocument();
    // The whole un-split body (the old, buggy rendering) must not appear.
    expect(screen.queryByText(/First key point on its own line\s*Second point/)).not.toBeInTheDocument();
  });

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

  it('cycles the text-size zoom through 1.5x/2x/2.5x back to normal and persists it', async () => {
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
    expect(screen.getByRole('button', { name: /Text size 1.5×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(1.5);
    expect(getComputedStyle(bulletText.parentElement!).fontSize).not.toBe(baseFontSize);

    await user.click(screen.getByRole('button', { name: /Text size 1.5×/i }));
    expect(screen.getByRole('button', { name: /Text size 2×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(2);

    await user.click(screen.getByRole('button', { name: /Text size 2×/i }));
    expect(screen.getByRole('button', { name: /Text size 2.5×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(2.5);

    await user.click(screen.getByRole('button', { name: /Text size 2.5×/i }));
    expect(screen.getByRole('button', { name: /Text size 1×/i })).toBeInTheDocument();
    expect(getFontScale()).toBe(1);
  });
});
