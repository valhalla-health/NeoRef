// Shared test helper for the tabbed static reference screens (BpdScreen,
// HieScreen, IvhScreen, LosScreen, NecScreen, PdaScreen, PocusScreen,
// RdsScreen, RopScreen, SeizuresScreen).
//
// registry.test.tsx only ever renders each screen's default tab, so the
// TabStrip's onChange handler and every non-default tab's content were never
// actually exercised. This walks every tab, asserting its distinguishing
// content appears, then verifies the back button fires onBack.

import type { ComponentType } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';

// RTL's default `{ exact: false }` matching is case-insensitive substring
// matching against every element's full textContent, which over-matches
// when the same words reappear elsewhere on the screen in a different case
// (e.g. a "Sarnat staging" hero chip vs. a "SARNAT STAGING" section label).
// This restricts the match to the innermost element whose own text
// contains the substring, case-sensitively.
function caseSensitiveSubstring(text: string) {
  return (_content: string, element: Element | null) => {
    if (!element?.textContent?.includes(text)) return false;
    return Array.from(element.children).every((child) => !child.textContent?.includes(text));
  };
}

export interface TopicTabCase {
  /** Exact accessible name of the tab button (TabStrip's `l` field). */
  tabLabel: string;
  /** Substring(s) that should only be present once this tab is active. */
  expectedText: string | string[];
}

export async function exerciseTopicScreenTabs(
  Screen: ComponentType<{ onBack?: () => void }>,
  cases: TopicTabCase[],
) {
  const user = userEvent.setup();
  const onBack = vi.fn();
  render(<Screen onBack={onBack} />);

  expect(screen.getByRole('note')).toHaveTextContent(/Educational reference only/i);

  const tablist = screen.getByRole('tablist');

  for (const { tabLabel, expectedText } of cases) {
    const tabButton = within(tablist).getByRole('tab', { name: tabLabel });
    await user.click(tabButton);
    expect(tabButton).toHaveAttribute('aria-selected', 'true');

    for (const text of Array.isArray(expectedText) ? expectedText : [expectedText]) {
      expect(screen.getByText(caseSensitiveSubstring(text))).toBeInTheDocument();
    }
  }

  const backButton = screen.getByRole('button', { name: /เครื่องมือ/ });
  await user.click(backButton);
  expect(onBack).toHaveBeenCalledTimes(1);
}
