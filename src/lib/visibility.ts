import type { Project, Stat, Stats, TruthResults, VisibleProject } from '../content/types.ts';

export const VERIFIED_MAX_AGE_MS = 48 * 3600_000;
export const STAT_MAX_AGE_MS = 7 * 24 * 3600_000;
export const FUTURE_TOLERANCE_MS = 3600_000;

/** True when `iso` parses, is at most `maxAgeMs` old, and is not more than 1h in the future. */
export function isFresh(iso: string, maxAgeMs: number, now: Date): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age <= maxAgeMs && age >= -FUTURE_TOLERANCE_MS;
}

/** Projects whose claim passed a fresh walk of the same claim text, in `projects` order. */
export function visibleProjects(
  projects: Project[],
  truth: TruthResults | null,
  now: Date,
): VisibleProject[] {
  if (!truth) return [];
  const bySlug = new Map(truth.results.map((r) => [r.slug, r]));
  const out: VisibleProject[] = [];
  for (const p of projects) {
    const r = bySlug.get(p.slug);
    if (!r || r.status !== 'pass' || r.claim !== p.claim) continue;
    if (!isFresh(r.finishedAt, VERIFIED_MAX_AGE_MS, now)) continue;
    out.push({ ...p, verifiedAt: r.finishedAt, runUrl: r.runUrl });
  }
  return out;
}

export function visibleStats(stats: Stats | null, now: Date): Stat[] {
  if (!stats) return [];
  return stats.stats.filter((s) => isFresh(s.asOf, STAT_MAX_AGE_MS, now));
}
