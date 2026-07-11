// Walks every HieScreen tab. Also pins the AUDIT-flagged ambiguous "BE
// ≥-16" notation (hie.jsx:140) — ported verbatim pending clinician
// sign-off — on its Cooling tab.

import { describe, it } from 'vitest';
import { HieScreen } from './HieScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('HieScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(HieScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Sarnat', expectedText: 'SARNAT STAGING' },
      { tabLabel: 'Cooling', expectedText: ['ELIGIBILITY', 'BE ≥-16'] },
      { tabLabel: 'Outcomes', expectedText: 'COOLING EVIDENCE' },
    ]);
  });
});
