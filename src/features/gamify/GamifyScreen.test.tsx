import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamifyScreen } from './GamifyScreen';
import { markLesson, recordToolOpen } from '../../lib/storage';
import { CALCS } from '../../data/calcs';

beforeEach(() => localStorage.clear());

describe('GamifyScreen', () => {
  it('starts at level 1 with no achievements earned', () => {
    render(<GamifyScreen />);
    expect(screen.getByText('Med Student')).toBeInTheDocument();
    expect(screen.getByText(`Achievements · 0/${9}`)).toBeInTheDocument();
    // "0/365" appears twice: the "Lessons" stat tile and the locked "complete" badge.
    expect(screen.getAllByText('0/365').length).toBe(2);
  });

  it('shows the "First Steps" badge as earned once a lesson is completed', () => {
    markLesson(1, true, new Date(2026, 0, 1));
    render(<GamifyScreen />);
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Earned').length).toBeGreaterThan(0);
    // "1/365" appears twice: the "Lessons" stat tile and the locked "complete" badge.
    expect(screen.getAllByText('1/365').length).toBe(2);
  });

  it('shows tool-usage progress toward the Toolsmith badge', () => {
    recordToolOpen(CALCS[0].id);
    render(<GamifyScreen />);
    expect(screen.getByText('Toolsmith')).toBeInTheDocument();
    // Both the "Tools tried" stat tile and the Toolsmith badge render "1/12".
    expect(screen.getAllByText(`1/${CALCS.length}`).length).toBe(2);
  });
});
