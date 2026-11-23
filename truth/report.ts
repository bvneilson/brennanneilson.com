// Turns Playwright's JSON report into the public TruthResults file.
// Runs under plain `node` (R3): relative `.ts` imports and erasable syntax only.
//
//   RUN_URL=<actions run url> node truth/report.ts truth/out/report.json > truth/out/results.json

import { readFileSync } from 'node:fs';
import { projects as v1Projects } from '../src/content/projects.ts';
import type { ClaimResult, Project, TruthResults } from '../src/content/types.ts';

/** The self-walk's slug. It is not a Project, so it is appended to every result set. */
export const SITE_SLUG = 'site';
// Only what site.spec proves today (R15). Task 9 adds the resume PDF clause with its assertion.
export const SITE_CLAIM = 'This site: every link works and nothing errors.';

/** Playwright project names. A claim must pass in every one of them. */
const VIEWPORTS = ['desktop', 'mobile'];

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** slug -> viewport -> final status of each test (its last attempt, so retries count). */
type Outcomes = Map<string, Map<string, string[]>>;

function record(out: Outcomes, slug: string, test: unknown): void {
  if (!isRec(test) || typeof test.projectName !== 'string') return;
  const last = list(test.results).at(-1);
  const status = isRec(last) && typeof last.status === 'string' ? last.status : 'no-result';
  const byViewport = out.get(slug) ?? new Map<string, string[]>();
  out.set(slug, byViewport);
  byViewport.set(test.projectName, [...(byViewport.get(test.projectName) ?? []), status]);
}

/** Every test under `suite` belongs to `slug`, however deeply its describes nest. */
function collectSuite(out: Outcomes, slug: string, suite: unknown): void {
  if (!isRec(suite)) return;
  for (const spec of list(suite.specs)) if (isRec(spec)) for (const test of list(spec.tests)) record(out, slug, test);
  for (const child of list(suite.suites)) collectSuite(out, slug, child);
}

/**
 * Top-level suites are files. A file's top-level `test.describe` title is the slug.
 * Tests outside a describe belong to no slug and are ignored.
 */
function collect(report: unknown): Outcomes {
  const out: Outcomes = new Map();
  if (!isRec(report)) return out;
  for (const fileSuite of list(report.suites)) {
    if (!isRec(fileSuite)) continue;
    for (const describe of list(fileSuite.suites)) {
      if (isRec(describe) && typeof describe.title === 'string') collectSuite(out, describe.title, describe);
    }
  }
  return out;
}

/** Pass only if, in every viewport, at least one test ran and every test's final attempt passed. */
function passed(byViewport: Map<string, string[]> | undefined): boolean {
  return VIEWPORTS.every((vp) => {
    const statuses = byViewport?.get(vp) ?? [];
    return statuses.length > 0 && statuses.every((s) => s === 'passed');
  });
}

export function toTruthResults(report: unknown, projects: Project[], runUrl: string, now: Date): TruthResults {
  const outcomes = collect(report);
  const finishedAt = now.toISOString();
  const result = (slug: string, claim: string): ClaimResult => ({
    slug,
    claim,
    status: passed(outcomes.get(slug)) ? 'pass' : 'fail',
    finishedAt,
    runUrl,
  });
  return {
    schemaVersion: 1,
    generatedAt: finishedAt,
    runUrl,
    results: [...projects.map((p) => result(p.slug, p.claim)), result(SITE_SLUG, SITE_CLAIM)],
  };
}

if (import.meta.main) {
  const file = process.argv[2];
  const runUrl = process.env.RUN_URL;
  if (!file || !runUrl) {
    console.error('usage: RUN_URL=<run url> node truth/report.ts <playwright report.json>');
    process.exit(2);
  }
  const report: unknown = JSON.parse(readFileSync(file, 'utf8'));
  process.stdout.write(`${JSON.stringify(toTruthResults(report, v1Projects, runUrl, new Date()), null, 2)}\n`);
}
