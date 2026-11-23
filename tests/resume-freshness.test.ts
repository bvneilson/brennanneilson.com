import { describe, expect, it } from 'vitest';
import { resumeFreshness } from '../src/lib/resume-freshness.ts';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const DAY = 24 * 3600_000;
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

describe('resumeFreshness', () => {
  it('89d is current', () => expect(resumeFreshness(ago(89), NOW)).toBe('current'));
  it('90d is review-due', () => expect(resumeFreshness(ago(90), NOW)).toBe('review-due'));
  it('119d is review-due', () => expect(resumeFreshness(ago(119), NOW)).toBe('review-due'));
  it('120d is hidden', () => expect(resumeFreshness(ago(120), NOW)).toBe('hidden'));
  it('invalid date is hidden', () => expect(resumeFreshness('garbage', NOW)).toBe('hidden'));
});
