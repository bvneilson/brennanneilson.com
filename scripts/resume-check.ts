// Prints the resume's freshness: current | review-due | hidden | unpublished.
// Runs under plain `node` (R3): relative `.ts` imports and erasable syntax only.
//
//   node scripts/resume-check.ts [path/to/resume.md]
//
// Exit 0 always for a readable answer. A missing resume.md is "unpublished" (not yet written, so
// nothing to review). A resume with no usable reviewedAt prints "hidden", the safe reading.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readReviewedAt } from '../src/lib/resume.ts';
import { resumeFreshness } from '../src/lib/resume-freshness.ts';

const DEFAULT_PATH = fileURLToPath(new URL('../src/content/resume.md', import.meta.url));

export function checkResume(path: string, now: Date): string {
  if (!existsSync(path)) return 'unpublished';
  const reviewedAt = readReviewedAt(readFileSync(path, 'utf8'));
  return reviewedAt === undefined ? 'hidden' : resumeFreshness(reviewedAt, now);
}

if (import.meta.main) {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_PATH;
  console.log(checkResume(path, new Date()));
}
