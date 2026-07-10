---
name: app-walkthrough
description: Run a full screen-by-screen verification walkthrough of the NeoRef app (all 4 tabs, all 12 calculators) — static checks plus a live browser pass — and write up the results. Use when asked to verify, walk through, scrutinize, or sanity-check the app end to end, after a batch of feature work, or before a release/deploy.
---

# NeoRef app walkthrough

This skill captures what a full verification pass of NeoRef looks like, so it can
be repeated consistently as the app grows. It's distilled from the walkthrough in
`VERIFICATION.md` (2026-07-09) and the app-architecture knowledge from `AUDIT.md`
and `README.md`. Read those three files first if this is your first pass — they
have the historical "why" behind several of the checks below.

## What the app is

"Newborn · In-Hand Reference" (NeoRef) — a neonatal **educational reference**
PWA: daily lessons, teaching calculators, protocol cards. Explicitly **not** a
clinical decision aid. Vite 5 + React 18 + TypeScript (strict), Vitest +
Testing Library, ESLint + Prettier, `vite-plugin-pwa`, self-hosted fonts, CSP
`default-src 'self'`, no external network calls anywhere. localStorage-only,
no accounts, no patient data.

### Screens (`src/App.tsx`, 4-tab state nav, no router)

| Tab | Component | Sub-nav |
|---|---|---|
| Home | `features/home/HomeScreen.tsx` | — |
| Tools | `features/calc/CalcHub.tsx` → 12 screens via `features/calc/registry.tsx` | `calcId` (null = hub) |
| Learn | `features/learn/LearnScreen.tsx` → `LessonDetail.tsx` | `lessonDay` (null = list) |
| Progress | `features/gamify/GamifyScreen.tsx` | — |

The 12 calc/topic ids (`registry.tsx`): `eos`, `fenton` (the two that actually
*compute* something — see below), `hie`, `bpd`, `nec`, `pda`, `rds`, `ivh`,
`los`, `rop`, `seizures`, `pocus` (static reference cards via shared
`features/calc/topic/TopicHelpers.tsx`).

### Core lib knowledge

- `lib/today.ts` — `resumeDay(progress, now)` (not `curriculumDay()`) is what
  Home/Learn use to pick "today's" lesson: a never-read learner starts at Day
  1, then advances one day per calendar day since their **own** first
  completed lesson. This intentionally decouples the shown day from
  `CURRICULUM_START` (2026-01-01) so day-label and progress-bar never
  disagree. Don't "fix" a Home/Learn day mismatch by reaching for
  `curriculumDay()` — that was the old bug (AUDIT C-1 → the stale-lesson
  regression fixed in `VERIFICATION.md`).
- `lib/storage.ts` — typed/versioned localStorage envelopes (`{v, data}`),
  three stores: `lesson-progress`, `bookmarks`, `tool-usage`. Unknown version
  or bad shape → silently falls back to empty, never throws.
- `lib/gamify.ts` + `features/gamify/LevelCard.tsx` — XP/level/streak/9 badges
  derived purely from the three storage maps above (no separate source of
  truth). `recordToolOpen` fires from `App.tsx`'s `openCalc`/`selectCalc`.
- `lib/lessonSearch.ts` — chapter/synonym search used by Learn's search field.
- `public/lessons/*.json` + `src/data/lessons-index.json` — per-day lesson
  content, currently a **partial** curriculum (not all 365 days authored;
  known gap, tracked in README's "Next" section — don't treat missing days as
  a new bug).

## Known invariants — verify these haven't regressed

From `AUDIT.md`'s remediation and `VERIFICATION.md`'s findings. Treat any
violation as a real regression:

- **EOS screen**: no numeric risk score (`/1000` or similar), no antibiotic
  recommendation — qualitative factor-direction explainer + link to the real
  Kaiser calculator only.
- **Fenton screen**: no interpolated single-percentile output — SGA/AGA/LGA
  band + link to PediTools only.
- Every calc/topic screen shows the `DisclaimerBanner` and has a working back
  button (`onBack`).
- Home's educational disclaimer is muted, at the **bottom** of the page (not
  top, not alarm-styled) — moved there deliberately so it doesn't compete with
  the lesson card.
- Four clinical-accuracy items are **ported verbatim, unresolved by design**,
  each flagged with an inline code comment — do **not** reword without
  clinician sign-off: `BpdScreen.tsx` "Grade 3A = death", `NecScreen.tsx` +
  `PocusScreen.tsx` "bowel wall > 2.6mm = NEC concern", `HieScreen.tsx` "BE
  ≥ −16".
- No `dangerouslySetInnerHTML` / `innerHTML` / `eval` / external API calls
  anywhere in `src/`. CSP meta tag intact. No `uploads/` folder committed.
- Home/Learn's "current day" label always matches the learner's own progress
  (see `resumeDay` above) — never silently shows a day whose content doesn't
  match the header number.

## Procedure

### 1. Static checks

```bash
npm run lint
npm run typecheck
npm run coverage   # (or `npm test` if coverage isn't needed)
npm run build
```

All four must be clean before a live pass is worth doing — CI (`.github/workflows/ci.yml`) runs the same four on every push/PR.

### 2. Live browser walkthrough

Start the dev server (`npm run dev`, http://localhost:5173) and drive it with a
browser tool at a **390×844 mobile viewport** (this is a phone-first PWA — desktop
width hides real layout bugs). Watch the console for errors throughout.

Walk, in order:

1. **Home** — lesson card shows the correct resumed day; disclaimer at bottom,
   muted; level/streak card links into Progress.
2. **Tools hub → each of the 12 calc/topic screens** — open every one, exercise
   every internal tab where the screen has them, confirm disclaimer banner +
   back button on each, confirm EOS/Fenton invariants above.
3. **Learn** — list renders, search field (try a synonym, e.g. "jaundice" →
   should resolve via `lessonSearch.ts`'s synonym map), open a lesson detail,
   mark done/undone, confirm the OneDrive `.docx` source link is present.
4. **Progress** — level, streak, stat tiles, badge grid; open a tool from Tools
   and confirm XP/tool-usage count updates live back on this tab.

Note any console errors (distinguish real errors from the known-benign
`frame-ancestors`-via-`<meta>` browser warning, which is expected and
harmless on GitHub Pages).

### 3. Write up results

Update `VERIFICATION.md` (or add a new dated section if a prior pass is still
worth keeping) with: a summary results table (mirroring the checks above), any
bug found + fix applied, and anything noted-but-not-changed with a reason.
Keep the existing document's tone — terse, evidence-based, links back to
`AUDIT.md` items by id (`C-1`, `S-2`, etc.) where a finding traces back to one.

If you find and fix a bug during the walkthrough, add a regression test for it
in the same commit, the same way the Home stale-lesson fix did
(`HomeScreen.test.tsx`, dataset-size-agnostic — derives the expected label from
the real helpers rather than hardcoding a day number).
