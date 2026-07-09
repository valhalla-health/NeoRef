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
