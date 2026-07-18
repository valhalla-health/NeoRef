import { describe, it, expect } from 'vitest';
import {
  stripWhyIntro,
  splitNumberedList,
  splitDenseProse,
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

  it('does not chop a Thai dosing line at unit-abbreviation periods (มก./กก./ชม./ดล./...)', () => {
    // Regression: "ก. 20 มก./กก. ทุก 8 ชม. นาน 10 วัน ..." from a real Pimolrat
    // lesson used to fracture into "ก. 20 มก./กก.", "ทุก 8 ชม.", "นาน 10 วัน ..."
    // because the sentence-boundary heuristic treated กก./ชม. as sentence ends.
    const body =
      'ก. 20 มก./กก. ทุก 8 ชม. นาน 10 วัน สำหรับรายที่มีความเสี่ยงสูง จากมารดาที่เคย ติดเชื้อ HSV และกำลังมีแผลเริมขณะคลอด ทารกไม่มีอาการทางคลินิกและผลเพาะเชื้อ/หรือ PCR ในเลือดเป็นบวก แต่ผลตรวจน้ำไขสันหลังเป็นลบ';
    expect(splitDenseProse(body)).toBeNull();
  });

  it('does not split a leading roman-numeral marker ("i." "iii.") off from the rest of the item', () => {
    // Regression: "i. เจ็บครรภ์นาน (prolonged labor) ระยะเวลา..." used to split
    // into a lone "i." fragment plus the rest, because the marker's period
    // looked like an English sentence boundary.
    const body =
      'i. เจ็บครรภ์นาน (prolonged labor) ระยะเวลาดำเนินการคลอดนานผิดปกติ โดยเฉพาะตั้งแต่ปากมดลูกเปิดเต็มที่ จนคลอดทารก (prolonged 2nd stage) ทำให้ทารกเสี่ยง ต่อการเกิดภาวะขาดออกซิเจน (birth asphyxia) หรือบาดเจ็บจากการคลอด เนื่องจาก เป็นการคลอดยาก มักต้องใช้สูติศาสตร์หัตถการช่วยในการคลอด';
    const result = splitDenseProse(body);
    expect(result === null || result[0] !== 'i.').toBe(true);
  });

  it('still splits genuine sentence boundaries after words that happen to end in i/v/x', () => {
    const body =
      'The infant had a normal reflex. Tone and cry were both appropriate for gestational age and there were no other concerning findings on this initial newborn examination today.';
    const result = splitDenseProse(body);
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(2);
  });

  it('does not split a value expressed as X มก./ดล. from the sentence around it', () => {
    const body =
      'ระดับกลูโคสในเลือดต่ำกว่า 40 มก./ดล. และทารกมีอาการ ให้เจาะเลือดตรวจซ้ำทุก 30 นาทีจนกว่าระดับน้ำตาลจะกลับมาปกติและคงที่ตลอดระยะเวลาการสังเกตอาการต่อเนื่องอย่างน้อยหนึ่งชั่วโมงเต็ม';
    const result = splitDenseProse(body);
    expect(result === null || result.every((s) => !/^ดล\.?$/.test(s))).toBe(true);
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
