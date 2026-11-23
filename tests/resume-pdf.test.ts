import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { RESUME_HASH_PREFIX, resumeSubject, sha256Hex } from '../src/lib/resume.ts';

// The PDF is printed from /resume by scripts/resume-pdf.ts and stamped with the hash of the
// resume.md it was printed from. If this fails, the PDF is stale: run `npm run resume:pdf`.
const mdBytes = readFileSync(new URL('../src/content/resume.md', import.meta.url));
const pdfBytes = readFileSync(new URL('../public/resume.pdf', import.meta.url));
const fileHash = createHash('sha256').update(mdBytes).digest('hex');

describe('public/resume.pdf', () => {
  it('was printed from the current resume.md (its Subject carries the hash)', async () => {
    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getSubject()).toBe(`${RESUME_HASH_PREFIX}${fileHash}`);
  });

  it('is a real PDF with at least one page', async () => {
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toMatch(/Brennan Neilson/);
  });
});

describe('the hash the page and the script agree on', () => {
  it('sha256Hex of the decoded text equals the hash of the file bytes', async () => {
    expect(await sha256Hex(mdBytes.toString('utf8'))).toBe(fileHash);
  });

  it('resumeSubject prefixes the hex', () => {
    expect(resumeSubject('ab12')).toBe('sha256:ab12');
  });
});
