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
