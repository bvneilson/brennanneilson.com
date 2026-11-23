import Link from 'next/link';
import { copy } from '../content/copy.ts';
import { siteName, SOURCE_REPO_URL } from '../content/site.ts';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons.tsx';

export function SiteFooter({ year }: { year: number }) {
  const { footer } = copy;
  return (
    <footer className="wrap mt-28 sm:mt-36 print:hidden">
      <div className="flex flex-col gap-5 border-t border-rule py-8 text-sm sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted">
            © {year} {siteName}
          </p>
          <p className="max-w-[34rem] text-muted">{footer.source}</p>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 text-ink-2">
          <li>
            <a href={SOURCE_REPO_URL} className="link inline-flex items-center gap-1.5">
              {footer.sourceLink}
              <ArrowUpRightIcon />
            </a>
          </li>
          <li>
            <Link href="/verified" className="link inline-flex items-center gap-1.5">
              {footer.verifiedLink}
              <ArrowRightIcon />
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
