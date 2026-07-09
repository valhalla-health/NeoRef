// Walks every LosScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { LosScreen } from './LosScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('LosScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(LosScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Pathogens', expectedText: 'BACTERIAL' },
      { tabLabel: 'Workup', expectedText: 'SEPTIC WORKUP' },
      { tabLabel: 'Treatment', expectedText: 'EMPIRIC REGIMEN' },
    ]);
  });
});
