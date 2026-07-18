// Walks every RdsScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { RdsScreen } from './RdsScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('RdsScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(RdsScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Antenatal', expectedText: 'ANTENATAL CORTICOSTEROIDS' },
      { tabLabel: 'Surfactant', expectedText: 'INDICATIONS · 2025 update' },
      { tabLabel: 'CPAP / NIV', expectedText: 'CPAP · first-line' },
    ]);
  });
});
