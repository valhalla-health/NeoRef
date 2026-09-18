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
