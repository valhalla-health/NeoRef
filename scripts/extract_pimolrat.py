#!/usr/bin/env python3
"""Converts the Pimolrat textbook's per-chapter Markdown files (already
proofread source text, see "Daily Neonatology Lessons/Pimolrat textbook/
Chapters (Markdown)") into the same per-lesson JSON schema used by
scripts/extract_lessons.py, and appends them to lessons-index.json.

Unlike extract_lessons.py's source (skill-authored lesson docx with clean
heading styles), these chapters were extracted from a scanned PDF by a
separate script (build_chapters.py) whose heading-detection heuristic
mis-tags numbered/lettered clinical enumerations (e.g. "2. PROM > 18 ชม.",
"ก. Leukocytosis...") as document headings. This script re-derives sensible
structure instead of trusting the markdown heading level literally:

- Uppercase Roman numerals (I., II., III.) are genuine chapter sections -> kept as headings.
- Arabic-digit / Thai-letter markers (1., 2., ก., ข.) are enumerated list items
  even when heading-tagged in the source -> demoted to bullet ('li') blocks.
- The same enumeration markers found in *plain* paragraphs (incl. lowercase
  roman numerals i., ii., iii., which the source never heading-tags) are also
  promoted to bullet blocks, so a run of clinical criteria reads as a list.
- Two headings occasionally get merged onto one line where the source PDF had
  no blank line between an outline entry and the section it introduces; these
  are split back into separate blocks.

Not one word of the source text is altered - only block classification and
whitespace are.

Usage: python scripts/extract_pimolrat.py <chapters_md_dir> <content_out_dir> <index_path>
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

AUTHOR = "ศ.กิตติคุณ พญ.พิมลรัตน์ ไทยธรรมยานนท์"
BOOK = "Pimolrat"
DAY_OFFSET = 222  # chapter N -> day 222+N (continues after Newborn Lung's day 222)

TITLE_RE = re.compile(r"^#\s*บทที่\s*(\d+)\s*(.+?)\s*$")
SUBTITLE_RE = re.compile(r"^#{2,3}\s*\((.+)\)\s*$")

UPPER_ROMAN_HEAD = re.compile(r"^[IVXLCDM]+\.\s+\S")
ENUM_ANY = re.compile(r"^(?:[IVXLCDMivxlcdm]+\.|[ก-ฮ]\.|\d+\.)\s+\S")
# Used only to find split points between two headings merged onto one line
# (a missing blank line in the source PDF between an outline entry and the
# section it introduces) - deliberately broader than ENUM_ANY so it also
# catches multi-level decimal headings like "1.2" / "1.2.3" (which are real
# subsection numbers, not list enumerations, and must stay headings after
# the split - see classify_heading).
ENUM_MARKER = re.compile(r"(?:[IVXLCDM]+\.|[ก-ฮ]\.|\d+\.\d+(?:\.\d+)*|\d+\.)\s+\S")


def normalize(s):
    s = unicodedata.normalize("NFKC", s)
    return re.sub(r"[\s().]+", "", s)


def clean_ws(s):
    s = s.replace("\t", " ")
    s = re.sub(r" {2,}", " ", s)
    return s.strip()


def split_embedded_headings(text):
    """Split a heading line that accidentally merged two headings (missing
    blank line in the source PDF between an outline entry and the section
    it introduces) back into separate fragments."""
    matches = list(ENUM_MARKER.finditer(text))
    if len(matches) <= 1:
        return [text]
    positions = [m.start() for m in matches]
    if positions[0] != 0:
        return [text]
    parts = []
    for i, pos in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        frag = text[pos:end].strip()
        if frag:
            parts.append(frag)
    return parts or [text]


def classify_heading(level_hint, text):
    """level_hint: 'h1' for '##', 'h2' for '###'/'####'. Returns (type, text)."""
    if UPPER_ROMAN_HEAD.match(text):
        return level_hint, text
    if ENUM_ANY.match(text):
        return "li", text
    return level_hint, text


REF_LABEL_RE = re.compile(r"(เอกสารอ้างอิง(?:\s*\(References\))?|References)\b")


def split_references_inline(text):
    """If a References heading is merged mid-paragraph (no leading '##' tag
    in the source), split off (prefix, label, remainder-with-citations).
    Returns None if the heading isn't present or already starts the text
    (that case is handled by the normal heading path)."""
    m = REF_LABEL_RE.search(text)
    if not m or m.start() == 0:
        return None
    return text[: m.start()].strip(), m.group(1), text[m.end() :].strip()


def split_numbered_entries(blob):
    """Split a run-on '1. ... 2. ... 3. ...' citation blob back into
    individual entries, same approach as build_chapters.py's
    rebuild_references(): only split at markers that continue the sequence,
    so citation text containing unrelated numbers isn't cut mid-sentence."""
    positions = []
    expected = 1
    for m in re.finditer(r"(\d{1,3})\.\s", blob):
        if int(m.group(1)) == expected:
            positions.append(m.start())
            expected += 1
    if not positions:
        return [blob] if blob else []
    entries = []
    for i, pos in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(blob)
        entry = blob[pos:end].strip()
        if entry:
            entries.append(entry)
    return entries


def parse_chapter(md_path):
    lines = md_path.read_text(encoding="utf-8").splitlines()
    chapter, thai_title, english_title = None, None, None
    body_start = 0
    for i, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            continue
        if chapter is None:
            m = TITLE_RE.match(line)
            if m:
                chapter = int(m.group(1))
                thai_title = m.group(2)
                continue
        elif english_title is None:
            m = SUBTITLE_RE.match(line)
            if m:
                english_title = m.group(1)
                body_start = i + 1
                continue
            body_start = i
            break
    if chapter is None or thai_title is None:
        raise ValueError(f"Could not find chapter title in {md_path.name}")
    if english_title is None:
        english_title = ""

    title = f"{thai_title} ({english_title})" if english_title else thai_title

    # Merge into paragraphs the same way the source separates them: blank
    # line = paragraph break. Heading markers ('#'..'####') start their own
    # paragraph immediately.
    raw_paragraphs = []
    heading_flags = []
    cur = []
    for raw in lines[body_start:]:
        s = raw.strip()
        if not s:
            if cur:
                raw_paragraphs.append(" ".join(cur))
                heading_flags.append(cur_is_heading)
                cur = []
            continue
        head_m = re.match(r"^(#{2,4})\s*(.+)$", s)
        if head_m:
            if cur:
                raw_paragraphs.append(" ".join(cur))
                heading_flags.append(cur_is_heading)
                cur = []
            level = len(head_m.group(1))
            cur = [head_m.group(2)]
            cur_is_heading = "h1" if level == 2 else "h2"
            raw_paragraphs.append(" ".join(cur))
            heading_flags.append(cur_is_heading)
            cur = []
            continue
        bullet_m = re.match(r"^[-•]\s+(.+)$", s)
        if bullet_m:
            if cur:
                raw_paragraphs.append(" ".join(cur))
                heading_flags.append(cur_is_heading)
                cur = []
            raw_paragraphs.append(bullet_m.group(1))
            heading_flags.append("li")
            continue
        if not cur:
            cur_is_heading = None
        cur.append(s)
    if cur:
        raw_paragraphs.append(" ".join(cur))
        heading_flags.append(cur_is_heading)

    # Drop a first paragraph that's just the chapter title repeated verbatim
    # (a running-header artifact from the PDF extraction).
    if raw_paragraphs and heading_flags[0] is None:
        if normalize(raw_paragraphs[0]) == normalize(f"{thai_title}{english_title}"):
            raw_paragraphs = raw_paragraphs[1:]
            heading_flags = heading_flags[1:]

    # In most chapters the "References" heading never got its own '##' tag in
    # the source - it's merged onto the end of the last body paragraph
    # (another missing-blank-line PDF artifact). Because build_chapters.py's
    # own reference-rebuilding only ran when it recognized that heading, the
    # citations after it were also never re-joined - they're still fragmented
    # across paragraph breaks whenever the source PDF happened to wrap a
    # line. So once the (unlabeled) references section is found, treat every
    # remaining paragraph in the chapter as part of one continuous citation
    # blob and re-split it by sequential numbering, the same way
    # build_chapters.py's rebuild_references() does for chapters where the
    # heading WAS recognized.
    expanded_paragraphs, expanded_flags = [], []
    for i, (text, kind) in enumerate(zip(raw_paragraphs, heading_flags)):
        split = split_references_inline(text)
        if split:
            prefix, label, remainder = split
            if prefix:
                expanded_paragraphs.append(prefix)
                expanded_flags.append(kind)
            expanded_paragraphs.append(label)
            expanded_flags.append("h1")
            blob = " ".join([remainder] + list(raw_paragraphs[i + 1 :])).strip()
            for entry in split_numbered_entries(blob):
                expanded_paragraphs.append(entry)
                expanded_flags.append("li")
            break
        expanded_paragraphs.append(text)
        expanded_flags.append(kind)
    raw_paragraphs, heading_flags = expanded_paragraphs, expanded_flags

    blocks = []
    for text, kind in zip(raw_paragraphs, heading_flags):
        text = clean_ws(text)
        if not text:
            continue
        if kind in ("h1", "h2"):
            for frag in split_embedded_headings(text):
                btype, btext = classify_heading(kind, frag)
                blocks.append({"type": btype, "text": btext})
        elif kind == "li":
            blocks.append({"type": "li", "text": text})
        else:
            if re.match(r"^ราคา\s*\d+\s*บาท\.?$", text):
                continue  # back-cover price tag artifact, not book content
            if ENUM_ANY.match(text):
                blocks.append({"type": "li", "text": text})
            else:
                blocks.append({"type": "p", "text": text})

    return {
        "day": DAY_OFFSET + chapter,
        "book": BOOK,
        "chapter": chapter,
        "title": title,
        "authors": AUTHOR,
        "blocks": blocks,
    }


def main():
    md_dir = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    index_path = Path(sys.argv[3])
    out_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    for md_path in sorted(md_dir.glob("*.md")):
        lesson = parse_chapter(md_path)
        lessons.append(lesson)

    lessons.sort(key=lambda l: l["day"])

    for lesson in lessons:
        out_path = out_dir / f"day-{lesson['day']:03d}.json"
        out_path.write_text(json.dumps(lesson, ensure_ascii=False), encoding="utf-8")

    existing = json.loads(index_path.read_text(encoding="utf-8"))
    existing = [e for e in existing if e.get("book") != BOOK]
    for lesson in lessons:
        existing.append({
            "day": lesson["day"],
            "book": lesson["book"],
            "chapter": lesson["chapter"],
            "title": lesson["title"],
            "authors": lesson["authors"],
        })
    existing.sort(key=lambda l: l["day"])
    index_path.write_text(json.dumps(existing, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Converted {len(lessons)} Pimolrat chapters -> days {lessons[0]['day']}-{lessons[-1]['day']}")


if __name__ == "__main__":
    main()
