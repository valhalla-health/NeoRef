// EOS educational content model.
//
// Fixes the single most important AUDIT finding: the prototype computed an
// INVENTED sepsis-risk number (`prior/post per 1000`) from fabricated multipliers
// and then recommended antibiotics. That is removed entirely.
//
// This module instead teaches, qualitatively, WHICH perinatal factors push
// early-onset-sepsis risk up or down and WHY — with no combined score and no
// management recommendation. Directions/magnitudes reflect established EOS
// epidemiology (the real quantitative tool is the Kaiser Permanente calculator,
// linked from the UI). Nothing here should be read as a patient-specific risk.

export type Gbs = 'neg' | 'pos' | 'unk';
export type Iap = 'none' | 'broad' | 'gbs' | 'inad';
export type Exam = 'well' | 'equiv' | 'ill';

export interface EosInputs {
  gaWeeks: number;
  matTempC: number;
  romHours: number;
  gbs: Gbs;
  iap: Iap;
  exam: Exam;
}

export type Direction = 'increases' | 'decreases' | 'neutral';
export type Magnitude = 'minor' | 'moderate' | 'major';

export interface EosFactor {
  key: string;
  label: string;
  /** The current input rendered as a short display value. */
  value: string;
  direction: Direction;
  magnitude: Magnitude;
  /** Didactic explanation — why this factor moves risk in this direction. */
  note: string;
}

function gaFactor({ gaWeeks }: EosInputs): EosFactor {
  let direction: Direction = 'neutral';
  let magnitude: Magnitude = 'minor';
  if (gaWeeks < 34) {
    direction = 'increases';
    magnitude = 'major';
  } else if (gaWeeks < 37) {
    direction = 'increases';
    magnitude = 'moderate';
  } else if (gaWeeks >= 39) {
    direction = 'decreases';
    magnitude = 'minor';
  }
  return {
    key: 'ga',
    label: 'Gestational age',
    value: `${gaWeeks} wk`,
    direction,
    magnitude,
    note: 'Lower gestational age carries higher baseline EOS incidence; term infants sit at the low end of the risk range.',
  };
}

function tempFactor({ matTempC }: EosInputs): EosFactor {
  let direction: Direction = 'neutral';
  let magnitude: Magnitude = 'minor';
  if (matTempC >= 38) {
    direction = 'increases';
    magnitude = 'major';
  } else if (matTempC >= 37.5) {
    direction = 'increases';
    magnitude = 'moderate';
  }
  return {
    key: 'temp',
    label: 'Highest maternal temp',
    value: `${matTempC.toFixed(1)} °C`,
    direction,
    magnitude,
    note: 'Intrapartum fever (≥38 °C) is a marker of chorioamnionitis and the strongest antepartum driver of EOS risk.',
  };
}

function romFactor({ romHours }: EosInputs): EosFactor {
  let direction: Direction = 'neutral';
  let magnitude: Magnitude = 'minor';
  if (romHours >= 18) {
    direction = 'increases';
    magnitude = 'moderate';
  }
  return {
    key: 'rom',
    label: 'Rupture of membranes',
    value: `${romHours} h`,
    direction,
    magnitude,
    note: 'Prolonged rupture (≥18 h) lengthens ascending-infection exposure and modestly raises risk.',
  };
}

function gbsFactor({ gbs }: EosInputs): EosFactor {
  const map: Record<Gbs, Pick<EosFactor, 'value' | 'direction' | 'magnitude'>> = {
    pos: { value: 'Positive', direction: 'increases', magnitude: 'moderate' },
    unk: { value: 'Unknown', direction: 'increases', magnitude: 'minor' },
    neg: { value: 'Negative', direction: 'neutral', magnitude: 'minor' },
  };
  return {
    key: 'gbs',
    label: 'Maternal GBS status',
    ...map[gbs],
    note: 'GBS colonisation raises risk; an unknown status is treated as a small unknown because colonisation cannot be excluded.',
  };
}

function iapFactor({ iap }: EosInputs): EosFactor {
  const map: Record<Iap, Pick<EosFactor, 'value' | 'direction' | 'magnitude'>> = {
    broad: { value: 'Broad-spectrum ≥4 h', direction: 'decreases', magnitude: 'moderate' },
    gbs: { value: 'GBS-specific ≥4 h', direction: 'decreases', magnitude: 'moderate' },
    inad: { value: 'Inadequate (<4 h)', direction: 'decreases', magnitude: 'minor' },
    none: { value: 'None', direction: 'neutral', magnitude: 'minor' },
  };
  return {
    key: 'iap',
    label: 'Intrapartum antibiotics',
    ...map[iap],
    note: 'Adequate intrapartum prophylaxis (≥4 h before delivery) lowers risk; partial/inadequate prophylaxis gives only limited benefit.',
  };
}

function examFactor({ exam }: EosInputs): EosFactor {
  const map: Record<Exam, Pick<EosFactor, 'value' | 'direction' | 'magnitude'>> = {
    ill: { value: 'Clinically ill', direction: 'increases', magnitude: 'major' },
    equiv: { value: 'Equivocal', direction: 'increases', magnitude: 'moderate' },
    well: { value: 'Well-appearing', direction: 'decreases', magnitude: 'moderate' },
  };
  return {
    key: 'exam',
    label: 'Newborn clinical exam',
    ...map[exam],
    note: 'The infant’s exam is the single most influential factor — a clearly ill newborn dominates the assessment, while a persistently well exam is reassuring.',
  };
}

/**
 * Returns the qualitative factor breakdown for the given inputs.
 * Intentionally returns NO numeric risk and NO management recommendation.
 */
export function eosFactors(inputs: EosInputs): EosFactor[] {
  return [
    gaFactor(inputs),
    tempFactor(inputs),
    romFactor(inputs),
    gbsFactor(inputs),
    iapFactor(inputs),
    examFactor(inputs),
  ];
}

export const KAISER_EOS_URL = 'https://neonatalsepsiscalculator.kaiserpermanente.org/';
