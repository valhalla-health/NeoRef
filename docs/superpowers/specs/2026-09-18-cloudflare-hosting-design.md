# NeoRef on Cloudflare — design

Date: 2026-09-18 · Status: design approved by Praew in chat, 2026-09-18 · Branch: `claude/cloudflare-hosting`

## Goal

Move NeoRef's hosting from GitHub Pages to Cloudflare Workers, the way NeoFeed is hosted, so that
GitHub only holds the code and the repository can be made private later without taking the site
down.

Hosting has to move first because `valhalla-health` is on GitHub Free, where GitHub Pages only
publishes public repositories. Making `valhalla-health/NeoRef` private today would unpublish
`valhalla-health.github.io/NeoRef/`.

## Decisions (Praew, 2026-09-18)

| Question | Decision |
|---|---|
| Content: lessons, Pimolrat textbook, KCMH PDFs | Stays in the repo, and becomes private when the repo does |
| What deploys | Merging into `main` (no `release` branch) |
| Deploy mechanism | Cloudflare Workers Builds connected to GitHub, as for NeoFeed |
| Old address | Becomes a "moved" page when this PR merges; one host afterwards |

## Non-goals

- Moving lesson content out of git, or rewriting git history.
- A release-branch deploy gate.
- Changing app code, clinical wording or the GAS backend.
- Tightening the `<meta>` CSP — for example naming the full GAS `/exec` path in `connect-src`, as
  NeoFeed did. A possible follow-up.
- A custom domain.
- Carrying device-only settings, such as text size, over to the new origin. Completions, bookmarks
  and stats are already on the GAS backend.
- Making the repository private. That is a later step; see §7.

## 1 · The Cloudflare host

New address: `https://neoref.valhalla-health.workers.dev` — a Worker named `neoref` on the
Cloudflare account that hosts NeoFeed (`praew.tvl@gmail.com`).

### Files

**`wrangler.jsonc`** — a static-assets-only Worker with no Worker code:

```jsonc
{
  "name": "neoref",
  "compatibility_date": "2026-09-01",
  "assets": { "directory": "./dist" },
  "workers_dev": true,
  "preview_urls": false
}
```

`preview_urls: false` means builds of unmerged branches never get a public URL. Asset handling
keeps Cloudflare's defaults, so unknown paths return 404. NeoRef has no URL routing — navigation is
`history.pushState` with state only — and `base: './'` works at the root.

**`public/_headers`** — Vite copies it into `dist/`; Cloudflare reads it as configuration and does
not serve it. It has no file extension, so the service worker's precache glob never picks it up.

For `/*`:

- `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`. This is the one
  protection the `<meta>` CSP cannot give: browsers ignore `frame-ancestors` in a meta policy. The
  meta CSP in `index.html` stays the only definition of the script, connect and image rules.
  Browsers enforce both policies, so the header can only restrict further.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer` — the same as the meta tag today.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`. Google Sign-In's popup needs
  `window.opener`, and plain `same-origin` breaks the login callback. NeoFeed verified this value.
- `X-Robots-Tag: noindex, nofollow`, so search engines don't index the app or its lesson files.
  The Pimolrat text must not be redistributed outside the app.

For `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`, because these file names
carry a content hash. Everything else keeps Cloudflare's default revalidation, so `index.html`,
`sw.js` and lesson files update on the next load.

**`.gitignore`** — add `.wrangler/`.

### Security gain

On its own origin, NeoRef's session token (`neoref:session` in `localStorage`) and per-account data
no longer share browser storage with the other `valhalla-health.github.io` apps.

### One-time setup (Praew)

1. Google Cloud Console → the OAuth client whose ID is `VITE_GOOGLE_CLIENT_ID` → Authorized
   JavaScript origins → add `https://neoref.valhalla-health.workers.dev`. Keep the GitHub Pages
   origin until §7.
2. Cloudflare dashboard → Workers & Pages → `neoref` → Settings → Build → connect
   `valhalla-health/NeoRef`:
   - production branch: `main`
   - build command: `npm run build`
   - deploy command: `npx wrangler deploy`
   - build variables: `VITE_GOOGLE_CLIENT_ID` and `VITE_GAS_URL`, with the same values as the
     GitHub secrets. Both are public in the served bundle.

   If the Cloudflare GitHub app only has access to selected repositories, add NeoRef when prompted.

## 2 · Switch-over of the old address

`.github/workflows/deploy.yml` stops building the app. It publishes `pages-stub/` to GitHub Pages
as it is, with no build step. It runs on pushes to `main` that change `pages-stub/**` or the
workflow, and on manual dispatch.

`pages-stub/` holds three files:

- **`index.html`** — "NeoRef ย้ายที่อยู่แล้ว / NeoRef has moved". A button to
  `https://neoref.valhalla-health.workers.dev/`, and a short note on adding the new app to the home
  screen and deleting the old icon. Self-contained (no fonts or scripts from elsewhere) and marked
  `noindex`.
- **`cleanup.js`** — one clean-up routine shared by the page and the service worker:
  - Deletes every `localStorage` key that starts with `neoref:`: the session token and the
    per-account copies. The backend keeps completions, bookmarks and stats.
  - Deletes only NeoRef's caches: `workbox-precache-v2-https://valhalla-health.github.io/NeoRef/`
    (Workbox's precache for NeoRef's scope), `lesson-content`, `lesson-images` and `kcmh-docs`.
    Checked against the live `sw.js` on 2026-09-18. It never deletes another app's cache:
    `valhalla-health.github.io` is shared, and NeoRedact is a live offline app there. NeoRedact's
    own worker follows the same rule with its `neoredact-` prefix.
  - On the page only: unregisters any service worker whose scope is NeoRef's.
- **`sw.js`** — replaces the old Workbox worker on installed phones. On install it calls
  `skipWaiting()`. On activate it runs the cache clean-up, calls `registration.unregister()`, then
  reloads every window it controls, so that window lands on the moved page. Browsers re-check
  `sw.js` whenever the app is opened, so an installed copy picks this up the next time it's used.

Nothing else is published. Lessons, PDFs and app files at the old address return 404.

What a user sees: they open the old home-screen icon, the old app shows for a moment, and then
the moved page appears. They tap the button, sign in, and add the new app to the home screen.

## 3 · Tests

Automated, run by `npm test` and CI:

- The cache filter deletes exactly NeoRef's four caches and keeps every other cache — for example
  `neoredact-shell-v11`, or `workbox-precache-v2-https://valhalla-health.github.io/NeoRedact/`.
- The storage clean-up removes only `neoref:` keys.
- `sw.js`: install calls `skipWaiting()`; activate deletes NeoRef's caches, unregisters, and
  reloads the windows it controls. These run in a sandbox with mocked `caches`, `registration` and
  `clients`.
- `public/_headers` keeps its `frame-ancestors`, COOP and `noindex` lines, and `wrangler.jsonc`
  serves `./dist` with preview URLs off. This guards against their silent removal.
- The existing lint, typecheck, coverage and build keep passing.

Manual, before merge, on the new host after a first `wrangler deploy` from this PC:

- Agent: the login screen loads; a lesson JSON, a lesson image and a KCMH PDF return 200;
  `/_headers`, `/wrangler.jsonc` and an unknown path return 404; the response headers match
  `_headers`; the app reloads offline after a first visit.
- Praew: Google sign-in and email sign-in both work, and a lesson and a KCMH PDF open when signed
  in.

Manual, after merge:

- Agent: the Workers build of the merge commit succeeded and is the live deployment: the served
  lesson files are byte-identical to that commit. A local build can't be byte-compared, because
  this PC checks files out with CRLF. The old address serves the moved page and the new `sw.js`,
  and the other `valhalla-health.github.io` apps are unaffected.
- Praew: opening the old home-screen icon on one phone ends on the moved page.

## 4 · Docs, in the same PR

- `README.md` — Deploy section rewritten for Cloudflare and the moved page.
- `index.html` — the CSP comment updated: the meta CSP is no longer the only enforcement point,
  since `_headers` adds header-only protections on Cloudflare.
- `SECURITY_CHECKLIST.md` — mention `_headers` next to the CSP line.
- `.env.example` — fix the dead path: `nicu-tools\newborn-levelup` → `nicu-tools\neoref`.
- New `STATUS.md` — the hosts, what deploys, how it was verified, rollback, and the §7 checklist.
- `AUDIT.md` and `VERIFICATION.md` are dated records and stay unchanged.
- After merge, outside this repo: NeoRef's row in `_Wiki\Web-Apps.md`, and the OAuth-origins step
  in the backend README (`nicu-tools\neoref\README.md`).

## 5 · Rollout order

1. Branch `claude/cloudflare-hosting` in a worktree under `.claude/worktrees/`. Praew's main
   checkout has an uncommitted edit and is left alone.
2. Implement §1–§4.
3. Build and run the first `wrangler deploy` from this PC. That creates the Worker and the address;
   nobody is sent there yet.
4. Praew does the one-time setup in §1.
5. Run the pre-merge checks in §3, then open the PR.
6. On Praew's instruction, merge following her merge rule: a docs commit marking `STATUS.md`
   "merged into `main` on Praew's instruction", CI green, and a re-test if `main` has moved.
   Workers Builds deploys `main`, and the Pages workflow publishes the moved page.
7. Run the post-merge checks in §3 and report post-merge CI.

## 6 · Rollback

- Cloudflare: `npx wrangler rollback` returns to the previous version. Alternatively, revert the
  merge and Workers Builds redeploys.
- Old address: revert the `deploy.yml` change and the Pages workflow publishes the full app there
  again. Phones that already ran the clean-up reinstall the app from that address the next time
  it's opened.

## 7 · Going private later (not in this PR — recorded in `STATUS.md`)

- Flip the repo to private in GitHub settings. Workers Builds keeps deploying, because the
  Cloudflare GitHub app has access to the repo.
- On GitHub Free, a private repo:
  - unpublishes GitHub Pages, so the moved page disappears. An installed copy nobody opened during
    the transition keeps a stale offline copy.
  - stops enforcing the `protect-main` ruleset, which today blocks deleting and force-pushing
    `main`.
  - gets 2,000 Actions minutes a month. CI takes about 2 minutes a run.
- Wait about a month after the switch-over, so installed copies pick up the clean-up.
- Remove the GitHub Pages origin from the OAuth client once the moved page is gone.
