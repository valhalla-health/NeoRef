import { describe, it, expect } from 'vitest';
import { searchLessons } from './lessonSearch';
import type { Lesson } from '../data/lessons';

const LESSONS: Lesson[] = [
  { day: 1, book: 'Avery', chapter: 1, title: 'Neonatal and Perinatal Epidemiology', authors: "Paneth, Patel & O'Shea Jr." },
  { day: 72, book: 'Avery', chapter: 72, title: 'Neonatal Hyperbilirubinemia and Kernicterus', authors: 'Someone' },
  { day: 33, book: 'Avery', chapter: 33, title: 'Bacterial Sepsis and Meningitis', authors: 'Someone Else' },
  { day: 48, book: 'Avery', chapter: 48, title: 'Patent Ductus Arteriosus in the Preterm Infant', authors: 'Author' },
  { day: 91, book: 'Avery', chapter: 91, title: 'Disorders of the Adrenal Gland', authors: 'Someone', keywords: ['CAH', 'ACTH'] },
];

describe('searchLessons', () => {
  it('returns all lessons for an empty query', () => {
    expect(searchLessons(LESSONS, '')).toHaveLength(5);
    expect(searchLessons(LESSONS, '   ')).toHaveLength(5);
  });

  it('matches by title substring, case-insensitively', () => {
    const results = searchLessons(LESSONS, 'epidemiology');
    expect(results.map((l) => l.day)).toEqual([1]);
  });

  it('matches by author', () => {
    expect(searchLessons(LESSONS, 'paneth').map((l) => l.day)).toEqual([1]);
  });

  it('matches by chapter and day number', () => {
    expect(searchLessons(LESSONS, 'chapter 33').map((l) => l.day)).toEqual([33]);
    expect(searchLessons(LESSONS, 'day 48').map((l) => l.day)).toEqual([48]);
  });

  it('is order-independent across multiple words (AND match)', () => {
    expect(searchLessons(LESSONS, 'perinatal neonatal').map((l) => l.day)).toEqual([1]);
  });

  it('finds related/alternate clinical terms not present verbatim in the title', () => {
    expect(searchLessons(LESSONS, 'jaundice').map((l) => l.day)).toEqual([72]);
    expect(searchLessons(LESSONS, 'PDA').map((l) => l.day)).toEqual([48]);
    expect(searchLessons(LESSONS, 'infection').map((l) => l.day)).toEqual([33]);
  });

  it('matches Thai related terms', () => {
    expect(searchLessons(LESSONS, 'ดีซ่าน').map((l) => l.day)).toEqual([72]);
  });

  it('matches by a generated body keyword not present in title/authors', () => {
    expect(searchLessons(LESSONS, 'ACTH').map((l) => l.day)).toEqual([91]);
  });

  it('returns nothing for a query with no match', () => {
    expect(searchLessons(LESSONS, 'zzz-no-match')).toEqual([]);
  });
});
