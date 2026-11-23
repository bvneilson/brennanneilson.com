// Prints /resume to public/resume.pdf and stamps its Subject with the hash of the resume.md it
// came from, so tests/resume-pdf.test.ts fails the moment the PDF and the resume drift apart.
// Runs under plain `node` (R3): relative `.ts` imports and erasable syntax only.
//
//   npm run build && npm start        # in one shell
//   npm run resume:pdf                # in another (RESUME_BASE_URL defaults to http://localhost:3000)
//
// It refuses to print when the running server rendered a different resume.md than the one on disk
// (a server started before an edit), or when /resume shows no resume (hidden after 120 days). The
// first would stamp old content with the new hash, the second would print the "refreshed" note.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { resumeSubject } from '../src/lib/resume.ts';

const SOURCE = fileURLToPath(new URL('../src/content/resume.md', import.meta.url));
const OUT = fileURLToPath(new URL('../public/resume.pdf', import.meta.url));
const TITLE = 'Brennan Neilson, Resume';
const AUTHOR = 'Brennan Neilson';

/** Sets the Subject (the source hash), Title and Author on a printed PDF. */
async function stampPdf(printed: Uint8Array, hex: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(printed);
  pdf.setSubject(resumeSubject(hex));
  pdf.setTitle(TITLE);
  pdf.setAuthor(AUTHOR);
  return pdf.save();
}

async function main(): Promise<void> {
  const base = (process.env.RESUME_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const hex = createHash('sha256').update(readFileSync(SOURCE)).digest('hex');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ colorScheme: 'light' });
    const res = await page.goto(`${base}/resume`, { waitUntil: 'networkidle' });
    if (!res?.ok()) throw new Error(`${base}/resume answered ${res?.status() ?? 'nothing'}. Is \`npm start\` running?`);

    const served = await page.locator('[data-resume-sha256]').getAttribute('data-resume-sha256', { timeout: 5_000 }).catch(() => null);
    if (served === null) throw new Error(`${base}/resume shows no resume (hidden after 120 days?). Nothing printed.`);
    if (served !== hex) {
      throw new Error(
        `${base}/resume rendered resume.md sha256:${served}, but the file on disk is sha256:${hex}. ` +
          'Rebuild and restart the server (npm run build && npm start), then run this again.',
      );
    }
    // The address is assembled in the browser after hydration. Print only once it's there.
    await page.locator('a[href^="mailto:"]').waitFor({ timeout: 10_000 });
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    const printed = await page.pdf({ preferCSSPageSize: true, printBackground: true });

    const stamped = await stampPdf(printed, hex);
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, stamped);
    const pages = (await PDFDocument.load(stamped)).getPageCount();
    console.log(`public/resume.pdf: ${pages} page(s), ${stamped.length} bytes, Subject ${resumeSubject(hex)}`);
  } finally {
    await browser.close();
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
