import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadDenyHashes, scanText } from '../scripts/privacy-scan.ts';
import { parseResume, readReviewedAt } from '../src/lib/resume.ts';

// The spec §5 scrub, pinned against the file that ships. His employer reads this site, so its
// entry keeps the role line, the dates and generic bullets, and nothing that names a customer, a
// tool or an incident. Words that must never appear are split so this file doesn't carry them whole.
const PATH = 'src/content/resume.md';
const md = readFileSync(new URL(`../${PATH}`, import.meta.url), 'utf8');
const EMPLOYER = new RegExp('ban' + 'zai', 'i');
const SCRUBBED = ['FI' + 'CO', 'Post' + 'Hog', 'ECS', 'RDS'];

describe('src/content/resume.md', () => {
  it('has a valid reviewedAt in its front-matter (R37)', () => {
    const reviewedAt = readReviewedAt(md);
    expect(reviewedAt).toBe('2026-11-23');
    expect(Number.isNaN(Date.parse(reviewedAt as string))).toBe(false);
  });

  it('contains no phone number', () => {
    expect(md).not.toMatch(/\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/); // area code, then 3 and 4 digits
    expect(md).not.toMatch(/\+\d[\d\s().-]{7,}\d/); // international, with a leading +
    expect(md).not.toMatch(/\b\d{10}\b/); // ten digits run together
  });

  it('names the employer only on its role line', () => {
    const lines = md.split('\n').filter((l) => EMPLOYER.test(l));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^### /);
  });

  it.each(SCRUBBED)('never says %s', (word) => {
    expect(md).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
  });

  it('passes the privacy scan, the hashed denylist included', () => {
    const deny = loadDenyHashes(new URL('../scripts/privacy-denylist.json', import.meta.url).pathname);
    expect(scanText(PATH, md, deny)).toEqual([]);
  });

  it('keeps only the city in its location', () => {
    const { contact } = parseResume(md);
    expect(contact[0]).toBe('American Fork, UT');
    expect(md).not.toMatch(/\b\d{5}(?:-\d{4})?\b/); // no ZIP code
  });

  it('has no em dash or semicolon (voice gate hard checks)', () => {
    expect(md).not.toMatch(/[—;]/);
  });

  it('parses, with the sections the pages render', () => {
    const resume = parseResume(md);
    expect(resume.name).toBe('Brennan Neilson');
    expect(resume.sections.map((s) => s.title)).toEqual([
      'Summary',
      'Skills',
      'Experience',
      'Selected project',
      'Education',
    ]);
    const experience = resume.sections.find((s) => s.title === 'Experience');
    expect(experience?.entries.length).toBeGreaterThanOrEqual(5);
    for (const e of experience?.entries ?? []) expect(e.when, e.title).toBeTruthy();
  });
});
