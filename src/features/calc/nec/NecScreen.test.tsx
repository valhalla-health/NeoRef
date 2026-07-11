// Walks every NecScreen tab. Also pins the AUDIT-flagged "bowel wall >
// 2.6mm = NEC concern" wording (nec.jsx:105) — ported verbatim pending
// clinician sign-off — on its Diagnosis tab.

import { describe, it } from 'vitest';
import { NecScreen } from './NecScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('NecScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(NecScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Diagnosis', expectedText: ['Bowel wall thickness', '>2.6 mm', 'NEC concern'] },
      { tabLabel: 'Bell staging', expectedText: 'MODIFIED BELL STAGING' },
      { tabLabel: 'Management', expectedText: 'BUNDLE' },
    ]);
  });
});
