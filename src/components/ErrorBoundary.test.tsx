// ErrorBoundary is the fix for the prototype's absent error boundary (a
// render error anywhere used to blank the whole screen). Nothing verified
// it actually catches, shows a recoverable fallback, and resets — this does.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('catches a render error and shows the recoverable fallback instead of a blank screen', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/เกิดข้อผิดพลาดบางอย่าง/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/ })).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('recovers via the reset button once the underlying error condition is fixed', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/เกิดข้อผิดพลาดบางอย่าง/)).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/ }));

    expect(screen.getByText('safe content')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
