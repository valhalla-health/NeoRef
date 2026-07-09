import { describe, it, expect } from 'vitest';
import { eosFactors, type EosInputs } from './eos-content';

const base: EosInputs = {
  gaWeeks: 38,
  matTempC: 37.0,
  romHours: 4,
  gbs: 'neg',
  iap: 'none',
  exam: 'well',
};

describe('eosFactors — educational repositioning (regression for the invented EOS model)', () => {
  it('returns one factor per input, and never a numeric risk score', () => {
    const factors = eosFactors(base);
    expect(factors).toHaveLength(6);
    // No factor exposes a per-1000 probability or any combined number.
    for (const f of factors) {
      expect(f).not.toHaveProperty('risk');
      expect(f).not.toHaveProperty('score');
      expect(JSON.stringify(f)).not.toMatch(/\/1000|per 1000/i);
    }
  });

  it('higher maternal temperature increases risk direction', () => {
    const cool = eosFactors({ ...base, matTempC: 37.0 }).find((f) => f.key === 'temp')!;
    const fever = eosFactors({ ...base, matTempC: 38.5 }).find((f) => f.key === 'temp')!;
    expect(cool.direction).toBe('neutral');
    expect(fever.direction).toBe('increases');
    expect(fever.magnitude).toBe('major');
  });

  it('lower gestational age increases risk; term is neutral or protective', () => {
    expect(eosFactors({ ...base, gaWeeks: 33 }).find((f) => f.key === 'ga')!.magnitude).toBe('major');
    expect(eosFactors({ ...base, gaWeeks: 35 }).find((f) => f.key === 'ga')!.direction).toBe('increases');
    expect(eosFactors({ ...base, gaWeeks: 40 }).find((f) => f.key === 'ga')!.direction).toBe('decreases');
  });

  it('adequate intrapartum prophylaxis decreases risk', () => {
    expect(eosFactors({ ...base, iap: 'broad' }).find((f) => f.key === 'iap')!.direction).toBe('decreases');
    expect(eosFactors({ ...base, iap: 'none' }).find((f) => f.key === 'iap')!.direction).toBe('neutral');
  });

  it('an ill exam is the strongest risk-increasing factor', () => {
    const ill = eosFactors({ ...base, exam: 'ill' }).find((f) => f.key === 'exam')!;
    const well = eosFactors({ ...base, exam: 'well' }).find((f) => f.key === 'exam')!;
    expect(ill.direction).toBe('increases');
    expect(ill.magnitude).toBe('major');
    expect(well.direction).toBe('decreases');
  });

  it('prolonged ROM (≥18h) increases risk; short ROM is neutral', () => {
    expect(eosFactors({ ...base, romHours: 24 }).find((f) => f.key === 'rom')!.direction).toBe('increases');
    expect(eosFactors({ ...base, romHours: 4 }).find((f) => f.key === 'rom')!.direction).toBe('neutral');
  });

  it('never emits a management/antibiotic recommendation string', () => {
    const blob = JSON.stringify(eosFactors({ ...base, exam: 'ill', gaWeeks: 34 })).toLowerCase();
    expect(blob).not.toMatch(/ampicillin|gentamicin|empiric antibiotic|blood culture/);
  });
});
