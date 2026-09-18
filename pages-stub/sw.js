// Replaces NeoRef's old offline copy on phones that installed the app from
// https://valhalla-health.github.io/NeoRef/. NeoRef now lives at
// https://neoref.valhalla-health.workers.dev/ (STATUS.md).
//
// Browsers re-check this file whenever the old app is opened. This version
// takes over at once, deletes NeoRef's caches (only NeoRef's — see
// cleanup.js), unregisters itself, and reloads the app's open windows, which
// then load the "moved" page (index.html) from the network.
importScripts('cleanup.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.NeoRefCleanup.deleteNeoRefCaches(self.caches);
      } catch {
        // Keep going: retiring the old app matters more than its caches.
      }
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)));
    })(),
  );
});
