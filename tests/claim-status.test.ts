import { describe, expect, it } from 'vitest';
import type { Project, TruthResults } from '../src/content/types.ts';
import { claimRows } from '../src/lib/claim-status.ts';
import { visibleProjects } from '../src/lib/visibility.ts';

const NOW = new Date('2026-11-23T15:00:00.000Z');
const HOUR = 3600_000;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const project = (slug: string): Project => ({ slug, name: slug, url: `https://${slug}.example.com`, claim: `claim ${slug}`, tags: [] });
const result = (slug: string, over: Partial<TruthResults['results'][number]> = {}) => ({
  slug,
  claim: `claim ${slug}`,
  status: 'pass' as const,
  finishedAt: ago(2 * HOUR),
  runUrl: `https://github.com/x/y/actions/runs/${slug}`,
  ...over,
});

const subjects = ['ok', 'failing', 'old', 'reworded', 'future', 'absent'].map(project);
const truth: TruthResults = {
  schemaVersion: 1,
  generatedAt: ago(2 * HOUR),
  runUrl: 'https://github.com/x/y/actions/runs/1',
  results: [
    result('ok'),
    result('failing', { status: 'fail' }),
    result('old', { finishedAt: ago(49 * HOUR) }),
    result('reworded', { claim: 'an older sentence' }),
    result('future', { finishedAt: new Date(NOW.getTime() + 2 * HOUR).toISOString() }),
  ],
};

describe('claimRows', () => {
  const rows = claimRows(subjects, truth, NOW);
  const status = Object.fromEntries(rows.map((r) => [r.slug, r.status]));

  it('labels each case', () => {
    expect(status).toEqual({ ok: 'pass', failing: 'fail', old: 'stale', reworded: 'stale', future: 'stale', absent: 'missing' });
  });

  it("calls exactly the projects home shows 'pass', so the two pages never disagree", () => {
    const shown = visibleProjects(subjects, truth, NOW).map((p) => p.slug);
    expect(rows.filter((r) => r.status === 'pass').map((r) => r.slug)).toEqual(shown);
  });

  it('shows the sentence the walk proved, and no run for a missing result', () => {
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    expect(bySlug.get('reworded')?.testedClaim).toBe('an older sentence');
    expect(bySlug.get('absent')).toMatchObject({ testedClaim: 'claim absent', finishedAt: null, runUrl: null });
  });
});
