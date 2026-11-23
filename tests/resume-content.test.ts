import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadDenyHashes, scanText } from '../scripts/privacy-scan.ts';
import { parseResume, readReviewedAt } from '../src/lib/resume.ts';

// The spec §5 scrub, pinned against the file that ships. The current employer keeps its role line,
// dates and generic bullets, and nothing that names a customer, a tool or an incident. Scrubbed
// terms are checked through hashes only (the denylist `npm run privacy` uses), so this public file
// never spells out what it scrubs.
const PATH = 'src/content/resume.md';
const md = readFileSync(new URL(`../${PATH}`, import.meta.url), 'utf8');
const EMPLOYER = new RegExp('ban' + 'zai', 'i');
/** Hashes of terms the rest of the repo may use but the resume must not (node scripts/privacy-hash.ts). */
const RESUME_ONLY = ['67e5a3025bc013d09e3a1e6659f2e53efc7d137272ffe72b6dc8344f578461cf'];

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

  it('passes the privacy scan, with the hashed denylist and the resume-only scrub terms', () => {
    const deny = loadDenyHashes(new URL('../scripts/privacy-denylist.json', import.meta.url).pathname);
    expect(scanText(PATH, md, new Set([...deny, ...RESUME_ONLY]))).toEqual([]);
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
