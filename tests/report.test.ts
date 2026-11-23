import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_CLAIM, SITE_SLUG, toTruthResults } from '../truth/report.ts';
import { projects } from '../src/content/projects.ts';
import { ProjectSchema, TruthResultsSchema, type Project } from '../src/content/types.ts';

const NOW = new Date('2026-11-23T09:40:00.000Z');
const RUN = 'https://github.com/bvneilson/brennanneilson.com/actions/runs/42';

const project = (slug: string): Project => ({
  slug,
  name: slug,
  url: `https://${slug}.example.com`,
  claim: `claim for ${slug}`,
  tags: [],
});
const PROJECTS = [project('alpha'), project('beta')];

// Hand-built fragments shaped like Playwright's JSON reporter output (JSONReport in
// playwright/types/testReporter.d.ts). Only the fields report.ts reads matter, but the shape is real.
type Status = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
const run = (projectName: string, ...attempts: Status[]) => ({
  projectName,
  projectId: projectName,
  expectedStatus: attempts[0] === 'skipped' ? 'skipped' : 'passed',
  timeout: 60_000,
  annotations: [],
  status: 'expected',
  results: attempts.map((status, retry) => ({ status, retry, errors: [] })),
});
const both = (...attempts: Status[]) => [run('desktop', ...attempts), run('mobile', ...attempts)];
const spec = (title: string, tests: unknown[]) => ({ title, ok: true, tags: [], tests });
const group = (title: string, specs: unknown[], suites: unknown[] = []) => ({ title, specs, suites });
const file = (name: string, suites: unknown[], specs: unknown[] = []) => ({ title: name, file: name, specs, suites });
const report = (...files: unknown[]) => ({ config: {}, suites: files, errors: [], stats: {} });

/** A file `<slug>.spec.ts` whose describe is `<slug>` with the given specs. */
const walk = (slug: string, ...specs: unknown[]) => file(`${slug}.spec.ts`, [group(slug, specs)]);

const statusOf = (r: ReturnType<typeof toTruthResults>, slug: string) =>
  r.results.find((x) => x.slug === slug)?.status;

describe('toTruthResults', () => {
  it('passes a project whose every test passed in both desktop and mobile', () => {
    const r = toTruthResults(
      report(walk('alpha', spec('one', both('passed')), spec('two', both('passed')))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('pass');
  });

  it('counts a test that failed and then passed on retry as passed', () => {
    const r = toTruthResults(report(walk('alpha', spec('one', both('failed', 'passed')))), PROJECTS, RUN, NOW);
    expect(statusOf(r, 'alpha')).toBe('pass');
  });

  it('fails a test that failed on every attempt', () => {
    const r = toTruthResults(
      report(walk('alpha', spec('one', both('passed')), spec('two', both('failed', 'failed')))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('fail in either viewport fails the project (mobile only)', () => {
    const r = toTruthResults(
      report(walk('alpha', spec('one', [run('desktop', 'passed'), run('mobile', 'failed', 'failed')]))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('fail in either viewport fails the project (desktop only)', () => {
    const r = toTruthResults(
      report(walk('alpha', spec('one', [run('desktop', 'timedOut', 'timedOut'), run('mobile', 'passed')]))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('fails a project that only ran in one viewport', () => {
    const r = toTruthResults(report(walk('alpha', spec('one', [run('desktop', 'passed')]))), PROJECTS, RUN, NOW);
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('marks a project with no executed tests as fail (spec absent)', () => {
    const r = toTruthResults(report(walk('beta', spec('one', both('passed')))), PROJECTS, RUN, NOW);
    expect(statusOf(r, 'alpha')).toBe('fail');
    expect(statusOf(r, 'beta')).toBe('pass');
  });

  it('marks a project with no executed tests as fail (all skipped)', () => {
    const r = toTruthResults(report(walk('alpha', spec('one', both('skipped')))), PROJECTS, RUN, NOW);
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('fails a project when any one of its tests was skipped', () => {
    const r = toTruthResults(
      report(walk('alpha', spec('one', both('passed')), spec('two', both('skipped')))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('fail');
  });

  it('fails a test whose run was interrupted or left no result', () => {
    const noResult = { ...run('mobile'), results: [] };
    const r = toTruthResults(
      report(walk('alpha', spec('one', [run('desktop', 'interrupted'), run('mobile', 'passed')]))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r, 'alpha')).toBe('fail');
    const r2 = toTruthResults(
      report(walk('alpha', spec('one', [run('desktop', 'passed'), noResult]))),
      PROJECTS,
      RUN,
      NOW,
    );
    expect(statusOf(r2, 'alpha')).toBe('fail');
  });

  it('maps tests to a slug by their top-level describe title, including nested describes', () => {
    const nested = file('alpha.spec.ts', [group('alpha', [spec('one', both('passed'))], [group('inner', [spec('two', both('failed', 'failed'))])])]);
    expect(statusOf(toTruthResults(report(nested), PROJECTS, RUN, NOW), 'alpha')).toBe('fail');
  });

  it('ignores tests outside a describe and describes whose title is not a slug', () => {
    const loose = file('alpha.spec.ts', [group('alpah', [spec('typo', both('passed'))])], [spec('bare', both('passed'))]);
    expect(statusOf(toTruthResults(report(loose), PROJECTS, RUN, NOW), 'alpha')).toBe('fail');
  });

  it('lists every project in projects order with the claim copied from projects', () => {
    const r = toTruthResults(report(walk('beta', spec('one', both('passed')))), PROJECTS, RUN, NOW);
    expect(r.results.map((x) => x.slug)).toEqual(['alpha', 'beta', SITE_SLUG]);
    for (const p of PROJECTS) {
      const res = r.results.find((x) => x.slug === p.slug);
      expect(res?.claim).toBe(p.claim);
      expect(res?.finishedAt).toBe(NOW.toISOString());
      expect(res?.runUrl).toBe(RUN);
    }
  });

  it('reports the self-walk as slug "site" with SITE_CLAIM', () => {
    const r = toTruthResults(report(walk('site', spec('links', both('passed')))), PROJECTS, RUN, NOW);
    expect(r.results.at(-1)).toEqual({
      slug: 'site',
      claim: SITE_CLAIM,
      status: 'pass',
      finishedAt: NOW.toISOString(),
      runUrl: RUN,
    });
    expect(SITE_CLAIM).toBe('This site: every link works, the resume PDF downloads, and nothing errors.');
    const failed = toTruthResults(report(walk('site', spec('links', both('failed', 'failed')))), PROJECTS, RUN, NOW);
    expect(statusOf(failed, 'site')).toBe('fail');
  });

  it('produces a valid TruthResults envelope', () => {
    const r = toTruthResults(report(walk('alpha', spec('one', both('passed')))), PROJECTS, RUN, NOW);
    expect(TruthResultsSchema.parse(r)).toEqual(r);
    expect(r.schemaVersion).toBe(1);
    expect(r.generatedAt).toBe(NOW.toISOString());
    expect(r.runUrl).toBe(RUN);
  });

  it.each([null, undefined, 'garbage', 42, {}, { suites: 'nope' }, { suites: [null, 7, { suites: [{}] }] }])(
    'fails every slug when the report is malformed (%j)',
    (bad) => {
      const r = toTruthResults(bad, PROJECTS, RUN, NOW);
      expect(r.results.map((x) => [x.slug, x.status])).toEqual([
        ['alpha', 'fail'],
        ['beta', 'fail'],
        ['site', 'fail'],
      ]);
    },
  );
});

describe('report CLI under plain node (R3)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'truth-report-'));
  const reportFile = join(dir, 'report.json');
  writeFileSync(reportFile, JSON.stringify(report(walk('draw-night', spec('draws', both('passed'))))));
  const { RUN_URL: _ignored, ...inherited } = process.env;
  const cli = (env: Record<string, string>) =>
    spawnSync(process.execPath, ['truth/report.ts', reportFile], { encoding: 'utf8', env: { ...inherited, ...env } });

  it('prints TruthResults for every v1 project plus site', () => {
    const out = cli({ RUN_URL: RUN });
    expect(out.stderr).toBe('');
    expect(out.status).toBe(0);
    const parsed = TruthResultsSchema.parse(JSON.parse(out.stdout));
    expect(parsed.runUrl).toBe(RUN);
    expect(parsed.results.map((r) => r.slug)).toEqual([...projects.map((p) => p.slug), 'site']);
    expect(parsed.results.find((r) => r.slug === 'draw-night')?.status).toBe('pass');
  });

  it('exits non-zero without RUN_URL', () => {
    const out = cli({});
    expect(out.status).not.toBe(0);
    expect(out.stdout).toBe('');
  });
});

describe('v1 projects wiring', () => {
  it('match the schema, with claims verbatim from spec §7.2', () => {
    expect(ProjectSchema.array().parse(projects)).toEqual(projects);
    expect(projects.map((p) => [p.slug, p.url, p.claim])).toEqual([
      [
        'draw-night',
        'https://draw-night-five.vercel.app',
        'Add names, group households, pass one phone around: everyone draws a Secret Santa name, and nobody gets themselves, their partner, or a swap.',
      ],
      [
        'fantasy-autopilot',
        'https://fantasyonautopilot.com',
        'Free fantasy-football guides plus a $49 playbook kit for running your team with your own AI agent.',
      ],
      [
        'brennan-builds',
        'https://brennanbuilds.dev',
        'Click through 12 live demo websites without signing up; custom builds from $500.',
      ],
      [
        'golf-toolbox',
        'https://golftoolbox.app',
        'Answer three questions about your swing and get a shaft flex, weight and kick-point recommendation, no account needed.',
      ],
    ]);
  });

  it('allow writes only for the Fantasy checkout session and Stripe loading it', () => {
    const allowed = Object.fromEntries(projects.map((p) => [p.slug, p.allowWrites ?? []]));
    expect(allowed).toEqual({
      'draw-night': [],
      'fantasy-autopilot': [
        '^https://fantasyonautopilot\\.com/api/checkout$',
        '^https://api\\.stripe\\.com/v1/payment_pages/cs_live_[A-Za-z0-9]+/init$',
      ],
      'brennan-builds': [],
      'golf-toolbox': [],
    });
  });

  it('keep the Fantasy checkers and reminders signup blocked (each writes a production row)', () => {
    const patterns = (projects.find((p) => p.slug === 'fantasy-autopilot')?.allowWrites ?? []).map((s) => new RegExp(s));
    const allows = (url: string) => patterns.some((re) => re.test(url));
    expect(allows('https://fantasyonautopilot.com/api/checkout')).toBe(true);
    expect(allows('https://api.stripe.com/v1/payment_pages/cs_live_a1B2c3/init')).toBe(true);
    for (const url of [
      'https://fantasyonautopilot.com/start-or-sit',
      'https://fantasyonautopilot.com/bye-week-checker',
      'https://fantasyonautopilot.com/api/reminders',
      'https://fantasyonautopilot.com/api/checkout?x=1',
      'https://evil.example/https://fantasyonautopilot.com/api/checkout',
      'https://api.stripe.com/v1/payment_pages/cs_live_a1B2c3/confirm',
      'https://api.stripe.com/v1/payment_pages/cs_test_a1B2c3/init',
      'https://r.stripe.com/b',
    ]) {
      expect(allows(url), url).toBe(false);
    }
  });

  it.each([...projects.map((p) => p.slug), SITE_SLUG])('%s has truth/<slug>.spec.ts with describe("<slug>")', (slug) => {
    const path = join('truth', `${slug}.spec.ts`);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toContain(`test.describe('${slug}'`);
  });
});
