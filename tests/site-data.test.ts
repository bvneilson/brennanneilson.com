import { describe, expect, it, vi } from 'vitest';
import { fetchStats, fetchTruthResults, STATS_URL, TRUTH_URL } from '../src/lib/site-data.ts';

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const asFetch = (fn: (...a: Parameters<typeof fetch>) => Promise<Response>) =>
  vi.fn(fn) as unknown as typeof fetch & ReturnType<typeof vi.fn>;

const truth = {
  schemaVersion: 1,
  generatedAt: '2026-11-22T12:00:00.000Z',
  runUrl: 'https://github.com/x/y/actions/runs/1',
  results: [],
};
const stats = {
  schemaVersion: 1,
  generatedAt: '2026-11-22T12:00:00.000Z',
  stats: [{ metric: 'm', label: 'M', value: 1, asOf: '2026-11-22T12:00:00.000Z', source: 's' }],
};

const cases = [
  { name: 'fetchTruthResults', run: fetchTruthResults, url: TRUTH_URL, good: truth },
  { name: 'fetchStats', run: fetchStats, url: STATS_URL, good: stats },
] as const;

describe('URLs', () => {
  it('point at the public data branches', () => {
    expect(TRUTH_URL).toBe(
      'https://raw.githubusercontent.com/bvneilson/brennanneilson.com/truth-results/results.json',
    );
    expect(STATS_URL).toBe(
      'https://raw.githubusercontent.com/bvneilson/brennanneilson.com/site-stats/stats.json',
    );
  });
});

for (const c of cases) {
  describe(c.name, () => {
    it('returns the parsed object for a valid body, requesting the right URL with revalidate', async () => {
      const f = asFetch(async () => okJson(c.good));
      expect(await c.run(f)).toEqual(c.good);
      expect(f).toHaveBeenCalledWith(c.url, { next: { revalidate: 3600 } });
    });
    it('returns null on 404', async () => {
      expect(await c.run(asFetch(async () => new Response('nope', { status: 404 })))).toBeNull();
    });
    it('returns null when fetch throws', async () => {
      const f = asFetch(async () => {
        throw new Error('network down');
      });
      expect(await c.run(f)).toBeNull();
    });
    it('returns null on non-JSON', async () => {
      expect(await c.run(asFetch(async () => new Response('<html>', { status: 200 })))).toBeNull();
    });
    it('returns null for schemaVersion 2', async () => {
      expect(await c.run(asFetch(async () => okJson({ ...c.good, schemaVersion: 2 })))).toBeNull();
    });
    it('returns null for valid JSON failing the schema another way', async () => {
      const { results: _r, stats: _s, ...bad } = c.good as Record<string, unknown>;
      expect(await c.run(asFetch(async () => okJson(bad)))).toBeNull();
    });
  });
}
