import { expect, isAnalytics, projectFor, test } from './fixtures.ts';

// Claim: add names, group households, pass one phone around. Everyone draws a Secret Santa name,
// and nobody gets themselves, their partner, or a swap. It all runs in the browser.
const { url } = projectFor('draw-night');

// Six people in two households of three.
const HOUSEHOLD: Record<string, string> = {
  Avery: 'A',
  Blake: 'A',
  Casey: 'A',
  Drew: 'B',
  Emery: 'B',
  Finley: 'B',
};
const NAMES = Object.keys(HOUSEHOLD);
const DRAWS = 5;

test.describe('draw-night', () => {
  for (let draw = 1; draw <= DRAWS; draw++) {
    test(`pass-the-phone draw ${draw} of ${DRAWS}: 6 people, 2 households, no self, partner or swap`, async ({
      page,
    }) => {
      // The claim is client-side, so the draw must not even try to write anywhere. Counted apart
      // from the guard (which would block the write) because an attempt alone breaks the claim.
      const writes: string[] = [];
      page.context().on('request', (req) => {
        if (req.method() !== 'GET' && !isAnalytics(req.url())) writes.push(`${req.method()} ${req.url()}`);
      });

      await page.goto(`${url}/live`);
      const addPerson = page.getByLabel('Add a person');
      for (const name of NAMES) {
        await addPerson.fill(name);
        await page.getByRole('button', { name: 'Add', exact: true }).click();
      }
      for (const name of NAMES) {
        const lead = NAMES.find((n) => HOUSEHOLD[n] === HOUSEHOLD[name]);
        if (lead === name) continue;
        await page.getByLabel(`Household for ${name}`).selectOption({ label: `Same household as ${lead}` });
      }
      await page.getByLabel('Host PIN').fill('4321');
      await page.getByRole('button', { name: 'Start the draw' }).click();

      // Pass the phone: each person taps their name, draws from the hat, reads the slip, hides it.
      const drew: Record<string, string> = {};
      for (let turn = 0; turn < NAMES.length; turn++) {
        const me = page.getByRole('button', { name: /let me draw!$/ });
        const label = (await me.textContent()) ?? '';
        const giver = label.match(/I.m (.+), let me draw!/)?.[1];
        expect(giver, `turn button "${label}"`).toBeTruthy();
        await me.click();
        await page.getByRole('button', { name: 'Tap the hat to draw a name' }).click();
        const slip = page.locator('[data-slip-recipient]');
        await expect(slip).toHaveText(new RegExp(`^\\s*(${NAMES.join('|')})\\s*$`));
        drew[giver as string] = ((await slip.textContent()) ?? '').trim();
        await page.getByRole('button', { name: 'Got it, hide it' }).click();
      }
      await expect(page.getByRole('heading', { name: 'Everyone has drawn!' })).toBeVisible();

      // Everyone drew exactly once, and everyone was drawn exactly once.
      expect(Object.keys(drew).sort()).toEqual([...NAMES].sort());
      expect(Object.values(drew).sort()).toEqual([...NAMES].sort());
      const broken = Object.entries(drew).filter(
        ([giver, gets]) => gets === giver || HOUSEHOLD[gets] === HOUSEHOLD[giver] || drew[gets] === giver,
      );
      expect(broken, `self, same-household or swap pairs in ${JSON.stringify(drew)}`).toEqual([]);
      expect(writes, 'non-GET requests attempted').toEqual([]);
    });
  }
});
