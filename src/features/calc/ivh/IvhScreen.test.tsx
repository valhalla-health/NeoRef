// Walks every IvhScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { IvhScreen } from './IvhScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('IvhScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(IvhScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Grading', expectedText: 'PAPILE CLASSIFICATION' },
      { tabLabel: 'Risk factors', expectedText: 'NON-MODIFIABLE' },
      { tabLabel: 'Prevention', expectedText: 'PREVENTION BUNDLE' },
    ]);
  });
});
