import type { Page } from '@playwright/test';
import { expect, projectFor, test } from './fixtures.ts';

// Claim: answer three questions about your swing and get a shaft flex, weight and kick-point
// recommendation, no account needed.
const { url } = projectFor('golf-toolbox');
const FITTING = `${url}/club-fitting`;

/** No account needed: still on the fitting page, signed out, with no login form or modal in the way. */
async function expectNoSignInWall(page: Page): Promise<void> {
  await expect(page).toHaveURL((u) => `${u.origin}${u.pathname}` === FITTING);
  await expect(page.locator('input[type="password"]:visible'), 'no sign-in form').toHaveCount(0);
  await expect(page.getByRole('dialog'), 'no modal gate').toHaveCount(0);
}

/** The text of the result tile whose label is `label`, one line per paragraph. */
const tile = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('xpath=..').innerText();

test.describe('golf-toolbox', () => {
  test('three answers give a shaft flex, weight and kick point, signed out', async ({ page }) => {
    await page.goto(FITTING);
    await expectNoSignInWall(page);

    // 1 of 3: swing speed.
    await page.getByLabel('Driver Swing Speed (mph)').fill('95');
    await page.getByLabel('Iron Swing Speed (mph)').fill('82');
    await page.getByRole('button', { name: 'Next' }).click();

    // 2 of 3: tempo and miss.
    await page.getByRole('radio', { name: /^Medium/ }).click();
    await page.getByRole('radio', { name: /^Straight/ }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // 3 of 3: skill and budget.
    await page.getByLabel('Skill Level').selectOption({ label: 'Intermediate (20-30 handicap)' });
    await page.getByLabel('Maximum Budget per Club ($)').selectOption({ label: 'Up to $500' });
    await page.getByRole('button', { name: 'Get Recommendations' }).click();

    await expect(page.getByText('Recommended Flex', { exact: true })).toBeVisible();
    expect(await tile(page, 'Recommended Flex')).toMatch(
      /^Recommended Flex\s+\S+\s+(Ladies|Senior|Amateur|Regular|Stiff|Extra Stiff|Tour Extra Stiff)\s*$/i,
    );
    expect(await tile(page, 'Shaft Weight')).toMatch(/^Shaft Weight\s+\d{2,3}(\s*[-–]\s*\d{2,3})?\s*g\b/);
    expect(await tile(page, 'Kick Point')).toMatch(/^Kick Point\s+(Low|Mid|Medium|High)(-(Low|Mid|High))?\b/i);
    await expectNoSignInWall(page);
  });
});
