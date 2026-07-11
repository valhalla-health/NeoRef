// Walks every PocusScreen tab. PocusScreen renders from a single
// `POCUS_DATA` object keyed by tab, so v8 line/branch coverage reports it as
// "100%" purely because the object literal is evaluated at module load —
// regardless of whether each tab is actually clicked and its data rendered.
// This test exercises the real interaction so a broken tab (e.g. an empty
// `views`/`measures` array) would actually be caught.
//
// Also pins the AUDIT-flagged "bowel wall > 2.6mm = NEC concern" wording
// (pocus.jsx:46) — ported verbatim pending clinician sign-off — on the
// Lung/Bowel tab (duplicated from NecScreen).

import { describe, it } from 'vitest';
import { PocusScreen } from './PocusScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('PocusScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(PocusScreen, [
      { tabLabel: 'Heart', expectedText: 'Bedside Echo' },
      { tabLabel: 'Brain', expectedText: 'Cranial US' },
      { tabLabel: 'Lung/Bowel', expectedText: ['Lung & Bowel', 'Bowel wall thickness', '>2.6 mm', 'NEC concern'] },
      { tabLabel: 'Procedural', expectedText: 'real-time guidance' },
    ]);
  });
});
