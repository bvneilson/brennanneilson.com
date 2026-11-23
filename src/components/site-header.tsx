import Link from 'next/link';
import { copy } from '../content/copy.ts';
import { siteName } from '../content/site.ts';

/** Links that only point at pages and anchors that exist. The site walk fails on a dead one. */
const NAV_LINKS = [
  { href: '/#work', label: copy.nav.work },
  { href: '/coo', label: copy.nav.coo },
  { href: '/resume', label: copy.nav.resume },
  { href: '/verified', label: copy.nav.verified },
  { href: '/#contact', label: copy.nav.contact },
];

export function SiteHeader() {
  return (
    // On a phone the five links wrap onto their own line under the name, so nothing overflows at 390.
    <header className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 sm:py-7 print:hidden">
      <a href="#main" className="skip-link">
        {copy.nav.skip}
      </a>
      <Link href="/" className="text-[0.9375rem] font-semibold tracking-tight text-ink">
        {siteName}
      </Link>
      <nav aria-label={copy.nav.label}>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.875rem] text-ink-2 sm:gap-x-7 sm:text-[0.9375rem]">
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
