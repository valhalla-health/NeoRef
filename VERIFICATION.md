<!--
Full-app walkthrough + scrutiny pass of the current Vite/React/TS rewrite (not
the old CDN prototype AUDIT.md was written against). Complements AUDIT.md —
that document is the historical record of what drove the rewrite; this one
verifies the rewrite itself, screen by screen, against the claims in README.md.
-->

# NeoRef — App Verification Walkthrough

**Date:** 2026-07-09 · **Scope:** the production Vite + React + TypeScript app in `src/`
(commit at time of review), all 4 tabs, all 12 ported calculators/topic cards.
**Method:** full lint/typecheck/test/build pass, source review of every screen and
shared lib, and a live Playwright walkthrough (390×844 mobile viewport) of every
tab and calculator with console-error capture and screenshots.

## Result: pass, with one fix applied and two items to note

| Check | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm test` (114 tests, 27 files) | ✅ all pass |
| `npm run build` | ✅ succeeds, PWA precache generates (49 entries) |
| Console errors during live walkthrough | none (one benign browser warning, see below) |
| All 4 tabs (Home / Tools / Learn / Progress) | ✅ render and navigate correctly |
| All 12 calc/topic screens (`eos`, `fenton`, `hie`, `bpd`, `nec`, `pda`, `rds`, `ivh`, `los`, `rop`, `seizures`, `pocus`) | ✅ all render, all tabs within each screen work, all have a working back button and the disclaimer banner |
| EOS screen | ✅ confirmed **no** numeric risk score, **no** antibiotic recommendation — purely qualitative factor-direction breakdown + link to the real Kaiser calculator, matching AUDIT's remediation |
| Fenton screen | ✅ confirmed **no** interpolated single-percentile output — SGA/AGA/LGA band only + link to PediTools |
| The 4 AUDIT-flagged clinical-accuracy items (BPD "Grade 3A = death", NEC/POCUS "bowel wall >2.6mm", HIE "BE ≥-16") | ✅ still present verbatim with inline code comments flagging each as unconfirmed — correctly *not* reworded without clinician sign-off, per README/AUDIT instruction |
| CSP, offline/PWA, no `uploads/`, no XSS sinks, no external calls | ✅ verified — `default-src 'self'` CSP is intact, `.gitignore` still excludes `uploads/`, no `dangerouslySetInnerHTML`/`innerHTML`/`eval`/external API calls anywhere in `src/` |
| CI (`ci.yml`) / deploy (`deploy.yml`) workflows | ✅ present and consistent with README |

## Fixed during this pass

**Home screen mislabeled stale lesson content as "today's" lesson.**
`src/features/home/HomeScreen.tsx` (pre-fix) always rendered the header as
`Today · Day {curriculumDay()}`, but the lesson shown underneath comes from
`lessonForDay(today)`, which **silently falls back to the nearest earlier
authored lesson** once the real-clock curriculum day outruns the 159-entry
lesson dataset (`src/data/lessons-index.json` currently covers days 1–169,
non-contiguously). As of today (2026-07-09), the real curriculum day is **190**
— past the dataset's ceiling — so every visit to Home showed:

> "TODAY · DAY 190" → a card for **Day 169, Ch 72, Cardiac Embryology**

with no indication the two numbers disagree. A learner tracking daily progress
against the 365-day curriculum would reasonably read this as "day 190's lesson
is Cardiac Embryology," which is simply what the dataset has, not what day 190
actually is. This is the direct, still-live descendant of AUDIT's C-1 (frozen
date) — the *clock* fix landed, but the *content* backing it hasn't caught up,
and the UI didn't disclose the gap.

**Fix applied** (`HomeScreen.tsx`): the header now reads `Latest lesson · Day
{lesson.day}` instead of `Today · Day {today}` whenever the resolved lesson's
day doesn't match the real curriculum day, and the card itself now always
prints its own day number (`Day {lesson.day} · Ch {lesson.chapter} · {book}`)
so the two numbers are never displayed as if they matched when they don't.
Covered by a new regression test in `HomeScreen.test.tsx` (dataset-size
agnostic — it derives the expected label from `lessonForDay`/`curriculumDay`
directly, so it stays correct as more lesson days are authored) and
`App.test.tsx` was updated to accept either header form.

Once the lesson dataset is reconciled to cover the full 365 days (already
tracked in README's "Next" section), `isExactMatch` will always be true and
the header reverts to "Today" automatically — no further change needed then.

## Noted, not changed (judgment calls / out of scope for this pass)

- **`LearnScreen.tsx`'s per-row "done" toggle is a `role="checkbox"` `<span>`
  nested inside a `<button>`** (the row's own click target opens the lesson).
  Nesting interactive content inside a `<button>` is invalid per the HTML5
  content model, and the checkbox has no `tabIndex`, so keyboard-only users
  can't reach it directly from the list (they *can* still mark a lesson done
  from inside `LessonDetail`, which uses a proper standalone button). Existing
  tests (`LearnScreen.test.tsx`) assert on this exact structure
  (`closest('button')` / nested `getByRole('checkbox')`), so fixing this
  cleanly means restructuring the row *and* updating those tests — a
  deliberate follow-up rather than a drive-by change here.
- **Lesson dataset coverage (159/365 days, gaps at 152/155/159/161–167) and the
  "Curriculum Complete" badge (target: 365 lessons done) being currently
  unreachable** — this is the known, already-tracked "reconcile the 365-entry
  lesson dataset" item from README's "Next" section, not a new finding. Flagged
  here only because the Home-screen fix above is a symptom of it, not the root
  cause; the root cause is a content-authoring task, not a code bug.
- **`frame-ancestors` CSP directive logged as ignored-via-`<meta>`** in the
  browser console during the walkthrough. Expected and harmless: GitHub Pages
  can't set HTTP headers, so the CSP is necessarily meta-only, and
  `frame-ancestors` specifically has no meta-tag equivalent (browsers just warn
  and ignore it) — `object-src 'none'` and `base-uri 'self'` still apply from
  the same tag. No action needed.

## Screens walked (for the record)

Home → Tools hub → each of the 12 calc/topic screens (all tabs within each) →
Learn list → lesson detail (Day 1) → Learn search ("jaundice" → correctly
surfaces Day 72 "Neonatal Hyperbilirubinemia and Kernicterus" via the synonym
map in `lessonSearch.ts`) → Progress tab (level, streak, 9 badges). Gamify XP
math verified live: opening EOS (+5 XP tool-usage) reflected immediately in
Progress; all screenshots retained for this session.

---

## UX/QOL + accessibility pass (2026-07-12)

Follow-up scrutiny pass focused on interaction accessibility and day-to-day
usability rather than clinical content (already covered above and in
AUDIT.md). Full lint/typecheck/test(159, up from 155)/build pass, plus a
live Playwright walkthrough (390×844, seeded session to bypass Google/GAS
auth) of Home, Learn (incl. search), Tools hub, and Leaderboard.

**Fixed:**
- **Learn list "done" checkbox was a non-focusable `<span role="checkbox">`
  nested inside the row's own `<button>`** — invalid HTML content model, and
  keyboard-only users could not reach it from the list at all (flagged as a
  known gap in the previous pass, "a deliberate follow-up rather than a
  drive-by change here" — done now). `LearnScreen.tsx` row is now a plain
  container `<div>` with two sibling `<button>`s: one opens the lesson, the
  other is a real, independently focusable toggle button
  (`role="checkbox"`, unique `aria-label` per day). Covered by an updated
  `LearnScreen.test.tsx` that asserts the two buttons are distinct elements.
- **Viewport disabled pinch-to-zoom** (`maximum-scale=1.0, user-scalable=no`
  in `index.html`) — a WCAG 1.4.4 (Resize Text) failure, and actively
  harmful here given the app's dense clinical text and dosing tables. Removed
  both directives; `width=device-width, initial-scale=1.0, viewport-fit=cover`
  remains.
- **No retry path on network failure** — `LessonDetail` and
  `LeaderboardScreen` both showed a terminal error message with no way to
  recover short of leaving and re-entering the screen. Added a "Try again"
  button to both (re-triggers the same fetch via a retry-token state), plus
  a manual refresh (⟳) button in the Leaderboard header for stale-while-open
  data. New tests cover both retry paths.
- **No discoverability path from Home to the other 6 of 12 tools** — Home's
  "Quick Tools" grid only ever shows `CALCS.slice(0, 6)` with no link to the
  rest (unlike the Learn section's "See all lessons →"). Added a matching
  "See all tools →" link wired to a new `onOpenTools` prop
  (`App.tsx` → `switchTab('calc')`, landing on the hub, not a specific calc).
- **Search box had no way to clear a query** except manual backspacing —
  added a "×" clear button inside the input, shown only while a query is
  present.
- **NameBadge save/cancel controls were 24×24px** — below the ~44px touch
  target guideline; bumped to 32×32px (as large as the available header
  space allows without reflowing the layout).

**Noted, not changed (out of scope for this pass):**
- No dark mode / `prefers-color-scheme` support — the "Warm Reading" palette
  is a deliberate design choice (`theme/tokens.ts`); adding a second palette
  is a product decision, not a QOL bug fix.
- During the live walkthrough, the Google Identity Services button (loaded
  from `accounts.google.com`, outside this app's control) attempted to load
  a `data:font/woff2` resource that our CSP's `font-src 'self'` blocked,
  console-logging a CSP violation. Cosmetic only (button still renders,
  Google's iframe has its own CSP/fonts) and not reproducible without live
  Google/GAS network access to confirm in production — flagged for a future
  pass rather than loosening `font-src` speculatively.
- The three AUDIT-flagged clinical-accuracy items (BPD "Grade 3A = death",
  NEC/POCUS "bowel wall >2.6mm", HIE "BE ≥-16") remain unresolved, correctly,
  pending clinician sign-off — untouched by this pass.
