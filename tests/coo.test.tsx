// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CooPage } from '../src/components/coo-page.tsx';
import { coo } from '../src/content/coo.ts';
import type { Stats } from '../src/content/types.ts';

const NOW = new Date('2026-11-23T15:00:00.000Z');
const DAY = 24 * 3600_000;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const stat = (metric: string, value: number, asOf: string) => ({
  metric,
  label: `${metric} label`,
  value,
  asOf,
  source: 'GitHub search API',
});
const stats = (...list: ReturnType<typeof stat>[]): Stats => ({ schemaVersion: 1, generatedAt: ago(0), stats: list });

const numbers = () => within(screen.getByRole('region', { name: coo.numbers.heading }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('/coo', () => {
  it('says what the COO is in its heading and lede', () => {
    render(<CooPage stats={null} now={NOW} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('COO');
    for (const p of coo.lede) expect(screen.getByText(p)).toBeTruthy();
  });

  it('draws the architecture as an ordered list of real text, order to live', () => {
    render(<CooPage stats={null} now={NOW} />);
    const diagram = within(screen.getByRole('list', { name: coo.diagram.listLabel }));
    const steps = diagram.getAllByRole('listitem');
    expect(steps.map((li) => li.querySelector('h3')?.textContent)).toEqual(['Order', 'Plan', 'Build', 'Verify', 'Live']);
    for (const s of coo.diagram.steps) expect(diagram.getByText(s.body)).toBeTruthy();
  });

  it('shows a tile per fresh stat, reusing the home tiles, and hides a stale one', () => {
    render(<CooPage stats={stats(stat('fresh', 1059, ago(60_000)), stat('stale', 61, ago(8 * DAY)))} now={NOW} />);
    expect(numbers().getByText('1,059')).toBeTruthy();
    expect(numbers().getByText('fresh label')).toBeTruthy();
    expect(numbers().queryByText('stale label')).toBeNull();
    expect(numbers().getAllByText(/GitHub search API/).length).toBe(1);
  });

  it('never shows a number it cannot source: no stats means a notice, not a tile', () => {
    const { container } = render(<CooPage stats={null} now={NOW} />);
    expect(numbers().getByText(coo.numbers.unavailable)).toBeTruthy();
    expect(container.querySelectorAll('[data-tile]')).toHaveLength(0);
  });

  it('tells both incident stories, each with its fix', () => {
    render(<CooPage stats={null} now={NOW} />);
    for (const story of coo.incidents.stories) {
      const card = within(screen.getByRole('article', { name: story.title }));
      for (const p of story.body) expect(card.getByText(p)).toBeTruthy();
      expect(card.getByText(story.fix)).toBeTruthy();
    }
    expect(coo.incidents.stories).toHaveLength(2);
  });

  it('links every claim back to /verified', () => {
    render(<CooPage stats={null} now={NOW} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/verified');
  });

  // OPEN_SOURCE_REPO is null, so the stories tell the incidents without a repo link (spec §7.5).
  it('links only pages that exist, and no open-source repo while there is none', () => {
    render(<CooPage stats={stats(stat('fresh', 1, ago(0)))} now={NOW} />);
    for (const a of screen.getAllByRole('link')) {
      expect(['/', '/verified', '/resume']).toContain((a.getAttribute('href') ?? '').split('#')[0]);
    }
  });
});

describe('/coo copy (R36)', () => {
  const text = JSON.stringify(coo);
  it('names no business: a storefront domain and a registrar, nothing more', () => {
    expect(text).toMatch(/storefront domain/);
    expect(text).toMatch(/registrar/);
    expect(text).not.toMatch(/GoDaddy|Namecheap|Titled|Apparel|\.com\b/i);
  });

  it('has no em dash, no semicolon, and no "hire me"', () => {
    expect(text).not.toMatch(/[—;]/);
    expect(text.toLowerCase()).not.toMatch(/hire me|open to work/);
  });
});
