import type { Page } from '@playwright/test';
import { expect, SITE_URL, test } from './fixtures.ts';

// The self-walk: every link on this site works and nothing errors (the guard fails the walk on any
// console error or failed request). The resume PDF check joins when the PDF exists (Task 9, R4).

/** Hosts that answer bots with 999/403. Their links must be well-formed https, and nothing more. */
const BOT_BLOCKING_HOSTS = ['linkedin.com', 'www.linkedin.com'];

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
    expect(pages.length).toBeGreaterThanOrEqual(1);
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
