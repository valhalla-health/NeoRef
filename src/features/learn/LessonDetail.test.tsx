import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonDetail } from './LessonDetail';

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
});
