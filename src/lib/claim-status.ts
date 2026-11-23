import type { TruthResults } from '../content/types.ts';
import { isFresh, VERIFIED_MAX_AGE_MS } from './visibility.ts';

/**
 * pass: a fresh pass of today's claim wording, so the home card shows.
 * stale: a pass that is too old, or that proved an older wording. The card hides.
 * fail: the latest walk failed. The card hides.
 * missing: the results file has no entry for it yet.
 */
export type ClaimStatus = 'pass' | 'fail' | 'stale' | 'missing';

/** Something the site claims: a project, or the site itself. */
export type ClaimSubject = { slug: string; name: string; url?: string; claim: string };

export type ClaimRow = ClaimSubject & {
  status: ClaimStatus;
  /** The sentence the walk proved. It differs from `claim` only when the wording changed since. */
  testedClaim: string;
  finishedAt: string | null;
  runUrl: string | null;
};

/** One row per subject, in subject order. 'pass' here matches exactly when visibleProjects shows the card. */
export function claimRows(subjects: ClaimSubject[], truth: TruthResults, now: Date): ClaimRow[] {
  const bySlug = new Map(truth.results.map((r) => [r.slug, r]));
  return subjects.map((s) => {
    const r = bySlug.get(s.slug);
    if (!r) return { ...s, status: 'missing', testedClaim: s.claim, finishedAt: null, runUrl: null };
    let status: ClaimStatus = 'pass';
    if (r.status !== 'pass') status = 'fail';
    else if (r.claim !== s.claim || !isFresh(r.finishedAt, VERIFIED_MAX_AGE_MS, now)) status = 'stale';
    return { ...s, status, testedClaim: r.claim, finishedAt: r.finishedAt, runUrl: r.runUrl };
  });
}
