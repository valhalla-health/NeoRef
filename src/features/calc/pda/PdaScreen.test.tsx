// Walks every PdaScreen tab (registry.test.tsx only ever renders the
// default 'overview' tab).

import { describe, it } from 'vitest';
import { PdaScreen } from './PdaScreen';
import { exerciseTopicScreenTabs } from '../topic/topicScreenTestHelpers';

describe('PdaScreen', () => {
  it('renders every tab and returns to the hub', async () => {
    await exerciseTopicScreenTabs(PdaScreen, [
      { tabLabel: 'ภาพรวม', expectedText: 'EPIDEMIOLOGY' },
      { tabLabel: 'Echo', expectedText: 'DEFINITION CRITERIA' },
      { tabLabel: 'Treatment', expectedText: 'TREATMENT STRATEGY' },
      { tabLabel: 'Drugs', expectedText: 'COX INHIBITORS' },
    ]);
  });
});
