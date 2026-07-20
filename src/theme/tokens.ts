// Design tokens — ported verbatim from the prototype's `warmTheme` (warm.jsx)
// "Warm Reading" palette: paper + terracotta. Single source of truth for color
// and typography across the app.

export const warm = {
  paper: '#F6EFE3',
  paperDeep: '#EFE5D2',
  ink: '#1F1812',
  ink2: '#4A3E32',
  muted: '#8A7B69',
  terra: '#C0593A',
  terraDeep: '#9C4226',
  ochre: '#B8893A',
  sage: '#5B6E50',
  card: '#FFFBF3',
  line: '#E4D5BC',
  warn: '#B23A2A',
} as const;

export type WarmTheme = typeof warm;

// Self-hosted font stacks (loaded via @fontsource in main.tsx — no CDN).
export const font = {
  head: "'Source Sans 3 Variable', 'Sarabun', Tahoma, sans-serif",
  ui: "'Source Sans 3 Variable', 'Sarabun', Tahoma, sans-serif",
  mono: "'JetBrains Mono Variable', 'IBM Plex Mono', monospace",
} as const;

// Chip tone map (ported from warm.jsx WChip).
export const chipTone = {
  terra: { bg: '#F4DDD0', fg: warm.terraDeep },
  sage: { bg: '#DEE4D5', fg: warm.sage },
  ochre: { bg: '#EFE0BC', fg: warm.ochre },
  ink: { bg: '#E4D5BC', fg: warm.ink2 },
  warn: { bg: '#F0CFC5', fg: warm.warn },
} as const;

export type ChipTone = keyof typeof chipTone;

// Organ-system color theme for the Clinical Tools cards. Single source of
// truth: {system -> {color, label}} so cards map into it instead of
// hardcoding a color per topic (see CalcHub.tsx / HomeScreen.tsx).
export type OrganSystem =
  | 'infection'
  | 'neuro'
  | 'respiratory'
  | 'cardiac'
  | 'gi'
  | 'growth'
  | 'ophtho'
  | 'imaging';

export const systemTheme: Record<OrganSystem, { color: string; label: string }> = {
  infection: { color: '#C4463A', label: 'Infection / Sepsis' },
  neuro: { color: '#7C5CA0', label: 'Neuro' },
  respiratory: { color: '#3E7EA6', label: 'Respiratory' },
  cardiac: { color: '#C15B87', label: 'Cardiac' },
  gi: { color: '#C97A34', label: 'GI' },
  growth: { color: '#5B8A4A', label: 'Growth / Metabolic' },
  ophtho: { color: '#3E8F82', label: 'Ophthalmology' },
  imaging: { color: '#5C6B7A', label: 'Imaging' },
};
