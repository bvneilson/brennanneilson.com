// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Experience } from '../src/components/experience.tsx';
import { copy } from '../src/content/copy.ts';
import { ResumePage } from '../src/components/resume-page.tsx';
import { resume as RESUME } from '../src/content/resume-source.ts';
import { experienceOf } from '../src/lib/resume.ts';

const DAY = 24 * 3600_000;
const reviewed = Date.parse(RESUME.reviewedAt);
const CURRENT = new Date(reviewed + 10 * DAY);
const REVIEW_DUE = new Date(reviewed + 100 * DAY);
const HIDDEN = new Date(reviewed + 120 * DAY);
const HASH = 'a'.repeat(64);
const EMPLOYER = new RegExp('ban' + 'zai', 'i');

/** Matches the <p> whose whole text (a <time> inside included) matches `re`. */
const line = (re: RegExp) => (_: string, el: Element | null) => el?.tagName === 'P' && re.test(el.textContent ?? '');
const pdfLinks = () => screen.queryAllByRole('link').filter((a) => a.getAttribute('href') === '/resume.pdf');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(CURRENT);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('/resume', () => {
  it('renders every section and every role, with the PDF link', () => {
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(screen.getByRole('heading', { level: 1, name: RESUME.name })).toBeTruthy();
    for (const s of RESUME.sections) expect(screen.getByRole('heading', { level: 2, name: s.title })).toBeTruthy();
    for (const e of experienceOf(RESUME)) {
      expect(screen.getByRole('heading', { level: 3, name: new RegExp(e.title.replace(/[.()]/g, '\\$&')) })).toBeTruthy();
      expect(screen.getAllByText(e.when as string).length).toBeGreaterThan(0);
    }
    expect(pdfLinks()).toHaveLength(1);
  });

  it('marks the article with the hash of the source it rendered, for the PDF printer', () => {
    const { container } = render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(container.querySelector('[data-resume-sha256]')?.getAttribute('data-resume-sha256')).toBe(HASH);
  });

  it('builds the email link in the browser, so the server HTML never holds the address', () => {
    const html = renderToStaticMarkup(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('@gmail.com');
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(screen.getByRole('link', { name: /bvneilson@gmail\.com/ }).getAttribute('href')).toBe(
      'mailto:bvneilson@gmail.com',
    );
  });

  it('links LinkedIn and GitHub over https', () => {
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(screen.getByRole('link', { name: 'linkedin.com/in/brennanneilson' }).getAttribute('href')).toBe(
      'https://linkedin.com/in/brennanneilson',
    );
    expect(screen.getByRole('link', { name: 'github.com/bvneilson' }).getAttribute('href')).toBe(
      'https://github.com/bvneilson',
    );
  });

  it('says the PDF is printed from the page (tests/resume-pdf.test.ts is what makes that true)', () => {
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(screen.getByText(copy.resume.pdfNote)).toBeTruthy();
  });

  it('says when it was last reviewed', () => {
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={CURRENT} />);
    expect(screen.getByText(line(/^Reviewed Nov 23, 2026$/))).toBeTruthy();
  });

  it('still shows the resume when a review is due', () => {
    render(<ResumePage resume={RESUME} sourceHash={HASH} now={REVIEW_DUE} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeTruthy();
    expect(pdfLinks()).toHaveLength(1);
  });

  it('at 120 days, replaces the body with a one-line note and drops the PDF link', () => {
    const { container } = render(<ResumePage resume={RESUME} sourceHash={HASH} now={HIDDEN} />);
    expect(screen.getByText(/resume is being refreshed/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(pdfLinks()).toHaveLength(0);
    expect(container.textContent).not.toMatch(EMPLOYER);
    expect(container.querySelector('[data-resume-sha256]')).toBeNull();
  });
});

describe('home experience section', () => {
  it('lists every role with its dates, the review date, and links to /resume and the PDF', () => {
    render(<Experience resume={RESUME} now={CURRENT} />);
    const section = within(screen.getByRole('region', { name: /experience|worked/i }));
    for (const e of experienceOf(RESUME)) {
      expect(section.getByText(e.title)).toBeTruthy();
      expect(section.getByText(e.when as string)).toBeTruthy();
    }
    expect(section.getByText(line(/reviewed Nov 23, 2026$/))).toBeTruthy();
    expect(section.getByRole('link', { name: /full resume/i }).getAttribute('href')).toBe('/resume');
    expect(pdfLinks()).toHaveLength(1);
  });

  it('shows while a review is due', () => {
    const { container } = render(<Experience resume={RESUME} now={REVIEW_DUE} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('hides at 120 days', () => {
    const { container } = render(<Experience resume={RESUME} now={HIDDEN} />);
    expect(container.innerHTML).toBe('');
  });
});
