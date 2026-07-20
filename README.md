# Newborn · In-Hand Reference (NeoRef)

Neonatal **educational reference** — daily lessons, teaching calculators, and quick
protocol cards, packaged as an installable offline PWA.

> ⚠️ **Educational use only — not a clinical decision aid.** Verify every value
> against your institution's protocols and the official published tools before any
> patient care. No patient-identifiable data is collected or stored.

This is the productionized rewrite of an earlier CDN + in-browser-Babel prototype
(kept in a private repo, not published here). See [`AUDIT.md`](AUDIT.md) for the full
scrutiny report that drove this rebuild.

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
- Three AUDIT-flagged clinical-accuracy items remain **unresolved in the code, by
  design** — ported verbatim with a comment, pending Praew's clinical confirmation:
  `BpdScreen.tsx`'s "Grade 3A = death" wording, the "bowel wall > 2.6mm = NEC
  concern" line (appears in both `NecScreen.tsx` and `PocusScreen.tsx`), and
  `HieScreen.tsx`'s "BE ≥-16" ambiguous notation. See [`AUDIT.md`](AUDIT.md) for the
  full list — do not reword these without clinician sign-off.

Next (incremental): apply the clinical-accuracy fixes above once confirmed; add the
global disclaimer to `CalcHub`'s hub screen itself (currently only on the individual
calc screens); reconcile the 365-entry lesson dataset against the source curriculum.

## License & copyright

**Code** is proprietary, all rights reserved, © 2026 Valhalla Health. No license is
granted to copy, modify, or distribute it.

**Calculator / topic-card content** (`src/features/calc/**`) — drug doses, staging
criteria, protocol summaries — is original educational material written by the team,
referencing standard published neonatology literature. It is not a verbatim copy of
any single copyrighted textbook or institutional guideline.

**Daily Lessons content** (`src/data/lessons.ts`, `public/lessons/*.json`) is a set of
bilingual (Thai/English) **short-note study summaries written by the Valhalla Health
team** while studying the referenced chapters of *Avery's Diseases of the Newborn*,
*Fanaroff and Martin's Neonatal-Perinatal Medicine*, and *The Newborn Lung*. The
book/chapter/author fields shown in the app are citations to the source chapter, not a
license to reproduce it — the lesson text itself is the team's own condensed notes and
commentary, not an excerpt or paraphrase-for-paraphrase copy of the textbook. Copyright
in each textbook remains with its respective publisher and authors; this project claims
no rights over that source material, only over the team's own summary write-ups
(© 2026 Valhalla Health). These notes are for personal/internal educational study —
if you plan to redistribute them beyond that (e.g. a public course, a for-profit
product), get the textbook publishers' permission first, since "short notes that closely
track a book's structure" is exactly the kind of derivative use that benefits from
clearing rights rather than relying on fair-use/fair-dealing alone.

**Pimolrat textbook content** (Days 223–246, `book: "Pimolrat"` in
`public/lessons/*.json`) is different from the Daily Lessons above: it is the
**full original text** of ศ.กิตติคุณ พญ.พิมลรัตน์ ไทยธรรมยานนท์'s (Prof.
Emeritus Dr. Pimolrat Thaithumyanon's) newborn-care textbook, reformatted for
on-screen readability (headings, bullet lists, tables, figures) but with no
wording changed — reproduced here **with the author's explicit permission**,
not under the "team's own summary" framing above. Copyright in the original
text and figures remains with the author; this project's license does not
extend to that content, and it should not be redistributed outside this app
without her separate permission.

None of this content is a substitute for your institution's own protocols or the
official published clinical tools this app links to, and it is provided for educational
purposes only.

## Lesson content

`public/lessons/day-*.json` is generated from a source `.docx` series by
`scripts/extract_lessons.py` (source directory not in this repo). Before
adding or re-extracting lessons, see
[`scripts/LESSON_CHECKLIST.md`](scripts/LESSON_CHECKLIST.md) — it covers what
`LessonDetail.tsx` already fixes automatically (dense-text bulleting, a couple
of table extraction quirks) and what to check by hand. `npm test` includes a
corpus-wide check (`src/data/lessonContentRules.test.ts`) that runs against
every lesson file.

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
