import type { Page } from '@playwright/test';
import { expect, projectFor, test } from './fixtures.ts';

// Claim: click through 12 live demo websites without signing up. Custom builds from $500.
const { url } = projectFor('brennan-builds');
const DEMOS = 12;

/**
 * Scroll the page top to bottom so lazy images and link prefetches load, then give the network a
 * moment, so the guard sees errors that only show up after the first screen.
 */
async function browseLikeAVisitor(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  // Best effort: a demo that keeps a connection open never goes idle, and that's not a failure.
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
}

test.describe('brennan-builds', () => {
  test('the gallery links exactly 12 live demos, each open without a sign-in wall', async ({ page }) => {
    test.setTimeout(240_000);
    // The demo gallery is the site's own source of truth for which demos exist.
    await page.goto(`${url}/templates`);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((links, origin) =>
        links
          .map((a) => new URL((a as HTMLAnchorElement).href))
          .filter((u) => u.origin === origin && /^\/preview\/[a-z0-9-]+\/?$/.test(u.pathname))
          .map((u) => `${u.origin}${u.pathname.replace(/\/$/, '')}`),
        new URL(url).origin,
      );
    const demos = [...new Set(hrefs)].sort();
    expect(demos, 'demos linked from /templates').toHaveLength(DEMOS);

    for (const demo of demos) {
      await test.step(demo, async () => {
        const res = await page.goto(demo);
        expect(res?.status(), demo).toBeLessThan(400);
        expect(new URL(page.url()).pathname, 'stays on the demo, no redirect to a login').toMatch(
          new RegExp(`^${new URL(demo).pathname}(/|$)`),
        );
        // A real site rendered, not an empty shell.
        await expect(page.getByRole('heading').first()).toBeVisible();
        await expect(page.locator('input[type="password"]:visible'), 'no sign-in form').toHaveCount(0);
        await expect(page.getByRole('dialog'), 'no modal gate').toHaveCount(0);
        await browseLikeAVisitor(page);
      });
    }
  });

  test('custom builds start at $500 on the pricing page', async ({ page }) => {
    await page.goto(`${url}/pricing`);
    await expect(page.getByText(/\$500(?!\d|,\d)/).first()).toBeVisible();
  });
});
