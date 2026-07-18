/// <reference types="node" />
// Corpus-wide content checks — run automatically by `npm test`, so any new
// lesson JSON (public/lessons/day-*.json, from scripts/extract_lessons.py)
// gets checked before it ships, not just the ones we happened to look at by
// hand. See scripts/LESSON_CHECKLIST.md for the human-readable version of
// these rules and what to do when one of them fails.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  stripWhyIntro,
  splitNumberedList,
  splitDenseProse,
  extractDuplicateCaption,
  classifySingleColumnTable,
} from '../lib/lessonFormatting';

type Block =
  | { type: 'h1' | 'h2' | 'li' | 'p' | 'callout'; text: string }
  | { type: 'table'; rows: string[][] };

const LESSONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/lessons');

function loadLessonFiles(): { file: string; blocks: Block[] }[] {
  return readdirSync(LESSONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      file,
      blocks: (JSON.parse(readFileSync(path.join(LESSONS_DIR, file), 'utf-8')).blocks as Block[]) ?? [],
    }));
}

describe('lesson content rules (public/lessons/day-*.json)', () => {
  const lessons = loadLessonFiles();

  it('finds at least one lesson file to check', () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it('every single-column table matches a shape the renderer knows how to display', () => {
    // LessonDetail's `table` case only special-cases two single-column
    // shapes (a 2-row title+body pair, or a run of "title\nbody" pearl
    // cards) — anything else silently falls back to a plain 1-column table,
    // which is easy to miss visually. If this fails, either reshape the
    // table in the source .docx, or extend `classifySingleColumnTable`
    // (src/lib/lessonFormatting.ts) to recognize the new shape on purpose.
    const unrecognized: string[] = [];
    for (const { file, blocks } of lessons) {
      blocks.forEach((b, i) => {
        if (b.type !== 'table') return;
        const dup = extractDuplicateCaption(b.rows);
        const dataRows = dup ? dup.dataRows : b.rows;
        const ncols = Math.max(...dataRows.map((r) => r.length));
        if (ncols !== 1) return;
        const shape = classifySingleColumnTable(dataRows.map((r) => r[0] ?? ''));
        if (!shape) unrecognized.push(`${file} (block ${i}, ${dataRows.length} rows)`);
      });
    }
    expect(unrecognized).toEqual([]);
  });

  it('runs the text-splitting helpers over every block without throwing', () => {
    // A crash here (e.g. a pathological string tripping up a regex) would
    // take down the whole lesson reader for that day, not just one block.
    for (const { file, blocks } of lessons) {
      for (const b of blocks) {
        if (b.type === 'table') continue;
        expect(() => {
          const body = b.type === 'callout' ? stripWhyIntro(b.text) : b.text;
          const parsed = splitNumberedList(body);
          if (!parsed) splitDenseProse(body);
        }, `${file}: ${JSON.stringify(b.text.slice(0, 60))}`).not.toThrow();
      }
    }
  });

  it('reports dense-text coverage (informational — does not fail)', () => {
    let dense = 0;
    let handled = 0;
    for (const { blocks } of lessons) {
      for (const b of blocks) {
        if (b.type !== 'callout' && b.type !== 'p' && b.type !== 'li') continue;
        const body = b.type === 'callout' ? stripWhyIntro(b.text) : b.text;
        if (body.includes('\n') || body.length <= 150) continue;
        dense++;
        if (splitNumberedList(body) || splitDenseProse(body)) handled++;
      }
    }
    console.log(`[lesson content] dense blocks: ${dense}, auto-split: ${handled} (${
      dense ? Math.round((handled / dense) * 100) : 100
    }%)`);
    expect(true).toBe(true);
  });
});
