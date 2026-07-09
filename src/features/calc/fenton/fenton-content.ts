// Fenton 2013 growth-band content model.
//
// AUDIT finding (fenton.jsx:64-77): the prototype linearly interpolated
// between five percentile anchor points to print a false-precision result
// like "P52". Per AUDIT's remediation options ("load true Fenton 2013 LMS
// values, or drop the sharp percentile and show only the SGA/AGA/LGA band"),
// this module takes the second option — it classifies a weight into its
// percentile BAND only (e.g. "P10–P50") and an SGA/AGA/LGA category, with no
// interpolated single-number percentile. For an exact percentile, the UI
// links to the official PediTools Fenton calculator.
//
// The five anchor values themselves (P3/P10/P50/P90/P97 in grams, by
// completed week and sex) are approximations of the published Fenton 2013
// chart, ported verbatim from the prototype — banding against them is safe
// even though they are not exact LMS-derived values, because band
// boundaries tolerate small approximation error far better than a precise
// percentile number would.

export type Sex = 'M' | 'F';
export type GrowthCategory = 'SGA' | 'AGA' | 'LGA';

// [P3, P10, P50, P90, P97] in grams, by completed week of gestation.
const FENTON_M: Record<number, [number, number, number, number, number]> = {
  22: [360, 410, 480, 560, 610],
  23: [430, 490, 570, 660, 720],
  24: [510, 580, 670, 780, 850],
  25: [600, 680, 790, 920, 1010],
  26: [700, 800, 920, 1080, 1180],
  27: [820, 940, 1080, 1250, 1370],
  28: [950, 1080, 1240, 1430, 1560],
  29: [1090, 1240, 1430, 1660, 1820],
  30: [1240, 1410, 1640, 1900, 2080],
  31: [1410, 1610, 1870, 2180, 2390],
  32: [1580, 1810, 2110, 2470, 2710],
  33: [1780, 2040, 2380, 2790, 3060],
  34: [1990, 2270, 2660, 3110, 3420],
  35: [2200, 2510, 2940, 3440, 3780],
  36: [2410, 2750, 3220, 3760, 4140],
  37: [2590, 2940, 3440, 4020, 4430],
  38: [2750, 3110, 3640, 4250, 4690],
  39: [2890, 3260, 3810, 4440, 4900],
  40: [3000, 3360, 3920, 4570, 5050],
  41: [3100, 3450, 4000, 4640, 5120],
  42: [3160, 3500, 4030, 4660, 5160],
};

const FENTON_F: Record<number, [number, number, number, number, number]> = {
  22: [340, 390, 460, 540, 590],
  23: [410, 470, 550, 640, 700],
  24: [490, 560, 650, 760, 830],
  25: [580, 660, 770, 900, 990],
  26: [680, 780, 900, 1060, 1160],
  27: [800, 920, 1060, 1230, 1350],
  28: [930, 1060, 1220, 1410, 1540],
  29: [1070, 1220, 1410, 1640, 1800],
  30: [1220, 1390, 1620, 1880, 2060],
  31: [1390, 1590, 1850, 2160, 2370],
  32: [1560, 1790, 2090, 2450, 2690],
  33: [1760, 2020, 2360, 2770, 3040],
  34: [1970, 2250, 2640, 3090, 3400],
  35: [2180, 2490, 2920, 3420, 3760],
  36: [2390, 2730, 3200, 3740, 4120],
  37: [2570, 2920, 3420, 4000, 4410],
  38: [2730, 3090, 3620, 4230, 4670],
  39: [2870, 3240, 3790, 4420, 4880],
  40: [2980, 3340, 3900, 4550, 5030],
  41: [3080, 3430, 3980, 4620, 5100],
  42: [3140, 3480, 4010, 4640, 5140],
};

const MIN_GA = 22;
const MAX_GA = 42;

export interface FentonBand {
  /** Percentile band label — never a single interpolated number. */
  label: string;
  category: GrowthCategory;
  /** Reference anchors for the given GA/sex, for display only. */
  p10: number;
  p50: number;
  p90: number;
}

export function fentonBand(weightGrams: number, gaWeeks: number, sex: Sex): FentonBand {
  const table = sex === 'F' ? FENTON_F : FENTON_M;
  const clampedGa = Math.max(MIN_GA, Math.min(MAX_GA, Math.round(gaWeeks)));
  const [p3, p10, p50, p90, p97] = table[clampedGa];

  let label: string;
  let category: GrowthCategory;
  if (weightGrams < p3) {
    label = '< P3';
    category = 'SGA';
  } else if (weightGrams < p10) {
    label = 'P3 – P10';
    category = 'SGA';
  } else if (weightGrams < p50) {
    label = 'P10 – P50';
    category = 'AGA';
  } else if (weightGrams < p90) {
    label = 'P50 – P90';
    category = 'AGA';
  } else if (weightGrams < p97) {
    label = 'P90 – P97';
    category = 'LGA';
  } else {
    label = '≥ P97';
    category = 'LGA';
  }

  return { label, category, p10, p50, p90 };
}

export const PEDITOOLS_FENTON_URL = 'https://peditools.org/fenton2013/';
