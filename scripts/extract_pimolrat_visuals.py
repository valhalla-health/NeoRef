#!/usr/bin/env python3
"""Extracts every table and figure from the Pimolrat PDF (using PyMuPDF's
native table detection and image extraction, bypassing the linearized-text
extraction that flattened them into prose in the first pass), then splices
them into the already-generated day-223..246.json lessons in place of the
garbled paragraph(s) that resulted from that flattening.

Tables are matched to a garbled paragraph by token-overlap against the raw
PDF page text (tables are very lexically distinctive - drug names, specific
numbers, header words - so this is reliable even though the lesson's prose
went through a manual typo-fix pass the raw PDF text didn't).

Usage: python scripts/extract_pimolrat_visuals.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent / "Daily Neonatology Lessons" / "Pimolrat textbook" / "scripts"))
import fitz
from clean_lib import clean_text

BASE = Path(r"C:\Users\USER\OneDrive\Desktop\PraewPP\Daily Neonatology Lessons\Pimolrat textbook")
PDF_PATH = BASE / "Pimolrat thaithumyanon newborn.pdf"
NEOREF = Path(r"C:\Users\USER\OneDrive\Desktop\PraewPP\Web App Projects\NeoRef\neoref-app")
LESSONS_DIR = NEOREF / "public" / "lessons"
IMAGES_DIR = LESSONS_DIR / "images"

CHAPTER_STARTS = [8, 21, 31, 46, 64, 81, 91, 102, 122, 133, 141, 160, 173,
                  184, 194, 202, 204, 213, 217, 224, 242, 257, 267, 276]

# Manually verified by rendering candidate pages: vector-drawn flowcharts with
# no embedded raster image, captured by rasterizing the whole page.
DIAGRAM_PAGES = {
    5: [70],       # GBS/IAP algorithm (CDC)
    6: [87, 89],   # EOS: asymptomatic-with-risk algorithm, symptomatic/sepsis algorithm
}
# Pages with genuine embedded raster images (bilirubin nomograms, aEEG figures).
EMBEDDED_IMAGE_PAGES = {
    8: [111, 113],
    21: [253, 254],
}

# The GBS/IAP flowchart's flattened transcription (ch5 p70) has no distinct
# caption sentence like the ch6/ch8/ch21 figures do - it's just the
# flowchart's own box text run together, so generic token-overlap matching
# picked an unrelated nearby paragraph (about Listeria, the next topic) as
# the "closest" match. Verified by inspection: these blocks ARE that
# transcription and should be replaced by the actual image instead of left
# sitting next to it doing double duty.
MANUAL_DIAGRAM_REPLACE = {
    5: ["มารดาได้ IAP สำหรับ GBS", "สำหรับทารกที่มารดาได้รับ IAP", "แนวทางที่ CDC"],
}

TOKEN_RE = re.compile(r"[A-Za-z0-9ก-๙]{3,}")


def tokens(text):
    return set(t.lower() for t in TOKEN_RE.findall(text))


LEADING_MARK_RE = re.compile(r"^[ัิ-ฺ็-๎]+\s*")


def clean_cell(text):
    if text is None:
        return ""
    text = re.sub(r"\s+", " ", clean_text(text)).strip()
    # A clipped cell can start mid-glyph, leaving an orphaned Thai combining
    # mark (vowel/tone sign) with no base consonant before it - drop it.
    return LEADING_MARK_RE.sub("", text)


def chapter_page_range(chapter):
    start = CHAPTER_STARTS[chapter - 1]
    end = CHAPTER_STARTS[chapter] - 1 if chapter < 24 else 283
    return start, end


def extract_table_rows(page, tbl):
    """tbl.extract() re-sorts cell text by bounding box in a way that
    scrambles Thai combining-vowel order (e.g. "น้ำหนัก" -> "น้ำ หัน ัก").
    Re-extracting each cell via page.get_text(clip=bbox) instead reuses the
    same text-extraction path build_chapters.py's prose relies on, which
    preserves correct glyph order."""
    rows = []
    for row in tbl.rows:
        cells = []
        for bbox in row.cells:
            cells.append(clean_cell(page.get_text("text", clip=bbox)) if bbox else "")
        rows.append(cells)
    return rows


def extract_tables_for_chapter(pdf, chapter):
    start, end = chapter_page_range(chapter)
    results = []  # list of {page, rows, page_tokens}
    for pno in range(start, end + 1):
        page = pdf[pno]
        found = page.find_tables()
        if not found.tables:
            continue
        page_text_tokens = tokens(clean_text(page.get_text()))
        for tbl in found.tables:
            rows = extract_table_rows(page, tbl)
            rows = [r for r in rows if any(c for c in r)]
            if not rows:
                continue
            results.append({"page": pno, "rows": rows, "page_tokens": page_text_tokens})
    return results


def extract_diagrams_for_chapter(pdf, chapter, day):
    images = []  # list of {page, rel, page_tokens}
    fig_n = 0
    for pno in DIAGRAM_PAGES.get(chapter, []):
        fig_n += 1
        rel = f"images/day-{day:03d}-fig-{fig_n}.png"
        pix = pdf[pno].get_pixmap(matrix=fitz.Matrix(2, 2))
        pix.save(str(NEOREF / "public" / "lessons" / rel))
        images.append({"page": pno, "rel": rel, "page_tokens": tokens(clean_text(pdf[pno].get_text()))})
    for pno in EMBEDDED_IMAGE_PAGES.get(chapter, []):
        page_tokens = tokens(clean_text(pdf[pno].get_text()))
        for im in pdf[pno].get_images(full=True):
            fig_n += 1
            xref = im[0]
            base = pdf.extract_image(xref)
            rel = f"images/day-{day:03d}-fig-{fig_n}.{base['ext']}"
            (NEOREF / "public" / "lessons" / rel).write_bytes(base["image"])
            images.append({"page": pno, "rel": rel, "page_tokens": page_tokens})
    return images


def find_best_block(blocks, page_tokens, used_indices, types=("p",)):
    best_idx, best_score = None, 0.0
    for i, b in enumerate(blocks):
        if i in used_indices or b["type"] not in types:
            continue
        bt = tokens(b.get("text", ""))
        if not bt:
            continue
        overlap = len(bt & page_tokens) / max(1, len(page_tokens))
        if overlap > best_score:
            best_score, best_idx = overlap, i
    return best_idx, best_score


def main():
    pdf = fitz.open(str(PDF_PATH))
    report = []

    for chapter in range(1, 25):
        day = 222 + chapter
        lesson_path = LESSONS_DIR / f"day-{day:03d}.json"
        lesson = json.loads(lesson_path.read_text(encoding="utf-8"))
        blocks = lesson["blocks"]

        tables = extract_tables_for_chapter(pdf, chapter)
        diagrams = extract_diagrams_for_chapter(pdf, chapter, day)

        # Tables usually flattened into one wholly-garbled paragraph with no
        # standalone prose value - REPLACE that paragraph outright. When no
        # such blob is found (score < 0.15), the table's data more likely
        # already has a home in legitimate prose/bullets nearby (e.g. a
        # comparison table whose rows are each already a bullet point) - in
        # that case INSERT the table after the closest-matching block
        # instead of risking deletion of real content on a weak match.
        used = set()
        replacements = {}  # block_index -> list of table blocks (replaces it)
        insertions = {}  # block_index -> list of blocks (inserted after it)
        for t in tables:
            idx, score = find_best_block(blocks, t["page_tokens"], used, types=("p",))
            if idx is not None and score >= 0.15:
                used.add(idx)
                replacements.setdefault(idx, []).append({"type": "table", "rows": t["rows"]})
                continue
            idx2, score2 = find_best_block(blocks, t["page_tokens"], set(), types=("p", "li"))
            if idx2 is not None and score2 >= 0.03:
                insertions.setdefault(idx2, []).append({"type": "table", "rows": t["rows"]})
                report.append(f"day {day} ch{chapter}: table on page {t['page']} inserted (not replaced) after block {idx2}, score {score2:.2f}")
            else:
                report.append(f"day {day} ch{chapter}: UNMATCHED table on page {t['page']} (best scores {score:.2f}/{score2:.2f})")

        # Images are INSERTED AFTER the paragraph/bullet that references them
        # (e.g. "...ดังในรูปที่ 1") - that text is legitimate prose, not a
        # flattened table, so it's kept and the figure is added alongside it.
        manual_drops = MANUAL_DIAGRAM_REPLACE.get(chapter)
        if manual_drops:
            drop_idx = [i for i, b in enumerate(blocks) if any(s in b.get("text", "") for s in manual_drops)]
            for i in drop_idx:
                replacements[i] = [] if i != drop_idx[0] else [{"type": "image", "src": diagrams[0]["rel"]}]
            report.append(f"day {day} ch{chapter}: manual override - replaced {len(drop_idx)} flowchart-transcription blocks with figure")
        else:
            for img in diagrams:
                idx, score = find_best_block(blocks, img["page_tokens"], set(), types=("p", "li"))
                if idx is None or score < 0.1:
                    report.append(f"day {day} ch{chapter}: UNMATCHED figure from page {img['page']} (best score {score:.2f}) - appended at end")
                    idx = len(blocks) - 1
                insertions.setdefault(idx, []).append({"type": "image", "src": img["rel"]})

        new_blocks = []
        for i, b in enumerate(blocks):
            if i in replacements:
                new_blocks.extend(replacements[i])
            else:
                new_blocks.append(b)
            if i in insertions:
                new_blocks.extend(insertions[i])
        blocks = new_blocks

        lesson["blocks"] = blocks
        lesson_path.write_text(json.dumps(lesson, ensure_ascii=False), encoding="utf-8")
        if tables or diagrams:
            report.append(f"day {day} ch{chapter}: {len(tables)} tables found, {len(replacements)} spliced, {len(diagrams)} images attached")

    print("\n".join(report))


if __name__ == "__main__":
    main()
