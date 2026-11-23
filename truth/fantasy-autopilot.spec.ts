import { expect, projectFor, test } from './fixtures.ts';

// Claim: free fantasy-football guides plus a $49 playbook kit for running your team with your own
// AI agent.
//
// Never submit the start-or-sit or bye-week checkers or the reminders signup. Each writes a
// production row. The guard blocks their POSTs, and this walk doesn't claim them.
const { url } = projectFor('fantasy-autopilot');

test.describe('fantasy-autopilot', () => {
  test('the guides index lists free guides, and every guide opens', async ({ page }) => {
    await page.goto(`${url}/guides`);
    const hrefs = await page
      .locator('main a[href]')
      .evaluateAll((links, origin) =>
        links
          .map((a) => (a as HTMLAnchorElement).href.split('#')[0])
          .filter((href) => href.startsWith(`${origin}/guides/`)),
        new URL(url).origin,
      );
    const guides = [...new Set(hrefs)];
    expect(guides.length, 'guides listed on /guides').toBeGreaterThanOrEqual(1);

    for (const guide of guides) {
      await test.step(guide, async () => {
        const res = await page.goto(guide);
        expect(res?.status(), guide).toBeLessThan(400);
        expect(page.url(), 'no redirect away from the guide').toBe(guide);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // A real article, not a stub or a paywall teaser.
        const words = (await page.locator('main').innerText()).split(/\s+/).length;
        expect(words, `words in ${guide}`).toBeGreaterThan(300);
      });
    }
  });

  test('the kit is $49, and Buy the kit lands on Stripe Checkout at $49.00', async ({ page }) => {
    await page.goto(`${url}/kit`);
    await expect(page.getByText(/\$49(?!\d|[.,]\d)/).first()).toBeVisible();

    await page.getByRole('checkbox', { name: /what I need to bring/i }).check();
    await page.getByRole('button', { name: 'Buy the kit' }).click();

    // Stop on Stripe's page. Never fill in payment details.
    await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//);
    await expect(page.getByText('$49.00').first()).toBeVisible();
  });
});
