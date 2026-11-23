import { StatsSchema, TruthResultsSchema } from '../content/types.ts';
import type { Stats, TruthResults } from '../content/types.ts';

const BASE = 'https://raw.githubusercontent.com/bvneilson/brennanneilson.com';
export const TRUTH_URL = `${BASE}/truth-results/results.json`;
export const STATS_URL = `${BASE}/site-stats/stats.json`;

const REVALIDATE_SECONDS = 3600;

/** Fetch and validate a published JSON file. Any failure yields null, never a throw, and never logs the body. */
async function fetchValidated<T>(
  url: string,
  parse: (raw: unknown) => T | null,
  fetchFn: typeof fetch,
): Promise<T | null> {
  try {
    const res = await fetchFn(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return parse(await res.json());
  } catch {
    return null;
  }
}

export function fetchTruthResults(fetchFn: typeof fetch = fetch): Promise<TruthResults | null> {
  return fetchValidated(
    TRUTH_URL,
    (raw) => {
      const r = TruthResultsSchema.safeParse(raw);
      return r.success ? r.data : null;
    },
    fetchFn,
  );
}

export function fetchStats(fetchFn: typeof fetch = fetch): Promise<Stats | null> {
  return fetchValidated(
    STATS_URL,
    (raw) => {
      const r = StatsSchema.safeParse(raw);
      return r.success ? r.data : null;
    },
    fetchFn,
  );
}
