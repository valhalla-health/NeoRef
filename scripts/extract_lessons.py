#!/usr/bin/env python3
"""Converts the "Daily Neonatology Lessons" .docx series into per-lesson JSON
for the NeoRef Learn tab. Reads from a source directory (not part of this
repo), writes one JSON file per lesson into public/lessons/, plus an index
(lessons-index.json) with day/chapter/title/authors metadata for all lessons.

Before adding or re-extracting lessons, see LESSON_CHECKLIST.md in this
directory — it covers what the app's renderer already fixes automatically
(dense-text bulleting, a couple of table extraction quirks) and what's still
worth checking by hand.

Usage: python scripts/extract_lessons.py <source_dir> <content_out_dir> <index_out_path>
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import docx
from docx.oxml.ns import qn

from lesson_keywords import candidate_counts, top_keywords

# Source files are named per book and chapter ("Avery Ch01 - Title.docx"), each
# book's chapters living flat in the source dir. Older Day-numbered filenames
# ("Day 01 - Avery Ch01 Title.docx") were retired in Sep 2026 when the series
# was renumbered by chapter; any left in the source dir are superseded copies
# and are deliberately not matched here (they show up in the skipped list).
FILENAME_RE = re.compile(
    r"^(Avery|Fanaroff|Newborn Lung)\s+Ch0*(\d+)\s*[-–]\s*(.+)$"
)

BOOK_KEY = {"Avery": "Avery", "Fanaroff": "Fanaroff", "Newborn Lung": "NewbornLung"}

# The app lays the three series end to end on one curriculum day counter, so a
# book's chapter number is offset by however many days the books before it
# occupy: Avery Ch1-97 -> Days 1-97, Fanaroff Ch1-103 -> Days 98-200, The
# Newborn Lung Ch1-22 -> Days 201-222. (Pimolrat Ch1-24 -> Days 223-246 is
# appended afterwards by extract_pimolrat.py.) Keep these offsets stable —
# readers' progress and bookmarks are stored by day number.
BOOK_DAY_OFFSET = {"Avery": 0, "Fanaroff": 97, "NewbornLung": 200}


def parse_filename(stem):
    m = FILENAME_RE.match(stem)
    if m is None:
        return None
    book_name, chapter, title = m.groups()
    book = BOOK_KEY[book_name]
    chapter = int(chapter)
    return {
        "day": BOOK_DAY_OFFSET[book] + chapter,
        "book": book,
        "chapter": chapter,
        "titleFromFilename": title.strip(),
    }


def cell_text(cell):
    return "\n".join(p.text.strip() for p in cell.paragraphs if p.text.strip())


def row_cells_deduped(row):
    """python-docx represents a horizontally-merged cell by repeating the same
    underlying _Cell object once per grid column it spans, so a naive
    `[cell_text(c) for c in row.cells]` turns one merged caption into the same
    paragraph duplicated across every column (seen in the wild: an "AAP 2010
    Policy" note meant to span a 4-column table, rendered 4 times side by
    side). Collapse consecutive cells that are the *same* underlying XML
    element — true merges only, not coincidentally-identical text in separate
    cells — into a single value."""
    cells = []
    prev_tc = None
    for c in row.cells:
        if c._tc is prev_tc:
            continue
        cells.append(cell_text(c))
        prev_tc = c._tc
    return cells


def extract_body(doc):
    """Walks the document body in true order, splitting into a title block
    (everything before the first Heading 1) and a list of content blocks."""
    body = doc.element.body
    paragraphs_by_id = {id(p._p): p for p in doc.paragraphs}
    tables_by_id = {id(t._tbl): t for t in doc.tables}

    title_lines = []
    blocks = []
    seen_first_heading = False

    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            p = paragraphs_by_id.get(id(child))
            if p is None:
                continue
            text = p.text.strip()
            style = p.style.name if p.style else "Normal"
            if not text:
                continue
            if style == "Heading 1":
                seen_first_heading = True
                blocks.append({"type": "h1", "text": text})
            elif style == "Heading 2":
                seen_first_heading = True
                blocks.append({"type": "h2", "text": text})
            elif not seen_first_heading:
                title_lines.append(text)
            elif style == "List Paragraph":
                blocks.append({"type": "li", "text": text})
            else:
                blocks.append({"type": "p", "text": text})
        elif child.tag == qn("w:tbl"):
            t = tables_by_id.get(id(child))
            if t is None:
                continue
            rows = [row_cells_deduped(row) for row in t.rows]
            rows = [r for r in rows if any(c for c in r)]
            if not rows:
                continue
            if len(rows) == 1 and len(rows[0]) == 1:
                blocks.append({"type": "callout", "text": rows[0][0]})
            else:
                blocks.append({"type": "table", "rows": rows})

    return title_lines, blocks


def main():
    src_dir = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    index_out_path = Path(sys.argv[3])
    out_dir.mkdir(parents=True, exist_ok=True)

    index = []
    skipped = []

    # Top level only: the source dir also holds archive/superseded subfolders
    # ("Avery Lessons", "_archive (old Day-numbered)", ...) whose contents must
    # not be picked up.
    docx_paths = sorted(src_dir.glob("*.docx"))

    for path in docx_paths:
        if path.name.startswith("~$"):
            continue
        meta = parse_filename(path.stem)
        if meta is None:
            skipped.append(path.name)
            continue

        doc = docx.Document(str(path))
        title_lines, blocks = extract_body(doc)

        # title_lines pattern (consistent across the series): [0]="AVERY · CH 01",
        # [1]="Avery's Diseases of the Newborn, 11th ed. · Chapter 1",
        # [2]=chapter title, [3]=byline, sometimes suffixed with "— Avery 11th ed. 2024".
        authors = ""
        if len(title_lines) > 3:
            authors = title_lines[3].split("—")[0].strip()

        # Prefer the title the document itself carries over the one in its
        # filename: a Windows filename cannot contain a colon, so 15 of the
        # source files shorten the book's real title ("Patent Ductus Arteriosus
        # and the Lung" for "...: Acute Effects and Long-Term Consequences",
        # "Hyperbilirubinemia" for "Neonatal Hyperbilirubinemia and
        # Kernicterus"). Fall back to the filename if a document ever arrives
        # without its title block.
        in_doc_title = title_lines[2].strip() if len(title_lines) > 2 else ""
        title = in_doc_title or meta["titleFromFilename"]

        lesson = {
            "day": meta["day"],
            "book": meta["book"],
            "chapter": meta["chapter"],
            "title": title,
            "authors": authors,
            "blocks": blocks,
        }

        out_path = out_dir / f"day-{meta['day']:03d}.json"
        out_path.write_text(json.dumps(lesson, ensure_ascii=False), encoding="utf-8")

        index.append(
            {
                "day": meta["day"],
                "book": meta["book"],
                "chapter": meta["chapter"],
                "title": title,
                "authors": authors,
                "_blocks": blocks,  # used below to derive keywords, stripped before writing
            }
        )

    # Keywords are scored by tf-idf across the whole corpus (see
    # lesson_keywords.py) so each lesson surfaces terms distinctive to it
    # rather than boilerplate shared by every lesson (PEARL, NEJM, RCT...).
    per_lesson_counts = {l["day"]: candidate_counts(l["_blocks"]) for l in index}
    doc_freq: Counter = Counter()
    for counts in per_lesson_counts.values():
        for term in counts:
            doc_freq[term] += 1
    n_docs = len(index)
    for l in index:
        l["keywords"] = top_keywords(per_lesson_counts[l["day"]], l["title"], doc_freq, n_docs)
        del l["_blocks"]

    index.sort(key=lambda l: l["day"])
    index_out_path.write_text(
        json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(f"Converted {len(index)} lessons, skipped {len(skipped)}: {skipped}")


if __name__ == "__main__":
    main()
