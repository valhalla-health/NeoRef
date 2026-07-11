// FentonEducation's underlying banding math has its own unit tests
// (fenton-content.test.ts), but the component wiring around it — grams vs.
// kilograms unit inference at the `<10` boundary, invalid input, and the
// SGA/AGA/LGA band actually rendering — was never exercised.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FentonEducation } from './FentonEducation';
import { PEDITOOLS_FENTON_URL } from './fenton-content';

describe('FentonEducation', () => {
  it('shows the empty-state placeholder (no band) when no weight is entered', () => {
    render(<FentonEducation />);
    expect(screen.getByText(/กรอกน้ำหนักเพื่อดู percentile band/)).toBeInTheDocument();
    expect(screen.queryByText(/AGA · Appropriate for GA/)).not.toBeInTheDocument();
  });

  it('treats input < 10 as kilograms and converts to grams for the band', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    // Default GA is 34 wk, M: Fenton P50 at 34wk/M is 2660g.
    const input = screen.getByLabelText('Birth weight');
    await user.type(input, '2.66');
    expect(screen.getByText('kg')).toBeInTheDocument();
    expect(screen.getByText(/2660 g at 34 wk/)).toBeInTheDocument();
    expect(screen.getByText('P50 – P90')).toBeInTheDocument();
    expect(screen.getByText(/AGA · Appropriate for GA/)).toBeInTheDocument();
  });

  it('treats input >= 10 as grams directly', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    const input = screen.getByLabelText('Birth weight');
    await user.type(input, '2660');
    expect(screen.getByText('g')).toBeInTheDocument();
    expect(screen.getByText(/2660 g at 34 wk/)).toBeInTheDocument();
  });

  it('classifies a low weight as SGA and a high weight as LGA at the same GA', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    const input = screen.getByLabelText('Birth weight');

    await user.type(input, '1500'); // well below P3 (1990) at 34wk/M
    expect(screen.getByText(/SGA · Small for GA/)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '3500'); // above P97 (3420) at 34wk/M
    expect(screen.getByText(/LGA · Large for GA/)).toBeInTheDocument();
  });

  it('falls back to the empty state for non-numeric input', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    const input = screen.getByLabelText('Birth weight');
    await user.type(input, 'abc');
    expect(screen.getByText(/กรอกน้ำหนักเพื่อดู percentile band/)).toBeInTheDocument();
  });

  it('recomputes the band when GA changes via the slider', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    const input = screen.getByLabelText('Birth weight');
    await user.type(input, '2660');
    expect(screen.getByText(/2660 g at 34 wk/)).toBeInTheDocument();

    const slider = screen.getByLabelText('Gestational age in completed weeks');
    fireEvent.change(slider, { target: { value: '28' } });
    expect(screen.getByText(/2660 g at 28 wk/)).toBeInTheDocument();
  });

  it('recomputes the band when sex is switched to Female', async () => {
    const user = userEvent.setup();
    render(<FentonEducation />);
    const input = screen.getByLabelText('Birth weight');
    // 2660g at 34wk is exactly P50 for males (AGA); Fenton-F's P50 at 34wk
    // is 2640g, so the same weight should still land AGA but the band
    // reference anchors should reflect the female table.
    await user.click(screen.getByRole('button', { name: 'Female' }));
    await user.type(input, '2660');
    expect(screen.getByText(/P10 2250 g/)).toBeInTheDocument();
  });

  it('links to the official PediTools Fenton calculator', () => {
    render(<FentonEducation />);
    const link = screen.getByRole('link', { name: /Open the official PediTools Fenton calculator/ });
    expect(link).toHaveAttribute('href', PEDITOOLS_FENTON_URL);
  });
});
