import type { Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { expect, SITE_URL, test } from './fixtures.ts';

// The self-walk, one test per clause of SITE_CLAIM: every link works, the resume PDF downloads,
// and nothing errors. "Nothing errors" is the guard in fixtures.ts, which fails a walk on any
// console error, uncaught exception or failed request on this site, at both viewports.

/** Hosts that answer bots with 999/403. Their links must be well-formed https, and nothing more. */
const BOT_BLOCKING_HOSTS = ['linkedin.com', 'www.linkedin.com'];

/**
 * Every page the site has. The crawl must reach each one, so a page that loses its last link
 * can't silently drop out of the "nothing errors" check.
 */
const PAGES = ['/', '/coo', '/resume', '/verified'];

const origin = new URL(SITE_URL).origin;

/** Every page reachable from the home page, plus every outbound link found on them. */
async function crawl(page: Page): Promise<{ pages: string[]; outbound: string[] }> {
  const pages: string[] = [];
  const outbound = new Set<string>();
  const queue = [`${origin}/`];
  const seen = new Set(queue);
  while (queue.length) {
    const url = queue.shift() as string;
    const res = await page.request.get(url);
    expect.soft(res.status(), url).toBeLessThan(400);
    pages.push(url);
    // Files (a PDF, an image) only need to resolve. Pages are opened in the browser.
    if (!(res.headers()['content-type'] ?? '').includes('text/html')) continue;
    const nav = await page.goto(url);
    expect.soft(nav?.status(), url).toBeLessThan(400);
    // Let hydration, effects and link prefetches finish here, so an error they raise lands on this
    // page's walk instead of being cut off by the next navigation.
    await page.waitForLoadState('networkidle');

    // Against the layout viewport (clientWidth). Mobile Chrome zooms out to fit wide content, so
    // innerWidth grows with the overflow and would hide it.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect.soft(overflow, `horizontal overflow (px) on ${url}`).toBeLessThanOrEqual(0);

    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const u = new URL(href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
      u.hash = '';
      if (u.origin !== origin) outbound.add(u.href);
      else if (!seen.has(u.href)) {
        seen.add(u.href);
        queue.push(u.href);
      }
    }
  }
  return { pages, outbound: [...outbound].sort() };
}

test.describe('site', () => {
  test('every internal link works, with no errors and no horizontal overflow', async ({ page }) => {
    const { pages } = await crawl(page);
    expect(pages).toEqual(expect.arrayContaining(PAGES.map((p) => `${origin}${p}`)));
  });

  test('the resume PDF downloads', async ({ page }) => {
    const res = await page.request.get(`${origin}/resume.pdf`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    const body = await res.body();
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // A real PDF with pages, printed from the resume (scripts/resume-pdf.ts stamps the source hash).
    const pdf = await PDFDocument.load(body);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getSubject()).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test('every outbound link resolves', async ({ page }) => {
    const { outbound } = await crawl(page);
    for (const link of outbound) {
      const u = new URL(link);
      if (BOT_BLOCKING_HOSTS.includes(u.hostname)) {
        expect.soft(u.protocol, `${link} must be https`).toBe('https:');
        continue;
      }
      const res = await page.request.get(link, { timeout: 30_000 });
      expect.soft(res.status(), link).toBeLessThan(400);
    }
  });
});
