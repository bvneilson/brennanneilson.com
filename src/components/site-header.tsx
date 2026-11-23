import Link from 'next/link';
import { copy } from '../content/copy.ts';
import { siteName } from '../content/site.ts';

/** Links that only point at pages and anchors that exist. The site walk fails on a dead one. */
const NAV_LINKS = [
  { href: '/#work', label: copy.nav.work },
  { href: '/verified', label: copy.nav.verified },
  { href: '/#contact', label: copy.nav.contact },
];

export function SiteHeader() {
  return (
    <header className="wrap flex items-center justify-between gap-4 py-5 sm:py-7">
      <a href="#main" className="skip-link">
        {copy.nav.skip}
      </a>
      <Link href="/" className="text-[0.9375rem] font-semibold tracking-tight text-ink">
        {siteName}
      </Link>
      <nav aria-label={copy.nav.label}>
        <ul className="flex items-center gap-4 text-[0.875rem] text-ink-2 sm:gap-7 sm:text-[0.9375rem]">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
