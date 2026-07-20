import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KcmhScreen } from './KcmhScreen';

describe('KcmhScreen', () => {
  it('lists all 4 documents, PDFs linking to static files and the image opening in-app', () => {
    render(<KcmhScreen />);

    expect(screen.getByRole('link', { name: /Hypoglycemia/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-hypoglycemia-flow-cu.pdf',
    );
    expect(screen.getByRole('link', { name: /Jaundice/ })).toHaveAttribute(
      'href',
      './kcmh/neonatal-jaundice-flow-ipd.pdf',
    );
    expect(screen.getByRole('link', { name: /Practical points for newborn nurture/ })).toHaveAttribute(
      'href',
      './kcmh/practical-points-newborn-nurture-2025.pdf',
    );

    // PDF links open the raw file in a new tab rather than navigating the SPA.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    }

    // EOS is an image — it's a button, not a link, so it opens in-app instead
    // of a new tab (which would strand the hardware back button outside the app).
    expect(screen.getByRole('button', { name: /^EOS/ })).toBeInTheDocument();

    expect(screen.getByText(/Educational reference only/i)).toBeInTheDocument();
  });

  it('opens the EOS image in an in-app viewer with a back button to KCMH', async () => {
    const user = userEvent.setup();
    const onOpenDoc = vi.fn();
    render(<KcmhScreen onOpenDoc={onOpenDoc} />);

    await user.click(screen.getByRole('button', { name: /^EOS/ }));
    expect(onOpenDoc).toHaveBeenCalledWith('eos');

    render(<KcmhScreen openDocId="eos" onOpenDoc={onOpenDoc} />);
    expect(screen.getByRole('img', { name: 'EOS' })).toHaveAttribute('src', './kcmh/eos-flow-cu.jpg');

    await user.click(screen.getByRole('button', { name: /KCMH/ }));
    expect(onOpenDoc).toHaveBeenCalledWith(null);
  });
});
