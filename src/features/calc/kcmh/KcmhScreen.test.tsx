import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KcmhScreen } from './KcmhScreen';

describe('KcmhScreen', () => {
  it('lists all 4 documents linking to their static files', () => {
    render(<KcmhScreen />);

    expect(screen.getByRole('link', { name: /Hypoglycemia/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-hypoglycemia-flow-cu.pdf',
    );
    expect(screen.getByRole('link', { name: /Jaundice/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-jaundice-flow-ipd.pdf',
    );
    expect(screen.getByRole('link', { name: /^EOS/ })).toHaveAttribute('href', './kcmh/eos-flow-cu.pdf');
    expect(screen.getByRole('link', { name: /Practical points for newborn nurture/ })).toHaveAttribute(
      'href',
      './kcmh/practical-points-newborn-nurture-2025.pdf',
    );

    // Every link opens the raw file in a new tab rather than navigating the SPA.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    }

    expect(screen.getByText(/Educational reference only/i)).toBeInTheDocument();
  });
});
