// Reactive bookmark read, mirroring useProgress.ts's useSyncExternalStore
// wiring but without a server round-trip — bookmarks are a local "read
// later" list, not gamification history, so there's nothing to pull/merge.

import { useSyncExternalStore } from 'react';
import { getBookmarks, subscribeBookmarks, type BookmarkMap } from './storage';

export function useBookmarks(): BookmarkMap {
  return useSyncExternalStore(subscribeBookmarks, getBookmarks, getBookmarks);
}
