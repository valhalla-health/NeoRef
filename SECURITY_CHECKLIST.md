# Frontend Logic-Leak Checklist (NeoRef)

Run this before every deploy. It's derived from a 3-round audit of this
repo (source → build output → API contract) done 2026-07-16. Findings below
are either fixed, or documented as accepted/inherent to the architecture —
re-check the "still true?" column each time you run this.

**Governing rule:** a real secret (algorithm, credential, patient data) must
never be *sent to* the browser in the first place. Minifying, obfuscating,
or hiding it in the UI after the fact does not satisfy this — assume every
byte shipped to `dist/` is public.

---

## Round 1 — Source audit (`src/`)

- [ ] `grep -rniE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{8,}" src` → only test fixtures (`test-token`, `stale-tok`) should match. Anything else is a hardcoded credential.
- [ ] `grep -rniE "AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}" src public index.html` → must be empty (AWS/Google/OpenAI/GitHub token shapes).
- [ ] All backend-facing config goes through `import.meta.env.VITE_*`, sourced from `.env.local` (gitignored) — never a literal URL/ID in a `.ts` file. Currently: `VITE_GAS_URL`, `VITE_GOOGLE_CLIENT_ID` (`src/features/auth/authApi.ts`, `gamifyApi.ts`, `googleIdentity.ts`).
- [ ] No calculator screen under `src/features/calc/**` computes a numeric risk score, probability, or management recommendation from a formula that isn't a published, citable clinical tool. (History: the pre-rewrite prototype's `eos.jsx` invented a sepsis-risk number and an antibiotic ladder — see `AUDIT.md`. Current `eos-content.ts`/`fenton-content.ts` intentionally return only qualitative direction/magnitude, never a number.) If a new calculator is added, it must either link out to the official tool or ship the real published formula with a citation — never an approximation presented as precise.
- [ ] Client-side gamification (`src/lib/gamify.ts` — XP/levels/badges) stays a **pure, local, non-competitive** display derived only from the user's own localStorage. It must never be the source of truth for anything shown to other users. Anything comparative/shared (leaderboard) must come from the server (`gamifyApi.getLeaderboard`), never be computed client-side from data the client could edit.
- [ ] `Session.role` (`src/lib/session.ts`) is stored but must stay **non-authoritative** — do not add `if (user.role === 'admin')` UI gating without a matching server-side check on every GAS action that role would unlock. A client-only role check is cosmetic, not access control.
- [ ] No `dangerouslySetInnerHTML`, `innerHTML =`, or `eval(` in `src/` (`grep -rn "dangerouslySetInnerHTML\|innerHTML\s*=\|eval(" src`).

## Round 2 — Build output audit (`dist/`)

1. `npm run build`
2. Re-run the same greps from Round 1 against `dist/assets/*.js` (minified code still contains string literals in full):
   ```
   grep -oiE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{8,}" dist/assets/*.js
   grep -oiE "AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}" dist/assets/*.js
   ```
- [ ] Confirm whatever `VITE_GAS_URL` / `VITE_GOOGLE_CLIENT_ID` got baked in (`grep -o "https://script.google.com[^\"']*" dist/assets/*.js`, `grep -o "[a-zA-Z0-9_-]*\.apps\.googleusercontent\.com" dist/assets/*.js`) are the **intended production values**, not a leftover dev/staging endpoint or a different project's client ID.
- [ ] No `.map` files in `dist/` unless you specifically intend to publish source maps (`ls dist/assets/*.map` should be empty for a public deploy — a source map re-exposes original file paths/comments/logic that minification hid).
- [ ] `dist/` isn't committed to git (`.gitignore` has `dist/`) and CI builds fresh each deploy — no stale build artifact from a branch with different secrets can leak forward.
- [ ] No leftover string fragments from a removed feature (e.g. an old invented-formula constant, a debug flag, a staging hostname) — diff the grep hits above against the previous release's `dist/` if something looks new/unexplained.

## Round 3 — API response audit (GAS backend contract)

The backend here is an external Google Apps Script deployment (not in this
repo), called directly from the browser (`authApi.ts`, `gamifyApi.ts`). Do
this with real devtools Network tab output, since this repo can't see the
live backend:

- [ ] Open Network tab, trigger login / `getMyStats` / `getLeaderboard` / `getMyCompletions`, and diff the actual JSON keys against the TS response interfaces in `authApi.ts` / `gamifyApi.ts` (`LoginOkResponse`, `StatsResponse`, `LeaderboardRow`, `CompletionsResponse`). Any key present in the response but absent from the interface **and** unused in the rendering component is over-fetched — ask the backend owner why it's being sent at all (don't just stop reading it client-side; if it's genuinely unneeded, remove it server-side).
- [ ] Specifically check `getLeaderboard`: it necessarily returns every ranked user's `name`/`points`/`streak` to every other signed-in user by design (that's the feature) — confirm it does **not** also return `email` or any other per-user field beyond what's rendered in `LeaderboardScreen.tsx` (currently: rank, name, streak, points).
- [ ] Confirm the login response's `token` is a short-lived/opaque session token, not something that embeds decodable PII or a long-lived credential (it's stored in localStorage via `session.ts`, readable by any script that gets XSS — treat it like a bearer token, not a secret vault).
- [ ] Confirm write actions (`logLessonDone`, `updateName`, `changePassword`) are re-validated server-side (day range, ownership, password rules) — the client sending `{ day, done }` must not be trusted as-is; a malicious client could POST arbitrary `day`/`done` values directly to the GAS URL (it's a public endpoint, see below).
- [ ] `VITE_GAS_URL` is a public Google Apps Script web app URL, callable directly by anyone with a request forger — not just this frontend. Confirm the backend authenticates every action by `token` (except `login`) rather than trusting request origin or CORS, since this fetch pattern (`text/plain` body, no preflight) doesn't provide any origin protection.

## Round 4 — Re-run cadence

- [ ] Run Rounds 1–3 on every PR that touches `src/features/auth/**`, `src/features/gamify/**`, `src/features/calc/**`, or adds a new `VITE_*` env var.
- [ ] Update this file when a new pattern is found — this checklist is a living artifact, not a one-time report.

---

## Known-accepted items (don't re-flag without new evidence)

- `VITE_GOOGLE_CLIENT_ID` and `VITE_GAS_URL` appearing in `dist/` is **expected**: both must be known to the browser for the app to function (OAuth client ID and a fetch target are not secrets in the traditional sense — the security boundary is server-side token validation, not endpoint secrecy).
- `public/lessons/*.json` ships full Avery/textbook-derived lesson content to the browser by design (it's the product) — the IP/copyright angle on that content is tracked separately in `AUDIT.md` (S-1), not a "logic leak."
- CSP in `index.html` already restricts `script-src`/`connect-src` to `'self'` + the two required Google origins — don't loosen it without updating this checklist.
