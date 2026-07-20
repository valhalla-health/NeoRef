// Maps a ported calc id to its screen component. App.tsx looks up here
// instead of growing an if/else chain per calculator.
//
// Each screen is its own lazy chunk: only one calc is ever shown at a time,
// so eagerly bundling all 12 into the main chunk cost every user extra JS to
// parse/execute before the Home screen could even paint. vite-plugin-pwa's
// globPatterns still precache every chunk on install, so offline support is
// unaffected — this only changes what's needed for the *first* paint.

import { lazy, type ComponentType } from 'react';

export const CALC_SCREENS: Record<string, ComponentType<{ onBack?: () => void }>> = {
  eos: lazy(() => import('./eos/EosEducation').then((m) => ({ default: m.EosEducation }))),
  fenton: lazy(() => import('./fenton/FentonEducation').then((m) => ({ default: m.FentonEducation }))),
  hie: lazy(() => import('./hie/HieScreen').then((m) => ({ default: m.HieScreen }))),
  bpd: lazy(() => import('./bpd/BpdScreen').then((m) => ({ default: m.BpdScreen }))),
  nec: lazy(() => import('./nec/NecScreen').then((m) => ({ default: m.NecScreen }))),
  pda: lazy(() => import('./pda/PdaScreen').then((m) => ({ default: m.PdaScreen }))),
  rds: lazy(() => import('./rds/RdsScreen').then((m) => ({ default: m.RdsScreen }))),
  ivh: lazy(() => import('./ivh/IvhScreen').then((m) => ({ default: m.IvhScreen }))),
  los: lazy(() => import('./los/LosScreen').then((m) => ({ default: m.LosScreen }))),
  rop: lazy(() => import('./rop/RopScreen').then((m) => ({ default: m.RopScreen }))),
  seizures: lazy(() => import('./seizures/SeizuresScreen').then((m) => ({ default: m.SeizuresScreen }))),
  pocus: lazy(() => import('./pocus/PocusScreen').then((m) => ({ default: m.PocusScreen }))),
};
