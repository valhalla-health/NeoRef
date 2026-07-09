// Walks every BpdScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab). Also pins the AUDIT-flagged "Grade 3A = death"
// wording (bpd.jsx:66) — ported verbatim pending clinician sign-off, so an
// accidental reword during a future refactor should fail this test rather
// than slip through unnoticed.

import { describe, it } from 'vitest';
import { BpdScreen } from './BpdScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('BpdScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(BpdScreen, [
      { tabLabel: 'ภาพรวม', expectedText: ['EPIDEMIOLOGY', 'Grade 3A', 'Death from respiratory cause'] },
      { tabLabel: 'Prevention', expectedText: 'PREVENTION BUNDLE' },
      { tabLabel: 'Treatment', expectedText: 'RESPIRATORY SUPPORT' },
      { tabLabel: 'Furosemide', expectedText: 'FUROSEMIDE IN BPD' },
    ]);
  });
});
