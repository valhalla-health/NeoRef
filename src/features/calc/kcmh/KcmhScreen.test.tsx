import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { KcmhScreen } from './KcmhScreen';

// Link text is the doc title followed by its caption.
function linkTexts(region: HTMLElement) {
  return within(region)
    .getAllByRole('link')
    .map((link) => link.textContent);
}

describe('KcmhScreen', () => {
  it('groups the documents into guidelines on top and lectures below', () => {
    render(<KcmhScreen />);

    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'Guidelines',
      'Lectures',
    ]);
    expect(linkTexts(screen.getByRole('region', { name: 'Guidelines' }))).toEqual([
      expect.stringMatching(/^Resident handbook/),
      expect.stringMatching(/^Hypoglycemia/),
      expect.stringMatching(/^Jaundice/),
      expect.stringMatching(/^EOS/),
    ]);
    expect(linkTexts(screen.getByRole('region', { name: 'Lectures' }))).toEqual([
      expect.stringMatching(/^Antibiotic overuse in neonatal EOS/),
      expect.stringMatching(/^Practical points for newborn nurture/),
      expect.stringMatching(/^Preterm feeding/),
    ]);
  });

  it('lists every document linking to its source', () => {
    render(<KcmhScreen />);

    // The resident handbook is the one live external page, not a file under public/kcmh/.
    const handbook = screen.getByRole('link', { name: /Resident handbook/ });
    expect(handbook).toHaveAttribute('href', 'https://thaneo.craft.me/resident');
    expect(handbook).toHaveAttribute('rel', 'noreferrer noopener');

    expect(screen.getByRole('link', { name: /Hypoglycemia/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-hypoglycemia-flow-cu.pdf',
    );
    expect(screen.getByRole('link', { name: /Jaundice/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-jaundice-flow-ipd.pdf',
    );
    expect(screen.getByRole('link', { name: /^EOS/ })).toHaveAttribute(
      'href',
      './kcmh/eos-flow-cu.pdf',
    );
    expect(
      screen.getByRole('link', { name: /Antibiotic overuse in neonatal EOS/ }),
    ).toHaveAttribute('href', './kcmh/eos-antibiotic-overuse-cupa-2026.pdf');
    expect(
      screen.getByRole('link', { name: /Practical points for newborn nurture/ }),
    ).toHaveAttribute('href', './kcmh/practical-points-newborn-nurture-2025.pdf');
    expect(screen.getByRole('link', { name: /Preterm feeding/ })).toHaveAttribute(
      'href',
      './kcmh/preterm-feeding-2025.pdf',
    );

    // Every link opens in a new tab rather than navigating the SPA.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toMatch(/\bnoopener\b/);
    }

    expect(screen.getByText(/Educational reference only/i)).toBeInTheDocument();
  });
});
