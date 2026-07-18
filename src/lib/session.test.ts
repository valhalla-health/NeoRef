import { describe, it, expect, beforeEach } from 'vitest';
import { getSession, setSession, clearSession } from './session';

const SAMPLE = { email: 'a@b.com', name: 'A B', role: 'user', token: 'tok-123', hasPassword: true };

beforeEach(() => localStorage.clear());

describe('session', () => {
  it('starts empty', () => {
    expect(getSession()).toBeNull();
  });

  it('round-trips a session', () => {
    setSession(SAMPLE);
    expect(getSession()).toEqual(SAMPLE);
  });

  it('clears a session', () => {
    setSession(SAMPLE);
    clearSession();
    expect(getSession()).toBeNull();
  });

  it('ignores an unversioned/legacy payload instead of crashing', () => {
    localStorage.setItem('neoref:session', JSON.stringify(SAMPLE));
    expect(getSession()).toBeNull();
  });

  it('ignores a wrong-shape payload gracefully', () => {
    localStorage.setItem('neoref:session', JSON.stringify({ v: 1, data: { email: 'a@b.com' } }));
    expect(getSession()).toBeNull();
  });

  it('ignores corrupt JSON gracefully', () => {
    localStorage.setItem('neoref:session', '{not json');
    expect(getSession()).toBeNull();
  });
});
