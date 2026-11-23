import { describe, expect, it } from 'vitest';
import { formatCount, shortDate, timeAgo, utcStamp } from '../src/lib/format.ts';

const NOW = new Date('2026-11-23T15:00:00.000Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;

describe('format', () => {
  it.each([
    [ago(-5 * MIN), 'just now'],
    [ago(30_000), 'just now'],
    [ago(MIN), '1 minute ago'],
    [ago(59 * MIN), '59 minutes ago'],
    [ago(60 * MIN), '1 hour ago'],
    [ago(47 * 60 * MIN), '47 hours ago'],
    [ago(48 * 60 * MIN), '2 days ago'],
    ['not a date', 'just now'],
  ])('timeAgo(%s) is "%s"', (iso, want) => {
    expect(timeAgo(iso, NOW)).toBe(want);
  });

  it('prints dates in UTC, whatever the server zone', () => {
    expect(shortDate('2026-11-24T02:00:00.000Z')).toBe('Nov 24');
    expect(utcStamp('2026-11-24T00:05:00.000Z')).toBe('Nov 24, 2026, 00:05 UTC');
    expect(formatCount(1059)).toBe('1,059');
  });
});
