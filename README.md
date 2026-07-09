# Newborn · In-Hand Reference (NeoRef)

Neonatal **educational reference** — daily lessons, teaching calculators, and quick
protocol cards, packaged as an installable offline PWA.

> ⚠️ **Educational use only — not a clinical decision aid.** Verify every value
> against your institution's protocols and the official published tools before any
> patient care. No patient-identifiable data is collected or stored.

This is the productionized rewrite of the original CDN + in-browser-Babel prototype
(kept at `../` for reference). See [`../AUDIT.md`](../AUDIT.md) for the full scrutiny
report that drove this rebuild.

## Stack

- **Vite 5** + **React 18** + **TypeScript** (strict) — no in-browser Babel, no CDN.
- **vite-plugin-pwa** (Workbox) — real offline: app shell, fonts, and assets precached.
- Self-hosted fonts via `@fontsource` (no Google Fonts → faster + PDPA-safe).
- **Vitest** + Testing Library, **ESLint** (flat) + **Prettier**.
- Locked-down CSP meta (`default-src 'self'`) — no external origins.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Verify (run before committing)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI (`.github/workflows/ci.yml`) runs all four on every push/PR.

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on push
to `main`. `base` is `'./'`, so the build is portable across user/project Pages sites.
Enable Pages → "GitHub Actions" in repo settings.

## Migration status (audit + foundation pass)

Done: build/test/lint/CI/PWA foundation; typed versioned storage; real-clock
curriculum day (fixes the frozen-date bug); shared UI primitives; error boundary;
**EOS repositioned as educational** (invented risk score + antibiotic recommendation
removed, replaced with a factor-direction explainer + link to the real Kaiser tool).

**All 12 calculators/topic pages are now ported** to `src/features/calc/`:
- **EOS** and **Fenton** — educational (interactive). Fenton drops the prototype's
  false-precision interpolated percentile and shows only the SGA/AGA/LGA band + link
  to the official PediTools calculator, per AUDIT's remediation options.
- **HIE, BPD, NEC, PDA, RDS, IVH, LOS, ROP, Seizures, POCUS** — static reference
  cards, ported via a shared `src/features/calc/topic/TopicHelpers.tsx` module (the
  TS equivalent of the prototype's `topic-helpers.jsx`). Every screen now shows the
  `DisclaimerBanner` and has a real (not fake) back button.
- A registry (`src/features/calc/registry.tsx`) maps calc id → screen component;
  `src/features/calc/registry.test.tsx` renders every ported calc through the real
  app navigation as a regression check.
- Two AUDIT-flagged clinical-accuracy items remain **unresolved in the code, by
  design** — ported verbatim with a comment, pending Praew's clinical confirmation:
  `bpd.jsx:66`'s "Grade 3A = death" wording, and the "bowel wall > 2.6mm = NEC
  concern" line (appears in both `NecScreen.tsx` and `PocusScreen.tsx`). The
  `hie.jsx:140` "BE ≥-16" ambiguous notation is likewise ported verbatim with a
  flagging comment. See `../AUDIT.md` for the full list — do not reword these
  without clinician sign-off.

Next (incremental): apply the clinical-accuracy fixes above once confirmed; add the
global disclaimer to `CalcHub`'s hub screen itself (currently only on the individual
calc screens); reconcile the 365-entry lesson dataset; decide the `uploads/` folder's
git-history fate (still tracked in the prototype directory, ~24MB of copyrighted
material — see AUDIT S-1); commit this work (nothing has been committed yet).

## Layout

```
src/
  theme/        design tokens (ported warmTheme) + global css
  lib/          storage (typed/versioned), today (real clock) + tests
  components/   ui primitives, BottomNav, ErrorBoundary, Disclaimer
  data/         lessons, calc registry
  features/
    home/       HomeScreen
    calc/       CalcHub + eos/ (educational EOS + pure content model + tests)
    learn/      LearnScreen
```
