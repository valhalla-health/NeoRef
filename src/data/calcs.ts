// Calculator / reference registry.
//
// AUDIT C-5: the prototype labelled ten static topic pages as "calculators".
// Here each entry declares its `kind` honestly: 'education' (interactive
// teaching screen) vs 'reference' (static reference card). Only EOS is migrated
// in this vertical slice; the rest are marked `ported: false` until migrated.

export type CalcKind = 'education' | 'reference';

export interface CalcMeta {
  id: string;
  label: string;
  emoji: string;
  kind: CalcKind;
  /** Whether this screen has been migrated into the production app yet. */
  ported: boolean;
}

export const CALCS: CalcMeta[] = [
  { id: 'eos', label: 'EOS factors', emoji: '🦠', kind: 'education', ported: true },
  { id: 'fenton', label: 'Fenton', emoji: '📏', kind: 'education', ported: true },
  { id: 'hie', label: 'HIE / TH', emoji: '🧠', kind: 'reference', ported: true },
  { id: 'bpd', label: 'BPD', emoji: '🫁', kind: 'reference', ported: true },
  { id: 'nec', label: 'NEC', emoji: '🫃', kind: 'reference', ported: true },
  { id: 'pda', label: 'PDA', emoji: '❤️', kind: 'reference', ported: true },
  { id: 'rds', label: 'RDS', emoji: '💨', kind: 'reference', ported: true },
  { id: 'ivh', label: 'IVH', emoji: '🩸', kind: 'reference', ported: true },
  { id: 'los', label: 'LOS', emoji: '🌡️', kind: 'reference', ported: true },
  { id: 'rop', label: 'ROP', emoji: '👁️', kind: 'reference', ported: true },
  { id: 'seizures', label: 'Seizures', emoji: '⚡', kind: 'reference', ported: true },
  { id: 'pocus', label: 'POCUS', emoji: '🔊', kind: 'reference', ported: true },
  { id: 'kcmh', label: 'KCMH', emoji: '📄', kind: 'reference', ported: true },
];
