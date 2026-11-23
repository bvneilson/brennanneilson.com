import { describe, expect, it } from 'vitest';
import {
  isFresh,
  visibleProjects,
  visibleStats,
  VERIFIED_MAX_AGE_MS,
  STAT_MAX_AGE_MS,
} from '../src/lib/visibility.ts';
import type { Project, Stats, TruthResults } from '../src/content/types.ts';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const project = (slug: string, claim = `claim ${slug}`): Project => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  claim,
  tags: [],
});

const truth = (results: TruthResults['results']): TruthResults => ({
  schemaVersion: 1,
  generatedAt: ago(0),
  runUrl: 'https://github.com/x/y/actions/runs/1',
  results,
});

const result = (
  slug: string,
  over: Partial<TruthResults['results'][number]> = {},
): TruthResults['results'][number] => ({
  slug,
  claim: `claim ${slug}`,
  status: 'pass',
  finishedAt: ago(1 * HOUR),
  runUrl: `https://github.com/x/y/actions/runs/${slug}`,
  ...over,
});

describe('isFresh', () => {
  it('is false for an unparseable date', () => {
    expect(isFresh('not-a-date', VERIFIED_MAX_AGE_MS, NOW)).toBe(false);
  });
  it('is false for a timestamp more than 1h in the future', () => {
    const iso = new Date(NOW.getTime() + HOUR + 60_000).toISOString();
    expect(isFresh(iso, VERIFIED_MAX_AGE_MS, NOW)).toBe(false);
  });
  it('is true for a timestamp 30min in the future', () => {
    const iso = new Date(NOW.getTime() + 30 * 60_000).toISOString();
    expect(isFresh(iso, VERIFIED_MAX_AGE_MS, NOW)).toBe(true);
  });
});

describe('visibleProjects', () => {
  it('shows a passing project verified 47h ago, with verifiedAt and runUrl', () => {
    const t = truth([result('a', { finishedAt: ago(47 * HOUR) })]);
    const out = visibleProjects([project('a')], t, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].verifiedAt).toBe(ago(47 * HOUR));
    expect(out[0].runUrl).toBe('https://github.com/x/y/actions/runs/a');
  });
  it('hides a project verified 49h ago', () => {
    const t = truth([result('a', { finishedAt: ago(49 * HOUR) })]);
    expect(visibleProjects([project('a')], t, NOW)).toEqual([]);
  });
  it('hides a failing project', () => {
    const t = truth([result('a', { status: 'fail' })]);
    expect(visibleProjects([project('a')], t, NOW)).toEqual([]);
  });
  it('hides a project with no result for its slug', () => {
    const t = truth([result('other')]);
    expect(visibleProjects([project('a')], t, NOW)).toEqual([]);
  });
  it('hides everything when truth is null', () => {
    expect(visibleProjects([project('a')], null, NOW)).toEqual([]);
  });
  it('hides a project whose claim text changed since the walk', () => {
    const t = truth([result('a', { claim: 'old claim' })]);
    expect(visibleProjects([project('a', 'new claim')], t, NOW)).toEqual([]);
  });
  it('keeps projects order', () => {
    const t = truth([result('c'), result('a'), result('b')]);
    const out = visibleProjects([project('a'), project('b'), project('c')], t, NOW);
    expect(out.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
  });
});

describe('visibleStats', () => {
  const stats = (asOf: string): Stats => ({
    schemaVersion: 1,
    generatedAt: ago(0),
    stats: [{ metric: 'm', label: 'M', value: 1, asOf, source: 's' }],
  });
  it('returns [] for null', () => {
    expect(visibleStats(null, NOW)).toEqual([]);
  });
  it('hides a stat at 7d + 1min', () => {
    expect(visibleStats(stats(ago(STAT_MAX_AGE_MS + 60_000)), NOW)).toEqual([]);
  });
  it('shows a stat at 6d 23h', () => {
    expect(visibleStats(stats(ago(6 * DAY + 23 * HOUR)), NOW)).toHaveLength(1);
  });
});
