// Walks every RopScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { RopScreen } from './RopScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('RopScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(RopScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Screening', expectedText: 'SCREENING CRITERIA' },
      { tabLabel: 'ICROP staging', expectedText: 'ICROP-3 · ZONES' },
      { tabLabel: 'Treatment', expectedText: 'TYPE 1 ROP' },
    ]);
  });
});
