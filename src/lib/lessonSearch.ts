import type { Lesson } from '../data/lessons';

// Groups of alternate/related terms (clinical abbreviations, synonyms, Thai
// equivalents) that mean the same thing, so a search for e.g. "jaundice",
// "NEC", or "ดีซ่าน" still finds the chapter even when the title uses the
// formal term instead. Each group is looked up in both directions.
const RELATED_TERM_GROUPS: string[][] = [
  ['jaundice', 'ดีซ่าน', 'hyperbilirubinemia', 'bilirubin', 'kernicterus'],
  ['nec', 'necrotizing enterocolitis'],
  ['pda', 'patent ductus arteriosus'],
  ['hie', 'hypoxic-ischemic encephalopathy', 'encephalopathy'],
  ['pphn', 'persistent pulmonary hypertension'],
  ['chd', 'congenital heart disease'],
  ['reflux', 'gerd', 'gastroesophageal reflux'],
  ['ivh', 'brain injury', 'neurovascular'],
  ['sepsis', 'ติดเชื้อ', 'infection', 'bacterial sepsis', 'meningitis'],
  ['seizure', 'ชัก', 'seizures'],
  ['lung', 'ปอด', 'pulmonary', 'respiratory'],
  ['heart', 'หัวใจ', 'cardiac', 'cardiovascular'],
  ['kidney', 'ไต', 'renal'],
  ['liver', 'ตับ', 'hepatic'],
  ['brain', 'สมอง', 'neuro', 'central nervous system', 'neurologic'],
  ['skin', 'ผิวหนัง', 'dermatoses', 'cutaneous', 'dermatologic'],
  ['nutrition', 'feeding', 'enteral', 'parenteral'],
  ['diabetes', 'maternal diabetes', 'hyperglycemia'],
  ['hypoglycemia', 'glucose', 'hyperglycemia'],
  ['premature', 'preterm', 'prematurity'],
  ['twins', 'multiple gestation', 'multiple gestations'],
  ['genetics', 'genome', 'chromosome', 'genetic'],
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKC').trim();
}

const RELATED_TERMS_BY_WORD = new Map<string, string[]>();
for (const group of RELATED_TERM_GROUPS) {
  const normalized = group.map(normalize);
  for (const word of normalized) RELATED_TERMS_BY_WORD.set(word, normalized);
}

function relatedTerms(token: string): string[] {
  return RELATED_TERMS_BY_WORD.get(token) ?? [token];
}

function haystackFor(lesson: Lesson): string {
  return normalize(
    `${lesson.book} chapter ${lesson.chapter} ch${lesson.chapter} day ${lesson.day} ${lesson.title} ${lesson.authors} ${(lesson.keywords ?? []).join(' ')}`,
  );
}

/** Filters lessons by a free-text query, matching chapter/day/book/title/authors
 * plus a small set of related clinical terms (abbreviations, synonyms, Thai
 * equivalents) so results aren't limited to exact title wording. */
export function searchLessons(lessons: Lesson[], rawQuery: string): Lesson[] {
  const query = normalize(rawQuery);
  if (!query) return lessons;

  const tokens = query.split(/\s+/).filter(Boolean);
  return lessons.filter((lesson) => {
    const haystack = haystackFor(lesson);
    return tokens.every((token) => relatedTerms(token).some((candidate) => haystack.includes(candidate)));
  });
}
