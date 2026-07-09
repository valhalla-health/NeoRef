import { describe, it, expect } from 'vitest';
import { fentonBand } from './fenton-content';

describe('fentonBand — banded output only (regression for the false-precision percentile)', () => {
  it('never returns an interpolated single-number percentile field', () => {
    const result = fentonBand(2400, 34, 'M');
    expect(result).not.toHaveProperty('pct');
    expect(result).not.toHaveProperty('percentile');
  });

  it('classifies a weight strictly between P10 and P50 as AGA, band P10–P50', () => {
    // GA 34 male: P10=2270, P50=2660 — 2400 sits strictly between them.
    const result = fentonBand(2400, 34, 'M');
    expect(result.category).toBe('AGA');
    expect(result.label).toBe('P10 – P50');
  });

  it('classifies a weight exactly at the P50 anchor into the P50–P90 band', () => {
    // The boundary comparison is `< p50`, so equality falls into the next band up.
    const result = fentonBand(2660, 34, 'M');
    expect(result.category).toBe('AGA');
    expect(result.label).toBe('P50 – P90');
  });

  it('classifies below P3 as SGA with the "< P3" band', () => {
    const result = fentonBand(1500, 34, 'M');
    expect(result.category).toBe('SGA');
    expect(result.label).toBe('< P3');
  });

  it('classifies at/above P97 as LGA with the "≥ P97" band', () => {
    const result = fentonBand(3500, 34, 'M');
    expect(result.category).toBe('LGA');
    expect(result.label).toBe('≥ P97');
  });

  it('uses the female table when sex is F', () => {
    // GA 34: male P50=2660, female P50=2640 — 2650g is below male's P50
    // (P10–P50 band) but at/above female's P50 (P50–P90 band).
    const male = fentonBand(2650, 34, 'M');
    const female = fentonBand(2650, 34, 'F');
    expect(male.label).toBe('P10 – P50');
    expect(female.label).toBe('P50 – P90');
  });

  it('clamps gestational age to the supported 22–42 week range', () => {
    expect(() => fentonBand(1000, 10, 'M')).not.toThrow();
    expect(() => fentonBand(4000, 50, 'M')).not.toThrow();
  });
});
