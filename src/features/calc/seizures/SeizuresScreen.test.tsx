// Walks every SeizuresScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { SeizuresScreen } from './SeizuresScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('SeizuresScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(SeizuresScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Recognition', expectedText: 'SEMIOLOGY' },
      { tabLabel: 'EEG / aEEG', expectedText: 'WHY EEG IS MANDATORY' },
      { tabLabel: 'Treatment', expectedText: 'FIRST-LINE' },
    ]);
  });
});
