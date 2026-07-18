"""Shared keyword-extraction heuristic for the Daily Neonatology Lessons.

Pulls out the ~10 most *distinctive* searchable terms per lesson — mostly
clinical acronyms (NEC, PDA, HIE...) and Title Case medical phrases — from
the lesson's own body text, so the in-app search can match a lesson by a
term used inside it even when that term isn't in the title or authors.

"Distinctive" is the operative word: every lesson in this series shares a
lot of boilerplate structure (a "PEARL —" callout, an "Evidence Update"
citing NEJM/JAMA, "RCT"/"NICU"/"GA" used constantly), so raw term frequency
within one lesson isn't enough — a term that shows up in half the corpus is
noise, not a keyword. This scores candidates with tf-idf across the whole
222-lesson corpus so what surfaces per lesson is what's actually unique to
it (HLHS, VSD, TGA for the congenital heart disease lesson; not PEARL or
NEJM, which show up almost everywhere).

Used by extract_lessons.py (when regenerating from source .docx) and by
backfill_keywords.py (to add keywords to already-extracted JSON).
"""
import math
import re
from collections import Counter

# Acronyms that are too generic/institutional to help someone find a
# specific lesson, kept out regardless of corpus frequency.
ACRONYM_STOPLIST = {
    "US", "UK", "WHO", "CDC", "FDA", "AAP", "ACOG", "NIH", "OECD",
    "ICU", "ED", "IV", "IM", "PO", "PR", "ID", "OR", "AM", "PM",
    "CI", "RR", "HR", "SD", "IQR", "RCT", "NNT", "Q", "A", "NL", "CH",
    "PEARL", "NEJM", "JAMA", "BMJ",
    # Roman numerals — far too overloaded (trisomy, staging, "Type II"...)
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
}

WORD_STOPLIST = {
    "The", "This", "That", "These", "Those", "With", "From", "Into",
    "About", "After", "Before", "During", "While", "When", "Where",
    "What", "Which", "Who", "Whom", "Whose", "Why", "How", "All", "Any",
    "Both", "Each", "Few", "More", "Most", "Other", "Some", "Such", "No",
    "Nor", "Not", "Only", "Own", "Same", "Than", "Too", "Very", "Can",
    "Will", "Just", "Should", "Now", "Table", "Figure", "Key", "Summary",
    "Definitions", "Learning", "Objectives", "Overview", "Introduction",
    "Background", "Conclusion", "References", "Day", "Chapter", "And",
    "For", "Of", "In", "On", "At", "To", "As", "Is", "Are", "Was", "Were",
    "Note", "Notes", "Example", "Examples", "Self", "Check", "Evidence",
    "Update", "Preview", "Pearls", "Bedside", "Clinical", "Practical",
    "Rounds", "Implication", "Matters",
}

ACRONYM_RE = re.compile(r"\b([A-Z][A-Z0-9]{1,5})\b")
PHRASE_RE = re.compile(r"\b([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+){1,3})\b")

# Terms that appear in more than this fraction of lessons are treated as
# corpus-wide boilerplate, not a distinctive keyword for any one lesson.
MAX_DOC_FREQ_RATIO = 0.12


def _lesson_text(blocks) -> str:
    parts = []
    for b in blocks:
        if b["type"] == "table":
            for row in b["rows"]:
                parts.extend(row)
        else:
            parts.append(b.get("text", ""))
    return "\n".join(parts)


def candidate_counts(blocks) -> Counter:
    """Raw candidate term counts for a single lesson (pre-idf)."""
    text = _lesson_text(blocks)
    counts: Counter = Counter()

    for m in ACRONYM_RE.finditer(text):
        word = m.group(1)
        if word in ACRONYM_STOPLIST or word.isdigit():
            continue
        counts[word] += 1

    for m in PHRASE_RE.finditer(text):
        phrase = m.group(1).strip()
        words = phrase.split()
        if all(w in WORD_STOPLIST for w in words):
            continue
        counts[phrase] += 1

    return counts


def build_corpus_doc_freq(all_blocks) -> tuple[Counter, int]:
    """Document frequency (# lessons containing each term) across the corpus."""
    df: Counter = Counter()
    n_docs = 0
    for blocks in all_blocks:
        n_docs += 1
        for term in candidate_counts(blocks):
            df[term] += 1
    return df, n_docs


def top_keywords(
    counts: Counter,
    title: str,
    doc_freq: Counter,
    n_docs: int,
    max_keywords: int = 10,
) -> list[str]:
    """Ranks this lesson's candidate terms by tf-idf, dropping anything that's
    corpus-wide boilerplate (high doc frequency) or already in the title."""
    title_words_lower = {w.lower() for w in title.split()}
    max_df = max(1, int(n_docs * MAX_DOC_FREQ_RATIO))

    scored = []
    for term, tf in counts.items():
        if term.lower() in title_words_lower or term in title:
            continue
        df = doc_freq.get(term, 1)
        if df > max_df:
            continue
        idf = math.log((n_docs + 1) / (df + 1)) + 1
        scored.append((tf * idf, -len(term), term))

    scored.sort(key=lambda t: (-t[0], t[1]))

    keywords: list[str] = []
    seen_lower = set(title_words_lower)
    for _, _, term in scored:
        low = term.lower()
        if low in seen_lower:
            continue
        seen_lower.add(low)
        keywords.append(term)
        if len(keywords) >= max_keywords:
            break
    return keywords


def extract_keywords_for_corpus(
    lessons: list[tuple[str, list]], max_keywords: int = 10
) -> dict[str, list[str]]:
    """lessons: list of (key, blocks) pairs, e.g. [(day_str, blocks), ...].
    Returns {key: [keywords]} using corpus-wide tf-idf so results are
    distinctive per lesson rather than corpus-wide boilerplate."""
    all_counts = {key: candidate_counts(blocks) for key, blocks in lessons}
    doc_freq: Counter = Counter()
    for counts in all_counts.values():
        for term in counts:
            doc_freq[term] += 1
    n_docs = len(lessons)

    titles = {key: "" for key, _ in lessons}
    return {
        key: top_keywords(counts, titles[key], doc_freq, n_docs, max_keywords)
        for key, counts in all_counts.items()
    }
