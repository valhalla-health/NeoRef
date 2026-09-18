# NeoRef on Cloudflare — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve NeoRef from Cloudflare Workers, deployed by Workers Builds on every merge into `main`,
and turn the old GitHub Pages address into a "moved" page that retires the old offline copy — so
the repository can later go private without taking the site down.

**Architecture:** A static-assets-only Worker (`wrangler.jsonc`, no Worker code) serves the Vite
build in `dist/`, with extra response headers from `public/_headers`. GitHub Pages stops building
the app and publishes `pages-stub/` instead: a moved page plus a kill-switch service worker. Both
share one clean-up script that deletes NeoRef's own storage and caches — and nothing belonging to
the other apps on the shared `valhalla-health.github.io` origin.

**Tech Stack:** Vite 5, React 18, TypeScript, vite-plugin-pwa (Workbox), Vitest + jsdom, Cloudflare
Workers static assets + Workers Builds, wrangler 4, GitHub Actions (`actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-09-18-cloudflare-hosting-design.md` — read it first. This
plan argues from it.

## Global Constraints

- New address: `https://neoref.valhalla-health.workers.dev` — Worker name `neoref`, `compatibility_date` `2026-09-01`.
- Old address: `https://valhalla-health.github.io/NeoRef/` (this is also the old service worker's scope).
- NeoRef's caches on the old origin, exactly: `workbox-precache-v2-https://valhalla-health.github.io/NeoRef/`, `lesson-content`, `lesson-images`, `kcmh-docs`. Delete these and no others.
- NeoRef's `localStorage` keys: every key starting with `neoref:`. Delete these and no others.
- `/*` response headers, exactly: `Content-Security-Policy: frame-ancestors 'none'` · `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `Referrer-Policy: no-referrer` · `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()` · `Cross-Origin-Opener-Policy: same-origin-allow-popups` · `X-Robots-Tag: noindex, nofollow`. `/assets/*` only: `Cache-Control: public, max-age=31536000, immutable`.
- The CSP rules (script, connect, image, font) stay in `index.html`'s `<meta>` tag only.
- No app code changes. `src/` only gains tests, under `src/deploy/`.
- Do not add `wrangler` to `package.json`. Locally, use the cached `npx --yes wrangler@4.131.0`.
- Work only in the worktree `neoref-app/.claude/worktrees/cloudflare-hosting` (branch `claude/cloudflare-hosting`). Never touch Praew's main checkout `neoref-app/`: it is on `claude/key-points-bullets` with an uncommitted edit to `scripts/extract_pimolrat_visuals.py`.
- `.env.local` holds the two build values locally. It is gitignored (`*.local`) and must never be committed.
- Merge only on Praew's explicit instruction, following her merge rule (Task 8).
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. The PR body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

Throughout, `WT` is the worktree:

```bash
WT="/c/Users/USER/repos/PraewPP/Web App Projects/NeoRef/neoref-app/.claude/worktrees/cloudflare-hosting"
```

---

### Task 1: The Cloudflare host configuration

**Files:**
- Create: `wrangler.jsonc`
- Create: `public/_headers`
- Create: `.gitattributes`
- Modify: `.gitignore` (append a `.wrangler/` block)
- Test: `src/deploy/hosting.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `wrangler.jsonc`, which serves `./dist` as Worker `neoref`, and `public/_headers`, which Vite copies to `dist/_headers`. Tasks 4 and 5 rely on both.

- [ ] **Step 1: Install dependencies and confirm a green baseline**

```bash
cd "$WT" && npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

Expected: every command exits 0. If the baseline is red, stop and report — don't build on a broken `main`.

- [ ] **Step 2: Write the failing test**

Create `src/deploy/hosting.test.ts`:

```ts
/// <reference types="node" />
// NeoRef is served by Cloudflare from dist/ (wrangler.jsonc), with response
// headers from public/_headers. These checks fail if either file loses a line
// the deployment depends on. The deployment itself is described in STATUS.md.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file: string) =>
  readFileSync(path.join(ROOT, file), 'utf-8').replace(/\r\n/g, '\n');

// _headers syntax: an unindented line names a path pattern, and the indented
// lines under it are the headers for that pattern. `#` starts a comment.
function headerRules(text: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (/^\s/.test(line)) {
      current?.push(line.trim());
    } else {
      current = [];
      rules.set(line.trim(), current);
    }
  }
  return rules;
}

describe('public/_headers', () => {
  const rules = headerRules(read('public/_headers'));
  const everyPath = rules.get('/*') ?? [];

  it('forbids framing, sniffing, referrers and indexing on every path', () => {
    expect(everyPath).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy: frame-ancestors 'none'",
        'X-Frame-Options: DENY',
        'X-Content-Type-Options: nosniff',
        'Referrer-Policy: no-referrer',
        'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
        'X-Robots-Tag: noindex, nofollow',
      ]),
    );
  });

  it("keeps window.opener for Google Sign-In's popup", () => {
    expect(everyPath).toContain('Cross-Origin-Opener-Policy: same-origin-allow-popups');
  });

  it('leaves the script and connect rules to the <meta> CSP in index.html', () => {
    const csp = everyPath.filter((header) => header.startsWith('Content-Security-Policy:'));
    expect(csp).toEqual(["Content-Security-Policy: frame-ancestors 'none'"]);
  });

  it('caches only the content-hashed assets/ files for a year', () => {
    expect(rules.get('/assets/*')).toEqual(['Cache-Control: public, max-age=31536000, immutable']);
    const longCached = [...rules]
      .filter(([, headers]) => headers.some((header) => header.includes('max-age=31536000')))
      .map(([pattern]) => pattern);
    expect(longCached).toEqual(['/assets/*']);
  });
});

describe('wrangler.jsonc', () => {
  // Whole-line // comments only, so stripping them leaves plain JSON.
  const config = JSON.parse(read('wrangler.jsonc').replace(/^\s*\/\/.*$/gm, ''));

  it('serves the Vite build as static files, with no Worker code', () => {
    expect(config).toMatchObject({ name: 'neoref', assets: { directory: './dist' } });
    expect(config.main).toBeUndefined();
  });

  it('gives builds of unmerged branches no public preview URL', () => {
    expect(config.preview_urls).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd "$WT" && npx vitest run src/deploy/hosting.test.ts`
Expected: FAIL — `ENOENT: no such file or directory` for `public/_headers` and `wrangler.jsonc`.

- [ ] **Step 4: Create `wrangler.jsonc`**

```jsonc
{
  // NeoRef's host: a static-assets-only Worker. There is no `main` entrypoint,
  // so no Worker code runs and Cloudflare serves the files in dist/ directly.
  // Cloudflare Workers Builds runs `npm run build` and then
  // `npx wrangler deploy` on every merge into main — see STATUS.md. Response
  // headers come from public/_headers, which Vite copies into dist/.
  //
  // preview_urls is off so builds of unmerged branches never get a public
  // URL. Unknown paths return 404: NeoRef has no URL routing (navigation is
  // history.pushState with state only).
  "name": "neoref",
  "compatibility_date": "2026-09-01",
  "assets": {
    "directory": "./dist"
  },
  "workers_dev": true,
  "preview_urls": false
}
```

- [ ] **Step 5: Create `public/_headers`**

```text
# Response headers for NeoRef on Cloudflare (neoref.valhalla-health.workers.dev).
# Cloudflare reads this file as configuration and does not serve it. Vite
# copies it from public/ into dist/; it has no file extension, so the service
# worker's precache glob in vite.config.ts never picks it up.
#
# The Content-Security-Policy rules for scripts, fetches, images and fonts
# live in index.html's <meta> tag, and only there. The CSP header below adds
# the one directive a <meta> policy cannot enforce: frame-ancestors. Browsers
# apply both policies, so this header can only restrict further.
#
# Cross-Origin-Opener-Policy is same-origin-allow-popups, not same-origin:
# Google Sign-In's popup needs window.opener to hand the login back, and plain
# same-origin breaks the callback. Google documents this value; NeoFeed runs it.
#
# X-Robots-Tag keeps search engines from indexing the app and its lesson
# files. The Pimolrat text is reproduced with the author's permission and must
# not be redistributed outside the app (README.md, License & copyright).

/*
  Content-Security-Policy: frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Robots-Tag: noindex, nofollow

# Vite puts a content hash in every file name under assets/, so a changed file
# always gets a new name and these can be cached for a year. Everything else
# (index.html, sw.js, lessons, PDFs) keeps Cloudflare's default revalidation,
# so updates reach phones on the next load.
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 6: Create `.gitattributes`, and extend `.gitignore`**

`.gitattributes`:

```text
# Cloudflare reads public/_headers line by line. Keep it LF even on Windows
# checkouts (core.autocrlf=true), so a build made on a Windows PC never ships
# header values that end in a carriage return.
public/_headers text eol=lf
```

Append to `.gitignore`:

```text

# Wrangler's local state (npx wrangler deploy / dev)
.wrangler/
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd "$WT" && npx vitest run src/deploy/hosting.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 8: Confirm the build carries `_headers` with LF endings, and the service worker ignores it**

```bash
cd "$WT" && npm run build && test -f dist/_headers && ! grep -q $'\r' dist/_headers && echo "_headers LF ok" && grep -c '_headers' dist/sw.js
```

Expected: `_headers LF ok`, then `0` (the precache manifest never lists `_headers`). `grep -c` exits 1 when it counts 0 — that is the passing case here.

- [ ] **Step 9: Lint, typecheck, and commit**

```bash
cd "$WT" && npm run lint && npm run typecheck && git add wrangler.jsonc public/_headers .gitattributes .gitignore src/deploy/hosting.test.ts && git commit -F - <<'EOF'
Add the Cloudflare host config: wrangler.jsonc and public/_headers

A static-assets-only Worker named neoref serves dist/ at
neoref.valhalla-health.workers.dev, with preview URLs off so unmerged
branches never get a public URL. public/_headers adds what the <meta>
CSP cannot enforce (frame-ancestors), plus nosniff, Referrer-Policy,
Permissions-Policy, the COOP value Google Sign-In's popup needs,
noindex, and year-long caching for the content-hashed assets/. The CSP
rules themselves stay in index.html. .gitattributes keeps _headers LF
so a Windows build never ships header values ending in CR.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 2: The shared clean-up and the kill-switch service worker

**Files:**
- Create: `pages-stub/cleanup.js`
- Create: `pages-stub/sw.js`
- Test: `src/deploy/pagesStub.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `pages-stub/cleanup.js`, a classic script that sets `self.NeoRefCleanup` to:
  - `NEOREF_SCOPE: string` — `'https://valhalla-health.github.io/NeoRef/'`
  - `isNeoRefCache(name: string): boolean`
  - `deleteNeoRefCaches(cacheStorage: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> }): Promise<string[]>` — resolves to the deleted names
  - `clearNeoRefStorage(storage: Storage): string[]` — returns the removed keys

  Task 3's `index.html` loads this with `<script src="cleanup.js">`, and `sw.js` loads it with `importScripts('cleanup.js')`.

- [ ] **Step 1: Write the failing tests**

Create `src/deploy/pagesStub.test.ts`:

```ts
/// <reference types="node" />
// The old address, valhalla-health.github.io/NeoRef/, now serves only
// pages-stub/: a "moved" page (index.html), a service worker that retires the
// old offline copy on installed phones (sw.js), and the clean-up both of them
// share (cleanup.js). valhalla-health.github.io is shared by every GitHub
// Pages site in the org, so the clean-up may delete NeoRef's own storage,
// caches and service worker — and nothing belonging to NeoRedact or any other
// app. These tests run the stub files the way a browser does, as classic
// scripts, in a sandbox whose only globals are the fakes each test passes in.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf-8');
const readStub = (file: string) => read(path.join('pages-stub', file));

const NEOREF_SCOPE = 'https://valhalla-health.github.io/NeoRef/';
const NEOREF_CACHES = [
  `workbox-precache-v2-${NEOREF_SCOPE}`,
  'lesson-content',
  'lesson-images',
  'kcmh-docs',
];
// Caches that other apps keep, or could keep, on the same origin.
const OTHER_CACHES = [
  'neoredact-shell-v11',
  'workbox-precache-v2-https://valhalla-health.github.io/NeoRedact/',
  'lesson-content-v2',
];

const sorted = (values: Iterable<string>) => [...values].sort();

function storageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i) as string);
  return keys.sort();
}

interface FakeCacheStorage {
  keys(): Promise<string[]>;
  delete(name: string): Promise<boolean>;
  remaining: Set<string>;
}

function fakeCacheStorage(names: string[]): FakeCacheStorage {
  const remaining = new Set(names);
  return {
    keys: async () => [...remaining],
    delete: async (name) => remaining.delete(name),
    remaining,
  };
}

interface NeoRefCleanup {
  NEOREF_SCOPE: string;
  isNeoRefCache(name: string): boolean;
  deleteNeoRefCaches(cacheStorage: FakeCacheStorage): Promise<string[]>;
  clearNeoRefStorage(storage: Storage): string[];
}

// Runs cleanup.js with `self` as its only global and returns what it defines.
function loadCleanup(): NeoRefCleanup {
  const self: { NeoRefCleanup?: NeoRefCleanup } = {};
  vm.runInNewContext(readStub('cleanup.js'), { self });
  if (!self.NeoRefCleanup) throw new Error('cleanup.js did not define self.NeoRefCleanup');
  return self.NeoRefCleanup;
}

describe('pages-stub/cleanup.js', () => {
  it("names the old service worker's scope", () => {
    expect(loadCleanup().NEOREF_SCOPE).toBe(NEOREF_SCOPE);
  });

  it("recognises exactly NeoRef's four caches", () => {
    const { isNeoRefCache } = loadCleanup();
    expect(NEOREF_CACHES.filter(isNeoRefCache)).toEqual(NEOREF_CACHES);
    expect(OTHER_CACHES.filter(isNeoRefCache)).toEqual([]);
  });

  it("deletes NeoRef's caches and keeps every other app's", async () => {
    const { deleteNeoRefCaches } = loadCleanup();
    const caches = fakeCacheStorage([...NEOREF_CACHES, ...OTHER_CACHES]);
    expect(sorted(await deleteNeoRefCaches(caches))).toEqual(sorted(NEOREF_CACHES));
    expect(sorted(caches.remaining)).toEqual(sorted(OTHER_CACHES));
  });

  it('removes only the neoref: keys from localStorage', () => {
    const { clearNeoRefStorage } = loadCleanup();
    localStorage.setItem('neoref:session', '{"v":1}');
    localStorage.setItem('neoref:someone@example.com:lesson-progress', '{"v":1}');
    localStorage.setItem('neofeed_session', 'x');
    localStorage.setItem('nb-lesson-progress', 'x');
    expect(sorted(clearNeoRefStorage(localStorage))).toEqual([
      'neoref:session',
      'neoref:someone@example.com:lesson-progress',
    ]);
    expect(storageKeys()).toEqual(['nb-lesson-progress', 'neofeed_session']);
  });
});

interface WorkerHarness {
  fire(type: 'install' | 'activate'): Promise<void>;
  skipWaiting: ReturnType<typeof vi.fn>;
  unregister: ReturnType<typeof vi.fn>;
  matchAll: ReturnType<typeof vi.fn>;
  windows: { url: string; navigate: ReturnType<typeof vi.fn> }[];
  caches: FakeCacheStorage;
  calls: string[];
}

// Runs sw.js the way a browser runs a classic service worker: `self` is the
// worker's global scope, and importScripts evaluates cleanup.js in that same
// global. `calls` records the order of the side effects.
function loadWorker(caches: FakeCacheStorage): WorkerHarness {
  const calls: string[] = [];
  const listeners = new Map<string, (event: unknown) => void>();
  const windows = [NEOREF_SCOPE, `${NEOREF_SCOPE}#learn`].map((url) => ({
    url,
    navigate: vi.fn(async () => {
      calls.push('navigate');
    }),
  }));
  const skipWaiting = vi.fn(async () => undefined);
  const unregister = vi.fn(async () => {
    calls.push('unregister');
    return true;
  });
  const matchAll = vi.fn(async () => windows);
  const self = {
    addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    skipWaiting,
    caches: {
      keys: () => caches.keys(),
      delete: (name: string) => {
        calls.push(`delete ${name}`);
        return caches.delete(name);
      },
    },
    registration: { unregister },
    clients: { matchAll },
  };
  const context: vm.Context = vm.createContext({
    self,
    importScripts: (...files: string[]) => files.forEach((file) => vm.runInContext(readStub(file), context)),
  });
  vm.runInContext(readStub('sw.js'), context);

  async function fire(type: 'install' | 'activate') {
    let pending: unknown = undefined;
    listeners.get(type)?.({
      waitUntil: (promise: unknown) => {
        pending = promise;
      },
    });
    await pending;
  }

  return { fire, skipWaiting, unregister, matchAll, windows, caches, calls };
}

describe('pages-stub/sw.js', () => {
  it('takes over from the old worker as soon as it installs', async () => {
    const worker = loadWorker(fakeCacheStorage([]));
    await worker.fire('install');
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
  });

  it("deletes NeoRef's caches, then unregisters, then reloads each window where it was", async () => {
    const worker = loadWorker(fakeCacheStorage([...NEOREF_CACHES, ...OTHER_CACHES]));
    await worker.fire('activate');

    expect(sorted(worker.caches.remaining)).toEqual(sorted(OTHER_CACHES));
    expect(worker.calls.indexOf('unregister')).toBe(NEOREF_CACHES.length);
    expect(worker.matchAll).toHaveBeenCalledWith({ type: 'window' });
    expect(worker.windows.map((w) => w.navigate.mock.calls)).toEqual([[[NEOREF_SCOPE]], [[`${NEOREF_SCOPE}#learn`]]]);
    expect(worker.calls.slice(-2)).toEqual(['navigate', 'navigate']);
  });

  it('still unregisters and reloads when the caches cannot be read', async () => {
    const blocked = fakeCacheStorage([]);
    blocked.keys = async () => {
      throw new Error('storage blocked');
    };
    const worker = loadWorker(blocked);
    await worker.fire('activate');

    expect(worker.unregister).toHaveBeenCalledOnce();
    expect(worker.windows[0].navigate).toHaveBeenCalledOnce();
  });

  it('still reloads the other windows when one refuses to navigate', async () => {
    const worker = loadWorker(fakeCacheStorage([]));
    worker.windows[0].navigate.mockRejectedValueOnce(new TypeError('not controlled'));
    await worker.fire('activate');

    expect(worker.windows[1].navigate).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd "$WT" && npx vitest run src/deploy/pagesStub.test.ts`
Expected: FAIL — `ENOENT: no such file or directory` for `pages-stub/cleanup.js` and `pages-stub/sw.js`.

- [ ] **Step 3: Create `pages-stub/cleanup.js`**

```js
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
```

- [ ] **Step 4: Create `pages-stub/sw.js`**

```js
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd "$WT" && npx vitest run src/deploy/pagesStub.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Lint, typecheck, and commit**

```bash
cd "$WT" && npm run lint && npm run typecheck && git add pages-stub/cleanup.js pages-stub/sw.js src/deploy/pagesStub.test.ts && git commit -F - <<'EOF'
Add the old address's clean-up and kill-switch service worker

pages-stub/ is what GitHub Pages will serve at the old address.
cleanup.js deletes NeoRef's localStorage keys (neoref:*) and exactly
NeoRef's four caches — never another app's, because
valhalla-health.github.io is shared and NeoRedact is a live offline app
there. sw.js replaces the old Workbox worker on installed phones: it
takes over at once, runs the clean-up, unregisters itself, and reloads
the app's windows onto the moved page. Tests run both files in a vm
sandbox, with fakes for caches, registration and clients.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 3: The moved page, and GitHub Pages publishing only `pages-stub/`

**Files:**
- Create: `pages-stub/index.html`
- Modify: `.github/workflows/deploy.yml` (whole file replaced)
- Test: `src/deploy/pagesStub.test.ts` (append two `describe` blocks)

**Interfaces:**
- Consumes: from Task 2, `self.NeoRefCleanup.{NEOREF_SCOPE, deleteNeoRefCaches, clearNeoRefStorage}`, plus the test helpers already in `pagesStub.test.ts` (`read`, `readStub`, `NEOREF_SCOPE`, `NEOREF_CACHES`, `OTHER_CACHES`, `sorted`, `storageKeys`, `fakeCacheStorage`).
- Produces: `pages-stub/index.html`, and a Pages workflow that publishes `pages-stub/` unchanged.

- [ ] **Step 1: Append the failing tests to `src/deploy/pagesStub.test.ts`**

```ts
describe('pages-stub/index.html', () => {
  const html = readStub('index.html');

  it('sends people to the new address and loads nothing from anywhere else', () => {
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    expect(urls).toEqual(['cleanup.js', 'https://neoref.valhalla-health.workers.dev/']);
  });

  it('stays out of search results', () => {
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });

  it("clears NeoRef's storage, caches and service worker, and nothing else", async () => {
    const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
    if (!inline) throw new Error('index.html has no inline clean-up script');
    localStorage.setItem('neoref:session', '{"v":1}');
    localStorage.setItem('neofeed_session', 'x');
    const caches = fakeCacheStorage([...NEOREF_CACHES, ...OTHER_CACHES]);
    const neoref = { scope: NEOREF_SCOPE, unregister: vi.fn(async () => true) };
    const neoredact = { scope: 'https://valhalla-health.github.io/NeoRedact/', unregister: vi.fn(async () => true) };
    const context = vm.createContext({
      localStorage,
      caches,
      navigator: { serviceWorker: { getRegistrations: async () => [neoref, neoredact] } },
    });
    context.self = context;

    vm.runInContext(readStub('cleanup.js'), context);
    vm.runInContext(inline, context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(storageKeys()).toEqual(['neofeed_session']);
    expect(sorted(caches.remaining)).toEqual(sorted(OTHER_CACHES));
    expect(neoref.unregister).toHaveBeenCalledOnce();
    expect(neoredact.unregister).not.toHaveBeenCalled();
  });

  it('still renders when cleanup.js did not load', () => {
    const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    const context = vm.createContext({ localStorage });
    context.self = context;
    expect(() => vm.runInContext(inline, context)).not.toThrow();
  });
});

describe('.github/workflows/deploy.yml', () => {
  const workflow = read('.github/workflows/deploy.yml');

  it('publishes pages-stub/ as it is — never a build of the app', () => {
    expect(workflow).toMatch(/^\s+path: pages-stub\s*$/m);
    expect(workflow).not.toMatch(/npm (ci|run build)/);
    expect(workflow).not.toMatch(/path: dist/);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd "$WT" && npx vitest run src/deploy/pagesStub.test.ts`
Expected: FAIL — `ENOENT` for `pages-stub/index.html`, and the `deploy.yml` test fails on `path: dist` and `npm ci`. Task 2's 8 tests still pass.

- [ ] **Step 3: Create `pages-stub/index.html`**

```html
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex" />
<meta name="referrer" content="no-referrer" />
<meta name="theme-color" content="#F6EFE3" />
<title>NeoRef ย้ายที่อยู่แล้ว</title>
<!--
  NeoRef's old GitHub Pages address. NeoRef now lives at
  https://neoref.valhalla-health.workers.dev/ — see STATUS.md in the repo.
  Self-contained on purpose (system fonts, no outside scripts), so the page
  renders even when nothing else loads. sw.js, in this folder, retires the old
  offline copy on phones that installed the app from here.
-->
<script src="cleanup.js"></script>
<script>
  // Remove what NeoRef left on this shared origin (see cleanup.js): its
  // localStorage keys, its caches and its service worker. Every step is
  // guarded, because storage can be blocked and the page must render anyway.
  (function () {
    var c = self.NeoRefCleanup;
    if (!c) return;
    try { c.clearNeoRefStorage(localStorage); } catch (e) {}
    try { if (self.caches) c.deleteNeoRefCaches(caches).catch(function () {}); } catch (e) {}
    try {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          registrations.forEach(function (registration) {
            if (registration.scope === c.NEOREF_SCOPE) registration.unregister();
          });
        }).catch(function () {});
      }
    } catch (e) {}
  })();
</script>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: #F6EFE3;
    color: #1F1812;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Thai", Sarabun, Tahoma, sans-serif;
    line-height: 1.6;
  }
  main {
    width: 100%;
    max-width: 440px;
    background: #FFFDF8;
    border: 1px solid #E4D8C4;
    border-radius: 16px;
    padding: 28px 24px;
  }
  h1 { font-size: 1.35rem; margin: 0 0 4px; }
  h2 { font-size: 1rem; margin: 24px 0 8px; }
  p { margin: 0 0 16px; }
  .en { color: #6B5B4A; font-size: 0.95rem; }
  .btn {
    display: block;
    text-align: center;
    padding: 14px 16px;
    border-radius: 12px;
    background: #1F1812;
    color: #F6EFE3;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.05rem;
  }
  .btn span { display: block; font-weight: 400; font-size: 0.85rem; opacity: 0.85; }
  .url { text-align: center; font-size: 0.85rem; color: #6B5B4A; margin: 8px 0 0; word-break: break-all; }
  ol { margin: 0; padding-left: 1.25rem; }
  li { margin-bottom: 8px; }
</style>
</head>
<body>
<main>
  <h1>NeoRef ย้ายที่อยู่แล้ว</h1>
  <p class="en" lang="en">NeoRef has moved to a new address.</p>
  <p>เปิด NeoRef จากที่อยู่ใหม่ แล้วเข้าสู่ระบบด้วยบัญชีเดิม ความคืบหน้าบทเรียน บุ๊กมาร์ก และคะแนนของคุณจะกลับมาครบ</p>
  <a class="btn" href="https://neoref.valhalla-health.workers.dev/">เปิด NeoRef ที่อยู่ใหม่<span lang="en">Open the new NeoRef</span></a>
  <p class="url">neoref.valhalla-health.workers.dev</p>
  <h2>ถ้าเคยเพิ่ม NeoRef ไว้ที่หน้าจอโฮม</h2>
  <ol>
    <li>กดปุ่มด้านบน แล้วเข้าสู่ระบบ</li>
    <li>เพิ่มลงหน้าจอโฮมอีกครั้ง<br />iPhone: Safari → ปุ่มแชร์ → “เพิ่มไปยังหน้าจอโฮม”<br />Android: Chrome → เมนู ⋮ → “เพิ่มลงในหน้าจอหลัก” หรือ “ติดตั้งแอป”</li>
    <li>ลบไอคอน NeoRef เดิมออก</li>
  </ol>
</main>
</body>
</html>
```

- [ ] **Step 4: Replace `.github/workflows/deploy.yml`**

```yaml
name: Deploy moved page to GitHub Pages

# NeoRef itself is hosted on Cloudflare: Workers Builds deploys every merge
# into main (wrangler.jsonc, STATUS.md). The old GitHub Pages address only
# serves pages-stub/ — a "moved" page, plus a service worker that retires the
# old offline copy on installed phones. This publishes that folder unchanged.
on:
  push:
    branches: [main]
    paths:
      - 'pages-stub/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment; don't cancel an in-progress one.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: pages-stub
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd "$WT" && npx vitest run src/deploy/`
Expected: PASS, 19 tests (6 hosting + 13 pages stub).

- [ ] **Step 6: Look at the moved page in a real browser**

```bash
cd "$WT/pages-stub" && python -m http.server 8791 --bind 127.0.0.1
```

Run it in the background. Open `http://127.0.0.1:8791/` in the built-in browser pane
(`preview_start` with that `url`), then take screenshots with `resize_window` preset `mobile` and
again at `desktop`. Expected: the Thai heading, the English line, the dark button with the new
address, and the three steps. No horizontal scroll, and no console errors (`read_console_messages`
with `onlyErrors`). Afterwards, reset the window to `desktop` and stop the server.

- [ ] **Step 7: Lint, typecheck, and commit**

```bash
cd "$WT" && npm run lint && npm run typecheck && git add pages-stub/index.html .github/workflows/deploy.yml src/deploy/pagesStub.test.ts && git commit -F - <<'EOF'
Publish a "moved" page instead of the app at the old address

deploy.yml stops building the app. It publishes pages-stub/ unchanged,
whenever that folder or the workflow changes. The new index.html tells
people (in Thai, with an English line) that NeoRef has moved, links to
neoref.valhalla-health.workers.dev, explains how to re-add the app to
the home screen, and clears NeoRef's storage, caches and service worker
from the shared github.io origin — leaving every other app's alone.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Docs and `STATUS.md`

**Files:**
- Modify: `README.md` (the `## Deploy` section, lines 40-44)
- Modify: `index.html` (the CSP comment, lines 21-27)
- Modify: `SECURITY_CHECKLIST.md` (the last "Known-accepted items" bullet)
- Modify: `.env.example` (line 2)
- Create: `STATUS.md`

**Interfaces:**
- Consumes: the file names from Tasks 1–3.
- Produces: `STATUS.md`. Its "Move to Cloudflare" section has checkboxes that Tasks 5–8 tick, with evidence.

- [ ] **Step 1: Replace README's Deploy section**

Old:

```markdown
## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on push
to `main`. `base` is `'./'`, so the build is portable across user/project Pages sites.
Enable Pages → "GitHub Actions" in repo settings.
```

New:

```markdown
## Deploy

NeoRef runs on **Cloudflare Workers** as static files only, at
**https://neoref.valhalla-health.workers.dev**. Cloudflare Workers Builds is
connected to this repo, and **merging into `main` deploys**: it runs
`npm run build` (with the build variables `VITE_GOOGLE_CLIENT_ID` and
`VITE_GAS_URL`), then `npx wrangler deploy`, which uploads `dist/` as set in
[`wrangler.jsonc`](wrangler.jsonc). Response headers come from
[`public/_headers`](public/_headers); the CSP itself stays in `index.html`.
Hosts, verification and rollback are in [`STATUS.md`](STATUS.md).

The old address, `valhalla-health.github.io/NeoRef/`, serves only
[`pages-stub/`](pages-stub/): a "moved" page, and a service worker that retires
the old offline copy on installed phones. `.github/workflows/deploy.yml`
publishes it whenever `pages-stub/` changes.
```

- [ ] **Step 2: Update the CSP comment in `index.html`**

Old:

```html
    <!--
      Content-Security-Policy: everything is bundled and self-hosted except two
      deliberate exceptions for Google Sign-In (script + iframe) and the GAS
      backend (fetch target) — see AuthContext/authApi/gamifyApi. Every other
      origin stays locked down. GitHub Pages cannot set HTTP headers, so this
      meta CSP is the enforcement point.
    -->
```

New:

```html
    <!--
      Content-Security-Policy: everything is bundled and self-hosted except two
      deliberate exceptions for Google Sign-In (script + iframe) and the GAS
      backend (fetch target) — see AuthContext/authApi/gamifyApi. Every other
      origin stays locked down. These rules live here and only here. On
      Cloudflare, public/_headers adds, as an HTTP header, the one directive a
      meta CSP cannot enforce (frame-ancestors). Browsers apply both policies,
      so the header can only restrict further.
    -->
```

- [ ] **Step 3: Extend the CSP bullet in `SECURITY_CHECKLIST.md`**

Old:

```markdown
- CSP in `index.html` already restricts `script-src`/`connect-src` to `'self'` + the two required Google origins — don't loosen it without updating this checklist.
```

New:

```markdown
- CSP in `index.html` already restricts `script-src`/`connect-src` to `'self'` + the two required Google origins — don't loosen it without updating this checklist. On Cloudflare, `public/_headers` adds only what a `<meta>` policy can't carry (`frame-ancestors`, `X-Frame-Options`, `noindex`, …); keep the CSP rules themselves in `index.html`, in one place.
```

- [ ] **Step 4: Fix the dead path in `.env.example`**

Old:

```text
# See C:\Users\USER\nicu-tools\newborn-levelup\README.md for how to obtain these.
```

New:

```text
# See C:\Users\USER\nicu-tools\neoref\README.md for how to obtain these. The deployed
# values are Cloudflare Workers Builds build variables (STATUS.md).
```

- [ ] **Step 5: Create `STATUS.md`**

```markdown
# NeoRef — deployment status

Where NeoRef runs, how it deploys, and what was verified. The app itself is
described in [README.md](README.md).

## Where it runs

| | |
|---|---|
| App | Cloudflare Workers, static files only: **https://neoref.valhalla-health.workers.dev**. Worker `neoref` on the Cloudflare account `praew.tvl@gmail.com`, which also hosts NeoFeed |
| What deploys | **Merging into `main`.** Cloudflare Workers Builds runs `npm run build` with the build variables `VITE_GOOGLE_CLIENT_ID` and `VITE_GAS_URL`, then `npx wrangler deploy`. Builds of other branches upload a version but deploy nothing, and get no preview URL (`preview_urls: false`) |
| Old address | `valhalla-health.github.io/NeoRef/` serves only [`pages-stub/`](pages-stub/): a "moved" page and a service worker that retires the old offline copy. [`deploy.yml`](.github/workflows/deploy.yml) publishes it when `pages-stub/` changes |
| Response headers | [`public/_headers`](public/_headers), on Cloudflare only. The CSP rules stay in `index.html` |
| Backend | Google Apps Script web app at `VITE_GAS_URL`, source in `C:\Users\USER\nicu-tools\neoref\`. Unchanged by the move |
| Google Sign-In | OAuth client `VITE_GOOGLE_CLIENT_ID`. Its Authorized JavaScript origins must list the Cloudflare address |
| CI | [`ci.yml`](.github/workflows/ci.yml): lint, typecheck, coverage and build on every push and PR |

## Move from GitHub Pages to Cloudflare — 2026-09-18

Design: [spec](docs/superpowers/specs/2026-09-18-cloudflare-hosting-design.md). Plan:
[plan](docs/superpowers/plans/2026-09-18-cloudflare-hosting.md).

Why: `valhalla-health` is on GitHub Free, where GitHub Pages only publishes public repositories.
With the app on Cloudflare, this repository can go private later without taking NeoRef down.

**Before merge**

- [ ] First `wrangler deploy` from Praew's PC created the Worker and the address.
- [ ] The app files return 200: the app shell, a lesson, a lesson image, a KCMH PDF, `sw.js` and the manifest.
- [ ] `/_headers`, `/wrangler.jsonc` and an unknown path return 404.
- [ ] The response headers match `public/_headers`, and hashed `assets/` files are cached as immutable.
- [ ] The service worker installs, and the precache holds the app shell (offline reload).
- [ ] The Cloudflare address is added to the OAuth client's Authorized JavaScript origins (Praew).
- [ ] Workers Builds is connected: production branch `main`, both build variables set (Praew).
- [ ] Google sign-in and email sign-in work at the new address (Praew).

**After merge**, to be reported in the PR conversation:

- The Workers build of the merge commit succeeded and is the live deployment: the served lesson
  files are byte-identical to that commit.
- The old address serves the moved page and the new `sw.js`, and the other `valhalla-health.github.io`
  apps are unaffected.
- A browser that had the old app installed ends on the moved page, with NeoRef's service worker
  and caches gone and NeoRedact's caches intact.
- Opening the old home-screen icon on a real phone ends on the moved page (Praew).

## Rollback

- **Cloudflare:** `npx wrangler rollback` returns to the previous version. Alternatively, revert
  the merge on `main`, and Workers Builds redeploys.
- **Old address:** revert the `deploy.yml` change and GitHub Pages publishes the full app there
  again. Phones that already ran the clean-up reinstall the app from there the next time it's
  opened.

## Going private later

Not done yet. It's a one-click change in GitHub settings, and Workers Builds keeps deploying
afterwards (the Cloudflare GitHub app has access to the repo). On GitHub Free, a private repo:

- unpublishes GitHub Pages, so the moved page disappears. An installed copy nobody opened during
  the transition keeps a stale offline copy.
- stops enforcing the `protect-main` ruleset, which today blocks deleting and force-pushing `main`.
- gets 2,000 Actions minutes a month. CI takes about 2 minutes a run.

Wait about a month after the switch-over first, so installed copies pick up the clean-up. Once
the moved page is gone, remove the GitHub Pages origin from the OAuth client.
```

- [ ] **Step 6: Run the full verification suite**

```bash
cd "$WT" && npm run lint && npm run typecheck && npm run coverage && npm run build
```

Expected: every command exits 0, and coverage reports the new `src/deploy/` tests as passing.

- [ ] **Step 7: Commit**

```bash
cd "$WT" && git add README.md index.html SECURITY_CHECKLIST.md .env.example STATUS.md && git commit -F - <<'EOF'
Document the Cloudflare hosting and add STATUS.md

README's Deploy section now describes Workers Builds and the moved page.
The CSP comment in index.html and SECURITY_CHECKLIST.md say that the
CSP rules stay in the meta tag, with _headers adding only header-only
protections. .env.example points to the backend README that actually
exists. STATUS.md becomes the deployment source of truth: hosts, what
deploys, the move's verification checklist, rollback, and what changes
when the repo goes private.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: First deploy from this PC, pre-merge checks, and the PR

**Files:**
- Create (never committed): `.env.local`
- Modify: `STATUS.md` (tick the first five "Before merge" boxes, with evidence)

**Interfaces:**
- Consumes: `wrangler.jsonc` and `public/_headers` (Task 1); the build from Tasks 1–4.
- Produces: the live Worker `neoref` at `https://neoref.valhalla-health.workers.dev`; a pushed branch; and a draft PR whose number is needed in Tasks 6–9.

- [ ] **Step 1: Confirm no Worker named `neoref` exists yet**

```bash
cd "$WT" && npx --yes wrangler@4.131.0 deployments list --name neoref 2>&1 | tail -5
```

Expected: an error saying the Worker does not exist (code 10007). **If it lists deployments, STOP** — a Worker with that name already exists. Ask Praew before overwriting it.

- [ ] **Step 2: Write `.env.local` from the live app's public values**

Both values are public: they are in the JavaScript bundle every visitor downloads.

```bash
cd "$WT" && base="https://valhalla-health.github.io/NeoRef/" \
 && js=$(curl -s "$base" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1) \
 && bundle=$(curl -s "$base$js") \
 && cid=$(printf '%s' "$bundle" | grep -oE '[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com' | head -1) \
 && gas=$(printf '%s' "$bundle" | grep -oE 'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec' | head -1) \
 && test -n "$cid" && test -n "$gas" \
 && printf 'VITE_GOOGLE_CLIENT_ID=%s\nVITE_GAS_URL=%s\n' "$cid" "$gas" > .env.local \
 && git check-ignore -q .env.local && echo "ok: .env.local written and ignored"
```

Expected: `ok: .env.local written and ignored`.

- [ ] **Step 3: Build and deploy**

```bash
cd "$WT" && npm run build && npx --yes wrangler@4.131.0 deploy 2>&1 | tail -15
```

Expected: `Uploaded neoref`, `Deployed neoref triggers`, and `https://neoref.valhalla-health.workers.dev`. Wrangler also reports the upload as roughly 390 files and 25 MB.

- [ ] **Step 4: Check status codes and headers**

```bash
BASE=https://neoref.valhalla-health.workers.dev
for p in "" lessons/day-001.json lessons/images/day-227-fig-1.png kcmh/preterm-feeding-2025.pdf sw.js manifest.webmanifest _headers wrangler.jsonc no-such-file; do printf '%-40s %s\n' "/$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$p")"; done
curl -sI "$BASE/" | grep -iE '^(content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-opener-policy|x-robots-tag|cache-control):'
asset=$(curl -s "$BASE/" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1); curl -sI "$BASE/$asset" | grep -i '^cache-control:'
```

A brand-new `workers.dev` address can take a minute to answer. If the first run shows connection
errors, wait and run it again.

Expected: 200 for everything up to `/manifest.webmanifest`, and 404 for `/_headers`, `/wrangler.jsonc` and `/no-such-file`. The seven `/*` headers must be exactly as in Global Constraints, and `/` must not be `immutable`. The hashed asset must return `cache-control: public, max-age=31536000, immutable`. If a header value has a trailing `\r`, or a header is missing, stop and fix `_headers` before going on.

- [ ] **Step 5: Check the app in the built-in browser pane**

Open `https://neoref.valhalla-health.workers.dev/`. Expected: the NeoRef login screen. Then run in the page (`javascript_tool`):

```js
const reg = await navigator.serviceWorker.ready;
const names = await caches.keys();
const pre = names.find((n) => n.startsWith('workbox-precache-v2-'));
const keys = pre ? (await (await caches.open(pre)).keys()).map((r) => r.url) : [];
const shell = keys.find((u) => u.includes('index.html'));
({ state: reg.active && reg.active.state, names, precached: keys.length, shell, shellStatus: shell ? (await caches.match(shell)).status : null });
```

Expected: `state: "activated"`; `names` includes `workbox-precache-v2-https://neoref.valhalla-health.workers.dev/`; `precached` > 0; `shellStatus: 200`. Then run `read_console_messages` with `onlyErrors: true`. Expected: no CSP violations. (Sign-in errors are expected until Task 6 adds the OAuth origin.)

- [ ] **Step 6: Tick the first five "Before merge" boxes in `STATUS.md`, with evidence**

Replace each `- [ ]` with `- [x]` and append the evidence after an em dash — for example, `— 2026-09-18, wrangler 4.131.0, version <id from Step 3>`. Use the actual status codes and header lines from Steps 3–5, not the expected ones.

- [ ] **Step 7: Commit, push, and open a draft PR**

```bash
cd "$WT" && git add STATUS.md && git commit -m "STATUS: first Cloudflare deploy and pre-merge checks" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push -u origin claude/cloudflare-hosting
gh pr create --draft --base main --head claude/cloudflare-hosting --title "Move hosting from GitHub Pages to Cloudflare Workers" --body-file - <<'EOF'
## What this does

NeoRef moves to **https://neoref.valhalla-health.workers.dev**. It is a static-assets-only
Cloudflare Worker, and Workers Builds deploys every merge into `main` — the same setup as NeoFeed.
GitHub then only holds the code, so the repo can go private later. (On GitHub Free, Pages only
publishes public repos.)

When this merges, the old address `valhalla-health.github.io/NeoRef/` becomes a **"moved" page**.
Its service worker retires the old offline copy on installed phones, and it clears NeoRef's login
token and caches from the shared github.io origin — without touching any other app's.

- `wrangler.jsonc`, `public/_headers`: the Cloudflare host and its response headers
- `pages-stub/`: the moved page, the kill-switch service worker, and their shared clean-up
- `.github/workflows/deploy.yml`: now publishes `pages-stub/` only
- `STATUS.md`: hosts, the verification checklist, rollback, and going private later
- Tests: `src/deploy/` (19 tests)
- No app code changes

Design: `docs/superpowers/specs/2026-09-18-cloudflare-hosting-design.md` · Plan: `docs/superpowers/plans/2026-09-18-cloudflare-hosting.md`

## Before merge

- [x] First deploy from Praew's PC; status codes, headers and the service worker checked (see `STATUS.md`)
- [ ] Praew: add the new address to the OAuth client's Authorized JavaScript origins
- [ ] Praew: connect Workers Builds (production branch `main`, two build variables)
- [ ] Praew: Google and email sign-in at the new address

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

Expected: the push succeeds and `gh` prints the PR URL. Record the PR number (`PR`) for Tasks 6–9, then check that CI starts: `gh pr checks "$PR" --watch`. Expected: `verify` passes.

---

### Task 6: Praew's one-time setup — checkpoint

**Files:**
- Modify: `STATUS.md` (tick the last three "Before merge" boxes)

**Interfaces:**
- Consumes: the draft PR from Task 5; the values in `.env.local`.
- Produces: Workers Builds connected to the repo, and sign-in confirmed at the new address.

- [ ] **Step 1: STOP and hand Praew the two setup steps**

Send her, in plain language:
1. **Google Cloud Console** → APIs & Services → Credentials → the OAuth client whose ID starts with the first 12 digits of `VITE_GOOGLE_CLIENT_ID` → Authorized JavaScript origins → **Add URI** `https://neoref.valhalla-health.workers.dev` → Save. Keep the existing GitHub Pages origin.
2. **Cloudflare dashboard** → Workers & Pages → `neoref` → Settings → Build → **Connect** → GitHub → `valhalla-health/NeoRef`:
   - Production branch: `main`.
   - Build command: `npm run build`.
   - Deploy command: `npx wrangler deploy`.
   - Build variables: `VITE_GOOGLE_CLIENT_ID` and `VITE_GAS_URL`, with the two values from `.env.local` (give her both, in chat; both are public).
   - If GitHub asks to give the Cloudflare app access to NeoRef, allow it for that repository.

Wait for her reply. Don't continue until she confirms both steps.

- [ ] **Step 2: Confirm Workers Builds reached the repo**

```bash
cd "$WT" && git commit --allow-empty -m "Trigger a Workers build of this branch" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push && gh pr checks "$PR"
```

Re-run `gh pr checks "$PR"` until a `Workers Builds: neoref` line appears with a result. If
waiting is needed, use Monitor with an until-loop; foreground `sleep` is blocked here. Expected,
within a few minutes: that check succeeds. This is a non-production build: it uploads a version and deploys nothing. If Praew turned off builds for non-production branches, there is no such check — note that, and verify the build variables after the merge instead (Task 9, Step 2).

- [ ] **Step 3: Praew tests sign-in**

Ask her to open `https://neoref.valhalla-health.workers.dev` and to:
- sign in with Google, then open a lesson and a KCMH PDF;
- sign out, then sign in with email and password.

Wait for her result. If Google sign-in fails with an origin error, the OAuth origin hasn't taken effect yet — Google can take a few minutes.

- [ ] **Step 4: Tick the last three boxes, mark the PR ready, and push**

```bash
cd "$WT" && git add STATUS.md && git commit -m "STATUS: Workers Builds connected; sign-in verified at the new address" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push && gh pr ready "$PR"
```

Also tick the three boxes in the PR body (`gh pr edit "$PR" --body-file -`, with the same body and those boxes checked).

---

### Task 7: Prepare a browser for the kill-switch check — before merge

**Files:** none.

**Interfaces:**
- Consumes: the old address, which still serves the full app until the merge.
- Produces: a browser-pane profile with the old NeoRef service worker installed and NeoRedact's caches present. Task 9 uses it.

- [ ] **Step 1: Install the old app in the built-in browser pane**

Open `https://valhalla-health.github.io/NeoRef/`, wait for it to load, then open `https://valhalla-health.github.io/NeoRedact/` in the same tab. Run in that page:

```js
const regs = await navigator.serviceWorker.getRegistrations();
({ scopes: regs.map((r) => r.scope), caches: await caches.keys() });
```

Expected: `scopes` includes `https://valhalla-health.github.io/NeoRef/` (and NeoRedact's scope). `caches` includes `workbox-precache-v2-https://valhalla-health.github.io/NeoRef/` and a `neoredact-shell-…` cache. Save this output: it is the "before" picture for Task 9.

---

### Task 8: Merge — only on Praew's instruction

**Files:**
- Modify: `STATUS.md` (the move section's heading line)

**Interfaces:**
- Consumes: the ready PR.
- Produces: the merge commit on `main`.

- [ ] **Step 1: STOP until Praew says to merge**

A ready PR is not permission. Wait for her explicit instruction.

- [ ] **Step 2: Mark the entry merged, per her merge rule**

In `STATUS.md`, change the heading line `## Move from GitHub Pages to Cloudflare — 2026-09-18` to:

```markdown
## Move from GitHub Pages to Cloudflare — 2026-09-18 — merged into `main` on Praew's instruction
```

Record no merge commit or time: GitHub records those.

```bash
cd "$WT" && git add STATUS.md && git commit -m "STATUS: mark the Cloudflare move merged on Praew's instruction" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push
```

- [ ] **Step 3: If `main` has moved, test the combined result**

```bash
cd "$WT" && git fetch origin && git merge-base --is-ancestor origin/main HEAD && echo "main has not moved" || { git merge --no-edit origin/main && npm ci && npm run lint && npm run typecheck && npm run coverage && npm run build && git push; }
```

Expected: `main has not moved`, or a clean merge with every check passing, pushed. If the merge conflicts, stop and use superpowers:resolving-merge-conflicts — don't guess.

- [ ] **Step 4: Wait for CI, then merge**

```bash
gh pr checks "$PR" --watch && gh pr merge "$PR" --merge
```

Expected: every check passes, then `Merged pull request`.

---

### Task 9: Post-merge verification — report in chat

**Files:** none. Results are reported in the conversation, not committed (Praew's one-PR rule).

**Interfaces:**
- Consumes: the merge commit; Task 5's version ID; the prepared browser from Task 7.
- Produces: the post-merge report.

- [ ] **Step 1: Post-merge CI, the Workers build, and the Pages deploy**

```bash
M=$(gh pr view "$PR" --json mergeCommit --jq .mergeCommit.oid) && echo "merge: $M"
gh run list -R valhalla-health/NeoRef --commit "$M" --limit 5
gh api "repos/valhalla-health/NeoRef/commits/$M/check-runs" --jq '.check_runs[] | [.name, .status, .conclusion] | @tsv'
```

Expected: `CI` success, `Deploy moved page to GitHub Pages` success, and `Workers Builds: neoref` success. Wait and re-run while any of them is still in progress.

- [ ] **Step 2: The live deployment is Workers Builds' build of the merge commit**

A byte comparison of `index.html` against a local build can't work here. This PC checks text
files out with CRLF (`core.autocrlf=true`), and Workers Builds builds on Linux with LF. The lesson
files show the difference instead: Task 5's deploy from this PC served them with CRLF, while a
Workers build serves the exact bytes from git.

```bash
cd "$WT" && BASE=https://neoref.valhalla-health.workers.dev
for f in lessons/day-001.json lessons/day-230.json; do curl -s "$BASE/$f" | cmp -s - <(git show "$M:public/$f") && echo "$f identical to $M" || echo "$f DIFFERS"; done
npx --yes wrangler@4.131.0 deployments list --name neoref 2>&1 | tail -20
```

Expected: both files `identical to` the merge commit. The newest deployment was created after the
merge and is not Task 5's version ID. Then re-run Task 5, Step 4's status-code and header checks
against the live site. Expected: the same results as before the merge.

- [ ] **Step 3: The old address serves the stub, and its siblings still work**

```bash
OLD=https://valhalla-health.github.io/NeoRef
curl -s "$OLD/" | grep -c 'NeoRef ย้ายที่อยู่แล้ว'
curl -s "$OLD/sw.js" | grep -c 'NeoRefCleanup'
for p in cleanup.js lessons/day-001.json kcmh/preterm-feeding-2025.pdf manifest.webmanifest; do printf '%-32s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$OLD/$p")"; done
curl -s -o /dev/null -w 'NeoRedact %{http_code}\n' https://valhalla-health.github.io/NeoRedact/
```

Expected: `1`, `1`, then `cleanup.js 200`, `404` for the three old app files, and `NeoRedact 200`.

- [ ] **Step 4: The kill switch, in the browser prepared in Task 7**

In the same browser pane, open `https://valhalla-health.github.io/NeoRef/`, wait about 5 seconds, then take a screenshot and run:

```js
const regs = await navigator.serviceWorker.getRegistrations();
({ url: location.href, title: document.title, scopes: regs.map((r) => r.scope), caches: await caches.keys() });
```

Expected: the title is `NeoRef ย้ายที่อยู่แล้ว`; `scopes` no longer includes `…/NeoRef/` but still includes NeoRedact's; `caches` has none of NeoRef's four caches but still has the `neoredact-shell-…` cache from Task 7. If the first load shows the old app, wait a few seconds and look again: the worker reloads the tab once it takes over.

- [ ] **Step 5: Report, and ask Praew for the phone check**

Post the results of Steps 1–4 in chat, with the actual output. Ask Praew to open the old NeoRef icon on one phone. Expected: it ends on the moved page, and the button leads to the new app.

---

### Task 10: Outside-repo docs and clean-up

**Files:**
- Modify: `C:\Users\USER\OneDrive\Desktop\_Wiki\Web-Apps.md` (the NeoRef row, "Before touching an app", History, and `updated:` in the front matter)
- Modify: `C:\Users\USER\nicu-tools\neoref\README.md` (step 4, the OAuth origins)

**Interfaces:**
- Consumes: Task 9's verified results.
- Produces: up-to-date pointers outside the repo, and the worktree removed.

- [ ] **Step 1: Update the wiki's Web Apps page**

Replace the NeoRef row. Old:

```markdown
| `NeoRef\` 📘 | Neonatal reference PWA — *not a clinical decision aid*. Current app is `neoref-app\` (Vite 5 + React 18 + TypeScript, offline PWA, locked-down CSP); loose `.jsx` at the root are the earlier prototype. Clinical wording/threshold changes need Praew's sign-off. Read `neoref-app\README.md`, `AUDIT.md`. |
```

New:

```markdown
| `NeoRef\` 📘 | Neonatal reference PWA — *not a clinical decision aid*. Current app is `neoref-app\` (Vite 5 + React 18 + TypeScript, offline PWA, locked-down CSP), on Cloudflare Workers at `neoref.valhalla-health.workers.dev` since 2026-09-18; the old GitHub Pages address is a "moved" page. Loose `.jsx` at the root are the earlier prototype. Clinical wording/threshold changes need Praew's sign-off. Read `neoref-app\STATUS.md`, `README.md`, `AUDIT.md`. |
```

Under "Live apps deploy differently", add:

```markdown
  - *NeoRef* — **merging into `main` deploys** (Cloudflare Workers Builds). `pages-stub/` is all that GitHub Pages serves now. See the repo's `STATUS.md`.
```

Under "History", add at the top:

```markdown
- **2026-09-18** — NeoRef moved from GitHub Pages to Cloudflare Workers (`neoref.valhalla-health.workers.dev`), deployed by Workers Builds on merge into `main`. The old address is a "moved" page. The repo can now go private; see its `STATUS.md` for what that changes.
```

Set the front matter's `updated:` to `2026-09-18`. Don't touch `files:` or `counted:`: they are generated.

- [ ] **Step 2: Update the backend README's OAuth step**

In `C:\Users\USER\nicu-tools\neoref\README.md`, step 4 currently says the authorized JavaScript origins are "the GitHub Pages origin + `http://localhost:5173`". Change it to:

```markdown
4. Google Cloud Console → OAuth Client ID (Web application) → authorized
   JavaScript origins = `https://neoref.valhalla-health.workers.dev` (the
   live app, on Cloudflare since 2026-09-18) + `http://localhost:5173` for
   local dev. The GitHub Pages origin stays listed until that repo goes
   private (see neoref-app's STATUS.md). That client ID is `VITE_GOOGLE_CLIENT_ID`.
```

That folder is its own git repo. Commit the change there:

```bash
cd /c/Users/USER/nicu-tools/neoref && git add README.md && git commit -m "README: OAuth origins now include NeoRef's Cloudflare address" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git status -sb | head -1
```

If the repo has a remote, ask Praew before pushing.

- [ ] **Step 3: Remove the worktree**

```bash
cd "/c/Users/USER/repos/PraewPP/Web App Projects/NeoRef/neoref-app" && git -C "$WT" status --porcelain && rm -f "$WT/.env.local" && git worktree remove --force "$WT" && git worktree list
```

Expected: the first command prints nothing (no uncommitted tracked work — `node_modules/` and `dist/` are ignored, which is why `--force` is safe here). The final list shows only the main checkout. Leave the `.claude/worktrees/` line in `.git/info/exclude`: it keeps future agent worktrees out of `git status`.

- [ ] **Step 4: Refresh the generated web-apps status**

```bash
python "$USERPROFILE/OneDrive/Desktop/_Wiki/tools/refresh_webapps.py"
```

Expected: NeoRef shows no new standing flags. Praew's main checkout still shows only its one pre-existing modified file.
