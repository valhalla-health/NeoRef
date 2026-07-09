import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EosEducation } from './EosEducation';

describe('<EosEducation />', () => {
  it('renders the educational disclaimer', () => {
    render(<EosEducation />);
    expect(screen.getByText(/Educational reference only/i)).toBeInTheDocument();
  });

  it('does NOT render an invented per-1000 risk number or antibiotic recommendation', () => {
    const { container } = render(<EosEducation />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\/1000/);
    expect(text).not.toMatch(/Ampicillin|Gentamicin|Empiric antibiotics/i);
  });

  it('links out to the official Kaiser calculator', () => {
    render(<EosEducation />);
    const link = screen.getByRole('link', { name: /Kaiser EOS calculator/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('kaiserpermanente.org'));
  });

  it('shows the factor breakdown heading', () => {
    render(<EosEducation />);
    expect(screen.getByText(/How each factor moves risk/i)).toBeInTheDocument();
  });
});
