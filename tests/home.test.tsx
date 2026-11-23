// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from '../src/components/home-page.tsx';
import { OpenSourceBand } from '../src/components/open-source-band.tsx';
import { VerifiedPage } from '../src/components/verified-page.tsx';
import { projects } from '../src/content/projects.ts';
import type { ClaimResult, Stats, TruthResults } from '../src/content/types.ts';
import { SITE_CLAIM, SITE_SLUG } from '../truth/report.ts';

const NOW = new Date('2026-11-23T15:00:00.000Z');
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const RUN = 'https://github.com/bvneilson/brennanneilson.com/actions/runs/123';

/** A results file where every project and the site passed 3h ago, with per-slug overrides. */
function truth(over: Record<string, Partial<ClaimResult>> = {}): TruthResults {
  const subjects = [...projects.map((p) => ({ slug: p.slug, claim: p.claim })), { slug: SITE_SLUG, claim: SITE_CLAIM }];
  return {
    schemaVersion: 1,
    generatedAt: ago(3 * HOUR),
    runUrl: RUN,
    results: subjects.map(({ slug, claim }) => ({
      slug,
      claim,
      status: 'pass',
      finishedAt: ago(3 * HOUR),
      runUrl: RUN,
      ...over[slug],
    })),
  };
}

const FRESH_STAT = {
  metric: 'coo_repo_prs_merged',
  label: "pull requests merged into my COO's codebase since June 17, 2026",
  value: 1059,
  asOf: ago(10 * 60_000),
  source: 'GitHub search API',
};
const STALE_STAT = {
  metric: 'prs_merged_last_7d',
  label: 'pull requests merged across my projects in the last 7 days',
  value: 61,
  asOf: ago(8 * DAY),
  source: 'GitHub search API',
};
const stats = (list = [FRESH_STAT, STALE_STAT]): Stats => ({ schemaVersion: 1, generatedAt: ago(0), stats: list });

const workSection = () => within(document.getElementById('work') as HTMLElement);
const cards = () => workSection().queryAllByRole('article');
const verifiedRow = (name: string) => screen.getByRole('listitem', { name });

// Relative times recompute from the browser clock after mount. Pin that clock to NOW.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('home', () => {
  it('with truth = null, the work section says verification is unavailable and shows zero cards', () => {
    render(<HomePage truth={null} stats={stats()} now={NOW} />);
    expect(workSection().getByText(/Verification is temporarily unavailable/)).toBeTruthy();
    expect(cards()).toHaveLength(0);
  });

  it('shows one card per passing, fresh project, with its claim and a verified mark linking to its run', () => {
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    expect(cards()).toHaveLength(projects.length);
    for (const p of projects) {
      const card = within(workSection().getByRole('article', { name: p.name }));
      expect(card.getByText(p.claim)).toBeTruthy();
      const mark = card.getByRole('link', { name: /verified Nov 23/ });
      expect(mark.getAttribute('href')).toBe(RUN);
      expect(card.getByRole('link', { name: new RegExp(`^Visit ${p.name}`) }).getAttribute('href')).toBe(p.url);
    }
  });

  it('a failing project renders no card', () => {
    render(<HomePage truth={truth({ 'draw-night': { status: 'fail' } })} stats={stats()} now={NOW} />);
    expect(workSection().queryByRole('article', { name: 'Draw Night' })).toBeNull();
    expect(cards()).toHaveLength(projects.length - 1);
  });

  it('when nothing has a fresh pass, the work section says so and points to /verified', () => {
    const allFail = Object.fromEntries(projects.map((p) => [p.slug, { status: 'fail' as const }]));
    render(<HomePage truth={truth(allFail)} stats={stats()} now={NOW} />);
    expect(cards()).toHaveLength(0);
    expect(workSection().getByRole('link', { name: /verified page/ }).getAttribute('href')).toBe('/verified');
  });

  it('a stale stat renders no tile, a fresh one does', () => {
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    expect(screen.queryByText(STALE_STAT.label)).toBeNull();
    expect(screen.getByText(FRESH_STAT.label)).toBeTruthy();
    expect(screen.getByText('1,059')).toBeTruthy();
  });

  it('each stat tile takes keyboard focus and carries its source and as-of time', () => {
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    const tile = screen.getByText(FRESH_STAT.label).closest('[data-tile]') as HTMLElement;
    expect(tile.tabIndex).toBe(0);
    expect(within(tile).getByText(/GitHub search API/)).toBeTruthy();
    expect(within(tile).getByText(/Nov 23, 2026, 14:50 UTC/)).toBeTruthy();
    expect(within(tile).getByText('10 minutes ago')).toBeTruthy();
  });

  it('the products tile counts visible projects and says when the last run was', () => {
    render(<HomePage truth={truth({ 'golf-toolbox': { status: 'fail' } })} stats={stats()} now={NOW} />);
    const tile = screen.getByText(/products, verified nightly/).closest('[data-tile]') as HTMLElement;
    expect(within(tile).getByText(String(projects.length - 1))).toBeTruthy();
    expect(within(tile).getByText('3 hours ago')).toBeTruthy();
    expect(within(tile).getByRole('link', { name: /every result/ }).getAttribute('href')).toBe('/verified');
  });

  it('the products tile hides when no project is visible', () => {
    render(<HomePage truth={null} stats={stats()} now={NOW} />);
    expect(screen.queryByText(/verified nightly/)).toBeNull();
  });

  it('builds the email link in the browser, so the server HTML never holds the address', () => {
    const html = renderToStaticMarkup(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    expect(html).not.toContain('mailto:');
    expect(html).not.toMatch(/bvneilson@/);
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    expect(screen.getByRole('link', { name: /^Email/ }).getAttribute('href')).toBe('mailto:bvneilson@gmail.com');
  });

  it('links GitHub, LinkedIn, and Brennan Builds from contact', () => {
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    const contact = within(document.getElementById('contact') as HTMLElement);
    expect(contact.getByRole('link', { name: /^GitHub/ }).getAttribute('href')).toBe('https://github.com/bvneilson');
    expect(contact.getByRole('link', { name: /^LinkedIn/ }).getAttribute('href')).toBe(
      'https://www.linkedin.com/in/brennanneilson',
    );
    expect(contact.getByRole('link', { name: /Work with me/ }).getAttribute('href')).toBe('https://brennanbuilds.dev');
  });

  it('never links to a page that does not exist yet', () => {
    render(<HomePage truth={truth()} stats={stats()} now={NOW} />);
    const internal = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/'));
    for (const href of internal) expect(['/', '/verified']).toContain(href.split('#')[0]);
  });
});

describe('open-source band', () => {
  it('renders nothing until the repo exists', () => {
    const { container } = render(<OpenSourceBand repo={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('links the repo once it is set', () => {
    render(<OpenSourceBand repo="https://github.com/bvneilson/example" />);
    expect(screen.getByRole('link', { name: /GitHub/ }).getAttribute('href')).toBe('https://github.com/bvneilson/example');
  });
});

describe('/verified', () => {
  it('lists a failing project with status "failing"', () => {
    render(<VerifiedPage truth={truth({ 'draw-night': { status: 'fail' } })} now={NOW} />);
    const row = within(verifiedRow('Draw Night'));
    expect(row.getByText('failing')).toBeTruthy();
    expect(row.getByText(projects[0].claim)).toBeTruthy();
    expect(row.getByRole('link', { name: /View run/ }).getAttribute('href')).toBe(RUN);
  });

  it('lists every project and the site itself, with run time', () => {
    render(<VerifiedPage truth={truth()} now={NOW} />);
    for (const p of projects) expect(within(verifiedRow(p.name)).getByText('passing')).toBeTruthy();
    const site = within(verifiedRow('brennanneilson.com'));
    expect(site.getByText(SITE_CLAIM)).toBeTruthy();
    expect(site.getByText('Nov 23, 2026, 12:00 UTC')).toBeTruthy();
    expect(screen.getByText(/5 of 5 passing/)).toBeTruthy();
  });

  it('marks a pass older than 48 hours as stale', () => {
    render(<VerifiedPage truth={truth({ 'golf-toolbox': { finishedAt: ago(49 * HOUR) } })} now={NOW} />);
    expect(within(verifiedRow('Golf Toolbox')).getByText('stale')).toBeTruthy();
  });

  it('marks a pass of an older claim wording as stale', () => {
    render(<VerifiedPage truth={truth({ 'brennan-builds': { claim: 'An older sentence.' } })} now={NOW} />);
    const row = within(verifiedRow('Brennan Builds'));
    expect(row.getByText('stale')).toBeTruthy();
    expect(row.getByText('An older sentence.')).toBeTruthy();
  });

  it('marks a project missing from the results as not run yet', () => {
    const t = truth();
    t.results = t.results.filter((r) => r.slug !== 'fantasy-autopilot');
    render(<VerifiedPage truth={t} now={NOW} />);
    expect(within(verifiedRow('Fantasy on Autopilot')).getByText('not run yet')).toBeTruthy();
  });

  it('with truth = null, says verification is unavailable', () => {
    render(<VerifiedPage truth={null} now={NOW} />);
    expect(screen.getByText(/Verification is temporarily unavailable/)).toBeTruthy();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('copy', () => {
  const pages = [
    ['home, full data', <HomePage key="a" truth={truth()} stats={stats()} now={NOW} />],
    ['home, no data', <HomePage key="b" truth={null} stats={null} now={NOW} />],
    ['/verified, full data', <VerifiedPage key="c" truth={truth({ 'draw-night': { status: 'fail' } })} now={NOW} />],
    ['/verified, no data', <VerifiedPage key="d" truth={null} now={NOW} />],
  ] as const;

  it.each(pages)('no element in %s contains "hire me" or "open to work"', (_, page) => {
    const { container } = render(page);
    const html = container.innerHTML.toLowerCase();
    expect(html).not.toContain('hire me');
    expect(html).not.toContain('open to work');
  });
});
