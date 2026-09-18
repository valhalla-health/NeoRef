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
