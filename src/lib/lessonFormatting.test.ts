import { describe, it, expect } from 'vitest';
import {
  stripWhyIntro,
  splitNumberedList,
  splitDenseProse,
  splitArrowChain,
  extractDuplicateCaption,
  classifySingleColumnTable,
} from './lessonFormatting';

describe('stripWhyIntro', () => {
  it('removes the rhetorical lead-in line', () => {
    expect(stripWhyIntro('ทำไม neonatologist ต้องเข้าใจ Pain?\nBody text here.')).toBe('Body text here.');
  });

  it('leaves other text untouched', () => {
    expect(stripWhyIntro('Body text here.')).toBe('Body text here.');
  });
});

describe('splitNumberedList', () => {
  it('splits an inline "(1) ... (2) ..." list with semicolon separators', () => {
    const result = splitNumberedList('สิ่งที่ต้องจำ: (1) first point; (2) second point; (3) third point.');
    expect(result?.intro).toBe('สิ่งที่ต้องจำ:');
    expect(result?.items).toEqual(['first point', 'second point', 'third point.']);
  });

  it('splits an inline list with comma separators', () => {
    const result = splitNumberedList('Ask: (1) type of anesthetic, (2) induction agent, (3) dose given.');
    expect(result?.items).toEqual(['type of anesthetic', 'induction agent', 'dose given.']);
  });

  it('does not split parenthetical years or single-item text', () => {
    expect(splitNumberedList('A study from (2010) showed nothing special.')).toBeNull();
    expect(splitNumberedList('Only mentions (1) once here.')).toBeNull();
  });

  it('does not split text that already has real line breaks', () => {
    expect(splitNumberedList('(1) first\n(2) second')).toBeNull();
  });

  it('splits an inline list with sentence-ending period separators', () => {
    const result = splitNumberedList(
      '(1) Definition กำหนดว่าใครเป็น BPD. (2) NIH 2001 criteria คือ gold standard. (3) Incidence ขึ้นกับ definition อย่างมาก.',
    );
    expect(result?.items).toEqual([
      'Definition กำหนดว่าใครเป็น BPD',
      'NIH 2001 criteria คือ gold standard',
      'Incidence ขึ้นกับ definition อย่างมาก.',
    ]);
  });
});

describe('splitDenseProse', () => {
  it('returns null for short text', () => {
    expect(splitDenseProse('Too short to bother splitting.')).toBeNull();
  });

  it('splits on semicolons followed by a letter, not citation-style semicolons', () => {
    const body =
      'Long lead sentence describing something clinically relevant in detail; second clause with more detail added here; third clause wrapping up the point with extra padding text.';
    const result = splitDenseProse(body);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
  });

  it('does not treat a citation-style semicolon as a list separator', () => {
    const body =
      'Kumar P et al. Pediatrics 2010;126:585 is a long citation line padded out with extra words to cross the length threshold for splitting consideration here.';
    const result = splitDenseProse(body);
    // No "; letter" separator and no un-guarded sentence/dash boundary — stays whole.
    expect(result).toBeNull();
  });

  it('falls back to sentence-ending periods, guarding decimals and "et al."', () => {
    const body =
      'First sentence makes a claim about something specific and detailed. Second sentence adds supporting detail with a dose of 0.5 mL given. Rysavy MA et al. JAMA Pediatrics reports similar findings in a large cohort.';
    const result = splitDenseProse(body);
    expect(result).not.toBeNull();
    // "0.5 mL" must not be split, and "et al." must not be split either.
    expect(result!.some((s) => /^mL/.test(s))).toBe(false);
    expect(result!.some((s) => /^al\.?\s+JAMA/i.test(s))).toBe(false);
  });

  it('falls back to em-dash separated clauses when no semicolon/period boundary exists', () => {
    const body =
      'Born at Level 3 means consistently lower mortality for small premature infants overall — transporting a mother at risk of preterm birth is always better than postnatal transport for the infant';
    const result = splitDenseProse(body);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
  });
});

describe('splitArrowChain', () => {
  it('splits a long causal chain into one step per arrow link', () => {
    const body =
      'Normoxia/hyperoxia → prolyl hydroxylase active → HIF-1α hydroxylated → ubiquitinated → proteosomal degradation → ↓ VEGF → disrupted vascular development';
    const result = splitArrowChain(body);
    expect(result).toEqual([
      'Normoxia/hyperoxia',
      'prolyl hydroxylase active',
      'HIF-1α hydroxylated',
      'ubiquitinated',
      'proteosomal degradation',
      '↓ VEGF',
      'disrupted vascular development',
    ]);
  });

  it('returns null for short text', () => {
    expect(splitArrowChain('A → B → C')).toBeNull();
  });

  it('returns null when there are fewer than two arrows', () => {
    const body =
      'A single long sentence with just one arrow in it padded out to cross the length threshold for consideration → like this';
    expect(splitArrowChain(body)).toBeNull();
  });

  it('returns null for text with no arrows at all, however long', () => {
    const body =
      'A long sentence with no arrows in it at all, padded out with extra words to cross the length threshold for splitting consideration here.';
    expect(splitArrowChain(body)).toBeNull();
  });

  it('does not split text that already has real line breaks', () => {
    const body = 'First long enough line padded with extra words to cross the threshold here\n→ second line';
    expect(splitArrowChain(body)).toBeNull();
  });
});

describe('extractDuplicateCaption', () => {
  it('detects a caption duplicated across every column of the first row', () => {
    const rows = [
      ['A long caption meant to span the whole table width here', 'A long caption meant to span the whole table width here'],
      ['Header A', 'Header B'],
      ['Value A', 'Value B'],
    ];
    const result = extractDuplicateCaption(rows);
    expect(result?.caption).toBe('A long caption meant to span the whole table width here');
    expect(result?.dataRows).toEqual([
      ['Header A', 'Header B'],
      ['Value A', 'Value B'],
    ]);
  });

  it('ignores ordinary tables with genuinely different columns', () => {
    const rows = [
      ['Header A', 'Header B'],
      ['Value A', 'Value B'],
    ];
    expect(extractDuplicateCaption(rows)).toBeNull();
  });

  it('ignores short identical cells (not long enough to be a stray caption)', () => {
    const rows = [
      ['N/A', 'N/A'],
      ['Value A', 'Value B'],
    ];
    expect(extractDuplicateCaption(rows)).toBeNull();
  });
});

describe('classifySingleColumnTable', () => {
  it('recognizes a run of "title\\nbody" pearl cards', () => {
    const shape = classifySingleColumnTable(['Pearl 1\nBody one', 'Pearl 2\nBody two', 'Pearl 3\nBody three']);
    expect(shape?.kind).toBe('pearlCards');
    if (shape?.kind === 'pearlCards') {
      expect(shape.cards).toEqual([
        { title: 'Pearl 1', body: 'Body one' },
        { title: 'Pearl 2', body: 'Body two' },
        { title: 'Pearl 3', body: 'Body three' },
      ]);
    }
  });

  it('recognizes a lone title + body pair', () => {
    const shape = classifySingleColumnTable(['Title line', 'Body paragraph']);
    expect(shape?.kind).toBe('titleBody');
    if (shape?.kind === 'titleBody') {
      expect(shape.title).toBe('Title line');
      expect(shape.body).toBe('Body paragraph');
    }
  });

  it('returns null for unrecognized shapes', () => {
    expect(classifySingleColumnTable(['Only one cell'])).toBeNull();
    expect(classifySingleColumnTable(['a', 'b', 'c', 'd'])).toBeNull();
  });
});
