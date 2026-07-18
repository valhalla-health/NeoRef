# Lesson content checklist

Read this before adding, editing, or re-extracting any `public/lessons/day-*.json`
file. It exists because a first pass at "make the callouts readable" (see git
history on `LessonDetail.tsx`) only caught blocks that used an explicit
`(1) ... (2) ... (3) ...` numbering — a second pass found that most dense text
in the lesson corpus doesn't use that pattern at all, and needed a broader fix.
The rules below are what the renderer now does automatically, and what's still
worth checking by hand.

## What the renderer already fixes for you

`src/lib/lessonFormatting.ts` (used by `LessonDetail.tsx`, unit-tested in
`lessonFormatting.test.ts`, and checked against the whole corpus in
`src/data/lessonContentRules.test.ts`) auto-splits dense text into bullets, in
this priority order:

1. **Explicit numbering** — `"(1) foo; (2) bar; (3) baz"` → one line per item.
2. **Semicolon clauses** — `"foo; Bar; Baz"` (semicolon + letter, not a
   citation like `"Pediatrics 2010;126:585"`) → one line per clause.
3. **Sentence boundaries** — `"Foo. Bar. Baz."` (guards decimals like `0.5 mL`
   and `et al.` citations) → one line per sentence.
4. **Em dashes** — `"Foo — Bar"` → one line per clause.

It also normalizes two table shapes so they render as proper cards instead of
a one-column table where only the first row looked styled:

- A **2-row, single-column table** (title + body) → rendered exactly like a
  `callout` block.
- A **run of 3+ single-column rows, each containing a real line break**
  (e.g. "5 Bedside Pearls", each row `"PEARL 1 — ...\nBody text"`) → each row
  rendered as its own callout card.

And it catches one known extraction bug: a **caption duplicated across every
column of a table's first row** (a python-docx artifact from a merged cell —
see `row_cells_deduped` in `extract_lessons.py`) is shown once as a banner
above the table instead of N times side by side.

**None of this requires you to reformat existing content.** If a new lesson's
prose is written the same way the rest of the corpus is (semicolon/period/dash
-separated clauses, no unusual punctuation), it will already render as
bullets. You don't need to manually add `(1)(2)(3)` markers.

## Before committing new/changed lesson JSON

1. Run `npm test`. `src/data/lessonContentRules.test.ts` reads every file in
   `public/lessons/` and will fail if:
   - a single-column table doesn't match either shape above (extend
     `classifySingleColumnTable` in `lessonFormatting.ts` if you're
     intentionally introducing a new shape, don't just ignore the failure), or
   - any block throws while being split (a malformed/pathological string).
   It also prints a coverage line — `dense blocks: N, auto-split: M (X%)` —
   so you can see at a glance whether the new content is behaving like the
   rest of the corpus (currently ~90%). A sudden drop for a new lesson usually
   means it's written with a delimiter style the four tiers above don't
   recognize (e.g. bullet characters baked into the text itself, or a
   language/script mix the regexes don't cover) — open the rendered lesson and
   look at what's left as one paragraph before deciding whether to add a
   fifth tier or leave it (short single-clause citations are expected to stay
   as one line — that's fine).
2. If you regenerate JSON via `scripts/extract_lessons.py` from updated source
   `.docx` files, skim any table with a caption/note row spanning multiple
   columns in Word — confirm it came out as one banner, not duplicated text.
3. Actually open the lesson in the app (`npm run dev`) and scroll through it
   once. The automated checks catch structural regressions, not "does this
   read well" — that's still a human judgment call, especially for content
   the four splitting tiers correctly leave alone (short prose, single
   citations) but that might still be awkward for other reasons (e.g. a
   genuinely too-long single sentence with no natural break point at all).

## Authoring tips for new source `.docx` files

- Don't manually add `(1)(2)(3)` numbering to make lists "render as bullets" —
  it's unnecessary now and adds visual noise if the content is also fine as
  plain semicolon/period-separated prose.
- If a table needs a caption spanning its full width (a note above column
  headers), either merge the cells across the header row in Word (now handled
  correctly by the extractor), or put the note in its own paragraph/callout
  immediately before the table instead of inside it.
- "N Pearls"-style recap sections read best as a single-column table with N
  rows, each row's text as `"PEARL k — Title\nBody text."` — that's the shape
  `classifySingleColumnTable` recognizes and turns into N callout cards.
