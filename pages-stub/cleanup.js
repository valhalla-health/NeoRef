// Clean-up for NeoRef's old address, https://valhalla-health.github.io/NeoRef/.
// NeoRef now lives at https://neoref.valhalla-health.workers.dev/ (STATUS.md).
// Loaded by index.html (the "moved" page) and by sw.js (the service worker
// that replaces the old offline copy on installed phones).
//
// valhalla-health.github.io is shared by every GitHub Pages site in the org,
// and browser storage and Cache Storage belong to the whole origin, not to a
// path. So this deletes NeoRef's own entries and nothing else. NeoRedact, a
// live offline app on the same origin, keeps its caches under `neoredact-`.
// src/deploy/pagesStub.test.ts pins this down.
(function (scope) {
  'use strict';

  const NEOREF_SCOPE = 'https://valhalla-health.github.io/NeoRef/';

  // Workbox names its precache `workbox-precache-v2-<registration scope>`; the
  // other three are the runtimeCaching names in vite.config.ts. Checked
  // against the live sw.js on 2026-09-18.
  const NEOREF_CACHES = [
    'workbox-precache-v2-' + NEOREF_SCOPE,
    'lesson-content',
    'lesson-images',
    'kcmh-docs',
  ];

  function isNeoRefCache(name) {
    return NEOREF_CACHES.includes(name);
  }

  // Deletes NeoRef's caches only, and resolves to the names it deleted.
  async function deleteNeoRefCaches(cacheStorage) {
    const mine = (await cacheStorage.keys()).filter(isNeoRefCache);
    await Promise.all(mine.map((name) => cacheStorage.delete(name)));
    return mine;
  }

  // Removes every localStorage key NeoRef wrote — the session token
  // (neoref:session) and the per-account copies (neoref:<email>:<store>) —
  // and returns them. Lesson progress, bookmarks and stats are kept on the
  // GAS backend and come back when the user signs in at the new address.
  function clearNeoRefStorage(storage) {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && key.startsWith('neoref:')) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
    return keys;
  }

  scope.NeoRefCleanup = { NEOREF_SCOPE, isNeoRefCache, deleteNeoRefCaches, clearNeoRefStorage };
})(self);
