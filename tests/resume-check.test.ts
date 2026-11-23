import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'resume-check-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const DAY = 24 * 3600_000;
const run = (path: string) =>
  execFileSync('node', ['scripts/resume-check.ts', path], { encoding: 'utf8' }).trim();
const resumeWith = (name: string, daysAgo: number) => {
  const path = join(dir, name);
  const reviewedAt = new Date(Date.now() - daysAgo * DAY).toISOString();
  writeFileSync(path, `---\nreviewedAt: ${reviewedAt}\n---\n\n# Resume\n`);
  return path;
};

describe('scripts/resume-check.ts', () => {
  it('95-day-old front-matter prints review-due', () => expect(run(resumeWith('a.md', 95))).toBe('review-due'));
  it('10-day-old front-matter prints current', () => expect(run(resumeWith('b.md', 10))).toBe('current'));
  it('130-day-old front-matter prints hidden', () => expect(run(resumeWith('c.md', 130))).toBe('hidden'));
  it('a missing resume.md prints unpublished and exits 0', () => {
    expect(run(join(dir, 'does-not-exist.md'))).toBe('unpublished');
  });
  it('front-matter without reviewedAt prints hidden', () => {
    const path = join(dir, 'd.md');
    writeFileSync(path, '---\ntitle: x\n---\nbody\n');
    expect(run(path)).toBe('hidden');
  });
});
