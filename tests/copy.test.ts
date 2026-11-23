import { describe, expect, it } from 'vitest';
import { copy } from '../src/content/copy.ts';
import { copyStrings } from '../scripts/copy-text.ts';

describe('copy', () => {
  const strings = copyStrings(copy);

  it('collects every string in the copy module', () => {
    expect(strings.length).toBeGreaterThan(20);
    expect(strings).toContain(copy.hero.headline);
  });

  // The voice gate on this machine is the real check. These are the cheap mechanical parts of it,
  // so CI catches a regression too.
  it.each(strings)('%s has no em dash and no semicolon', (s) => {
    expect(s).not.toMatch(/[—;]/);
  });

  it('never says "hire me" or "open to work"', () => {
    const all = strings.join('\n').toLowerCase();
    expect(all).not.toContain('hire me');
    expect(all).not.toContain('open to work');
  });
});
