import { describe, expect, it } from 'vitest';
import { experienceOf, inlineSegments, parseResume, readReviewedAt } from '../src/lib/resume.ts';

const SAMPLE = `---
reviewedAt: 2026-11-23
---

# Ada Lovelace

Analytical Engine Programmer

London · ada@example.com · github.com/ada

## Summary

I write programs for machines that don't exist yet.

Second paragraph.

## Skills

- **Math:** Bernoulli numbers, loops
- **Writing:** Notes

## Experience

### Babbage & Co. · Translator
*1842 – 1843*

- Translated the memoir.
- Added the notes.

### Self · Writer
*1843*

- Wrote Note G.

## Education

### Home tutors · Mathematics
*1830s*
`;

describe('parseResume', () => {
  const r = parseResume(SAMPLE);

  it('reads the front-matter, name, headline and contact line', () => {
    expect(r.reviewedAt).toBe('2026-11-23');
    expect(r.name).toBe('Ada Lovelace');
    expect(r.headline).toBe('Analytical Engine Programmer');
    expect(r.contact).toEqual(['London', 'ada@example.com', 'github.com/ada']);
  });

  it('keeps sections in order, with their paragraphs and lists', () => {
    expect(r.sections.map((s) => s.title)).toEqual(['Summary', 'Skills', 'Experience', 'Education']);
    expect(r.sections[0].blocks).toEqual([
      { kind: 'paragraph', text: "I write programs for machines that don't exist yet." },
      { kind: 'paragraph', text: 'Second paragraph.' },
    ]);
    expect(r.sections[1].blocks).toEqual([
      { kind: 'list', items: ['**Math:** Bernoulli numbers, loops', '**Writing:** Notes'] },
    ]);
  });

  it('splits an entry heading into title and subtitle, with its dates and bullets', () => {
    const [first, second] = experienceOf(r);
    expect(first).toEqual({
      title: 'Babbage & Co.',
      subtitle: 'Translator',
      when: '1842 – 1843',
      blocks: [{ kind: 'list', items: ['Translated the memoir.', 'Added the notes.'] }],
    });
    expect(second.title).toBe('Self');
    expect(r.sections[3].entries[0]).toEqual({
      title: 'Home tutors',
      subtitle: 'Mathematics',
      when: '1830s',
      blocks: [],
    });
  });

  it('joins a paragraph that wraps over several lines', () => {
    const wrapped = SAMPLE.replace('Second paragraph.', 'Second\nparagraph.');
    expect(parseResume(wrapped).sections[0].blocks[1]).toEqual({ kind: 'paragraph', text: 'Second paragraph.' });
  });

  // Anything it doesn't render must fail loudly, never ship as literal markdown or vanish.
  it.each([
    ['a link', '[home](https://example.com)'],
    ['inline code', 'uses `npm`'],
    ['a numbered list', '1. first'],
    ['a quote', '> quoted'],
    ['a deeper heading', '#### Note'],
    ['a star bullet', '* item'],
    ['a rule', '---'],
    ['italics in prose', 'an *aside* here'],
    ['an html tag', '<b>bold</b>'],
    ['an unclosed bold', 'a **bold claim'],
  ])('rejects %s', (_, line) => {
    expect(() => parseResume(SAMPLE.replace('Second paragraph.', line))).toThrow(/resume\.md/);
  });

  it('rejects a file with no front-matter or no reviewedAt', () => {
    expect(() => parseResume(SAMPLE.replace(/^---[\s\S]*?---\n/, ''))).toThrow(/reviewedAt/);
    expect(() => parseResume(SAMPLE.replace('reviewedAt: 2026-11-23', 'title: x'))).toThrow(/reviewedAt/);
  });

  it('rejects a header without exactly a headline and a contact line', () => {
    expect(() => parseResume(SAMPLE.replace('London · ada@example.com · github.com/ada\n', ''))).toThrow(/header/);
  });

  it('rejects content before the first section or a bullet outside one', () => {
    expect(() => parseResume(SAMPLE.replace('# Ada Lovelace', '- stray\n\n# Ada Lovelace'))).toThrow(/resume\.md/);
  });
});

describe('readReviewedAt', () => {
  it('reads the value and strips quotes', () => {
    expect(readReviewedAt('---\nreviewedAt: "2026-01-02"\n---\n')).toBe('2026-01-02');
  });
  it('is undefined without front-matter', () => {
    expect(readReviewedAt('# x')).toBeUndefined();
  });
});

describe('inlineSegments', () => {
  it('splits **bold** runs from plain text', () => {
    expect(inlineSegments('**Math:** loops and **more**')).toEqual([
      { text: 'Math:', strong: true },
      { text: ' loops and ', strong: false },
      { text: 'more', strong: true },
    ]);
  });
  it('returns plain text whole', () => {
    expect(inlineSegments('plain')).toEqual([{ text: 'plain', strong: false }]);
  });
});
