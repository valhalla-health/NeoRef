#!/usr/bin/env python3
"""One-time backfill: adds a `keywords` field to every entry in
src/data/lessons-index.json, computed from the already-extracted lesson
content in public/lessons/day-*.json (the original .docx source isn't
available in this checkout, so this reads the previously extracted JSON
instead of re-parsing Word docs).

Usage: python scripts/backfill_keywords.py
"""
import json
from collections import Counter
from pathlib import Path

from lesson_keywords import candidate_counts, top_keywords

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / "src/data/lessons-index.json"
LESSONS_DIR = ROOT / "public/lessons"


def main():
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))

    contents = {}
    for entry in index:
        path = LESSONS_DIR / f"day-{entry['day']:03d}.json"
        contents[entry["day"]] = json.loads(path.read_text(encoding="utf-8"))

    per_lesson_counts = {
        day: candidate_counts(content["blocks"]) for day, content in contents.items()
    }
    doc_freq: Counter = Counter()
    for counts in per_lesson_counts.values():
        for term in counts:
            doc_freq[term] += 1
    n_docs = len(index)

    for entry in index:
        counts = per_lesson_counts[entry["day"]]
        entry["keywords"] = top_keywords(counts, entry["title"], doc_freq, n_docs)

    INDEX_PATH.write_text(
        json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"Added keywords to {len(index)} lessons.")


if __name__ == "__main__":
    main()
