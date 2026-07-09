<!--
This report was written against the original CDN + in-browser-Babel prototype,
which is not included in this repository (it lives in a private monorepo).
File-line links below (e.g. eos.jsx:46) point to that prototype and will not
resolve here — kept for the historical record of what drove this rewrite.
-->

# NeoRef — Scrutiny & Verification Report

**App:** "Newborn · In-Hand Reference" (aka Newborn Level-Up)
**Reviewed:** 2026-07-08 · React 18 (CDN) + in-browser Babel prototype, ~28 `.jsx` files, ~8,400 LOC, localStorage-only, no build step.
**Method:** three independent read-only audits (clinical-content verification, code architecture/correctness, security/privacy/release) + manual spot-verification of every Critical/High finding.

## Product decisions driving remediation

1. **Clinical logic → educational/reference only.** Remove any numeric or textual output that implies a real clinical decision; add persistent "educational — not for clinical use" framing. (The app cannot ship invented risk math that looks authoritative.)
2. **Stack → Vite + React + TypeScript → GitHub Pages PWA.** Real build, real offline, no in-browser Babel, no CDN dev builds.
3. **This pass → audit + foundation first.** This report, plus a production skeleton (build/test/lint/CI/PWA) and one migrated vertical slice proving the pattern. Remaining calculators migrate incrementally.

---

## The single most important finding

**`eos.jsx` invents a sepsis-risk number and then recommends antibiotics.** It prints a `prior /1000` and `post-exam /1000` from fabricated multipliers (`Math.pow(1.35, 40-ga)`, `×2.1` per 0.5 °C, `×30` for "ill" exam) and renders a 4-tier management ladder ending in **"Blood culture · Ampicillin + Gentamicin · NICU admission."** The file header itself admits it is *"NOT the official Kuzniewicz/Puopolo regression."* Its antibiotic threshold (`post ≥ 10/1000`, eos.jsx:46) sits far above the real Kaiser tool's ~3/1000 — i.e. if anyone trusted it, it would *under-treat*. This is the one artifact that is both invented and action-implying. It is the top remediation item.

Reassuringly, it is nearly the *only* dangerous computation. Of the 12 "calculators," **only EOS and Fenton actually compute anything**; the other ten are static reference cards whose displayed drug doses and staging criteria audited as clinically accurate and current. The liability is concentrated, not diffuse.

---

## Clinical-content verification

| File | Computes? | Verdict | Action |
|---|---|---|---|
| **eos.jsx** | Yes | **Fully invented** risk model + antibiotic recommendation | Remove both `/1000` numbers (eos.jsx:145-156) and the entire recommendation ladder (eos.jsx:32-50); keep the inputs as a didactic "what raises/lowers EOS risk" explainer; link to the official Kaiser calculator; add disclaimer. |
| **fenton.jsx** | Yes | **Real chart, approximated data** — hand-approximated gram tables + crude linear interpolation (fenton.jsx:64-77); renders false-precision "P52" | Either load true Fenton 2013 LMS values, or drop the sharp percentile and show only the SGA/AGA/LGA band. Add disclaimer + PediTools link. |
| hie, bpd, nec, pda, rds, ivh, los, rop, seizures, pocus | No | **Static reference, clinically sound** | Keep as-is; add global disclaimer; cite editions. |
| protocols-screen.jsx | No | Accurate but institution-attributed (IP risk, below) | Add disclaimer; fix flags below; see IP section. |

**Accuracy fixes to make regardless of repositioning (clinician to confirm):**
- protocols-screen.jsx:690 — `Glucagon 0.02 mg/kg` is ~10× below typical neonatal hypoglycemia dosing (usually 0.2 mg/kg). Likely a typo.
- nec.jsx:105 & pocus.jsx:46 — "bowel wall > 2.6 mm = NEC concern" oversimplifies; wall *thinning* and absent perfusion are the more ominous sonographic signs.
- bpd.jsx:66 — "Grade 3A = death" mislabels the Jensen 2019 grading (death is a separate outcome, not a grade).
- hie.jsx:140 — "BE ≥ −16" is sloppy notation (base deficit ≥ 16 / BE ≤ −16).

*(These four items are ported verbatim into this repo's `src/features/calc/` with an inline code comment flagging each — see `bpd/BpdScreen.tsx`, `nec/NecScreen.tsx`, `pocus/PocusScreen.tsx`, `hie/HieScreen.tsx`. Not yet clinician-confirmed.)*

---

## Code architecture & correctness

| # | Sev | Finding | Location |
|---|---|---|---|
| C-1 | **Critical** | `today()` hardcodes `new Date('2026-05-19')` → `TODAY_DAY` frozen at 139, outside the 1–20 dataset, so "Today · Day 139" renders over Day 1 content and never advances | learn-screen.jsx:119-125, consumed home-screen.jsx:25 |
| C-2 | **High** | `ProtocolHub` defined twice; which one wins depends on `<script>` load order (silent last-wins) | protocols-screen.jsx:830 vs app-nav.jsx:145 |
| C-3 | **High** | GAS "sync" is push-only — no pull/merge; multi-device progress silently diverges despite the "sync" claim | gas-sync.jsx:20-32 |
| C-4 | **High** | Design-artboard chrome (fake "9:41" status bar, home-indicator, dead "‹ back") rendered *inside* the real app; a hardcoded transparent back-button hitbox assumes fixed coordinates | warm.jsx:43, calc-hub.jsx:107-124 |
| C-5 | Medium | Ten static topic pages are presented as "calculators" (only EOS/Fenton compute) | calc-hub.jsx:5-16 |
| C-6 | Medium | localStorage store has no schema/version/migration; parse errors silently reset to `{}` | gas-sync.jsx:10-12 |
| C-7 | Medium | Bookmark state desyncs between `ProtocolDetail` and `HomeSection` until remount | protocols-screen.jsx:751 |
| D-1 | Medium | ~1,000+ lines of dead/unrendered code shipped: `ios-frame.jsx` (referenced by neither HTML), unrendered `warm.jsx`/`lessons.jsx` artboards, orphaned `lessons-data.json` (365 entries, never fetched — prod hard-codes 20), `CalcSection` | see report |
| A-1..5 | Low | Inline styles + hardcoded color literals (no token system); no types/props contracts; shared UI primitives (`Field`/`pillBtn`) parked in `eos.jsx`; divergent duplicate datasets (`AVERY_LESSONS` vs `AVERY_LESSONS_EXT`, `TODAY`=15 vs `TODAY_DAY`=139) | all files |

**Global-namespace coupling** is the migration's main hazard: many shared symbols (`warmTheme`, `PROTOCOLS`, `AVERY_LESSONS_EXT`, `TODAY_DAY`, `gas-sync` helpers) are bare top-level `const`s shared only because Babel-standalone runs every `<script>` in one global scope. Under ESM these become explicit `import`/`export` — and name collisions (`ProtocolHub`×2, `App`×2) become hard errors that must be resolved on port.

---

## Security, privacy & release

**Good news (brief assumed otherwise):** SRI `integrity` + `crossorigin` **are** present on all CDN scripts; versions **are** pinned; and **no patient-identifiable data is collected or stored** — the "No patient data — calculation-only" claim is verified true (localStorage holds only `nb-lesson-progress` and `nb-bookmarks`; calculator inputs are ephemeral numeric state).

| # | Sev | Finding | Location |
|---|---|---|---|
| S-1 | **High** | `uploads/` bundles ~24 MB of copyrighted, institution-branded guidelines (Ramathibodi/Siriraj CPG PDFs, a 7 MB jaundice e-book, 14 MB PPTX). Publishing to a public GitHub Pages repo = unauthorized redistribution; DOCX/PPTX also carry author metadata | `uploads/` (not part of this repo) |
| S-2 | **High** | `uploads/BPD_Enhanced.html:2442` calls `api.anthropic.com/v1/messages` from the browser and injects the response via `innerHTML` (:2459) — unauthenticated external call into an unsanitized HTML sink (no key embedded, so it currently just fails) | uploads/ (not part of this repo) |
| S-3 | **High** | React/ReactDOM shipped as `*.development.js` **dev** builds; `@babel/standalone` (~2.8 MB) ships a compiler to end users to transpile JSX on every load | index.html:42-44 |
| S-4 | Medium | "Fully offline" is false — hard CDN dependency (unpkg + Google Fonts), no service worker, no manifest. First load with no signal = blank screen; Google Fonts also leaks IP (PDPA) | index.html:11-44 |
| S-5 | Medium | GAS POST is fire-and-forget: no auth, no consent, errors swallowed (`.catch(()=>{})`). Dormant (`GAS_URL=''`) but latent PDPA issue once enabled | gas-sync.jsx:26-31 |

**The main React app itself is XSS-clean** — no `dangerouslySetInnerHTML`/`innerHTML`/`eval` anywhere in the `.jsx`. The injection risk lived entirely in the standalone `uploads/*.html` lecture files, which are not part of this repository.

### Release-readiness checklist (before any public deploy)
- [x] Vite production build; ship React **prod** builds; drop Babel-standalone → fixes S-3, S-4, and the perf story in one move.
- [x] Self-host fonts; remove Google Fonts CDN (perf + PDPA).
- [x] `vite-plugin-pwa` service worker + web manifest so "offline" is real.
- [x] `.gitignore` the `uploads/` folder; do not commit copyrighted material to a public repo — and this standalone repo never contained `uploads/` at all (it was outside the extracted `neoref-app/` subtree).
- [ ] Exclude/delete design-only modules (`design-canvas.jsx`, `tweaks-panel.jsx`, `dark.jsx`, `ios-frame.jsx`, `Newborn Level-Up.html`) — these were never ported into this rewrite in the first place.
- [x] CSP `<meta>` (GH Pages can't set headers) restricting `script-src`/`connect-src`/`font-src` to `'self'`.
- [x] Keep the "No patient data" disclaimer visible in the shipped UI.
- [x] Add `LICENSE` (code, MIT) + a content-licensing note (see README).
- [ ] Before enabling `GAS_URL`: add consent, authenticate, stop swallowing errors. (GAS sync was not ported into this rewrite; N/A unless added later.)

---

## Remediation plan (mapped to decisions)

**Foundation pass:** Vite + React + TS scaffold with ESLint/Prettier, Vitest, `vite-plugin-pwa`, error boundary, GitHub Actions CI + Pages deploy, self-hosted fonts, CSP. Migrated design tokens, app shell + nav, home, and **EOS repositioned as educational** — with unit tests, proving the port pattern.

**Incremental pass (2026-07-09):** ported the remaining 11 calculators/topic pages to TS modules via a shared `TopicHelpers.tsx` module; added the disclaimer to every calc screen; **Fenton** repositioned to drop its false-precision interpolated percentile in favor of an SGA/AGA/LGA band + official PediTools link. The four clinical-accuracy items above remain unresolved pending clinician confirmation. `lessons-data.json` reconciliation and `protocols-screen.jsx` were out of scope for this pass and were not ported.
