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
import { resumeFreshness } from '../src/lib/resume-freshness.ts';

const DEFAULT_PATH = fileURLToPath(new URL('../src/content/resume.md', import.meta.url));

/** The `reviewedAt` value from the leading `---` front-matter block, or undefined. */
export function readReviewedAt(markdown: string): string | undefined {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!block) return undefined;
  const line = /^reviewedAt:\s*(.+?)\s*$/m.exec(block[1]);
  return line?.[1].replace(/^["']|["']$/g, '');
}

export function checkResume(path: string, now: Date): string {
  if (!existsSync(path)) return 'unpublished';
  const reviewedAt = readReviewedAt(readFileSync(path, 'utf8'));
  return reviewedAt === undefined ? 'hidden' : resumeFreshness(reviewedAt, now);
}

if (import.meta.main) {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_PATH;
  console.log(checkResume(path, new Date()));
}
