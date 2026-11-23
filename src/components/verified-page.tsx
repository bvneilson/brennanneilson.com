import { copy } from '../content/copy.ts';
import { projects } from '../content/projects.ts';
import type { TruthResults } from '../content/types.ts';
import { claimRows, type ClaimRow, type ClaimStatus } from '../lib/claim-status.ts';
import { utcStamp } from '../lib/format.ts';
import { SITE_CLAIM, SITE_SLUG } from '../../truth/report.ts';
import { ArrowUpRightIcon } from './icons.tsx';

const SUBJECTS = [
  ...projects.map(({ slug, name, url, claim }) => ({ slug, name, url, claim })),
  { slug: SITE_SLUG, name: copy.verified.siteName, claim: SITE_CLAIM },
];

/** The honest page: every claim and its latest result, failures included. */
export function VerifiedPage({ truth, now }: { truth: TruthResults | null; now: Date }) {
  const { verified } = copy;
  const rows = truth ? claimRows(SUBJECTS, truth, now) : [];
  const passing = rows.filter((r) => r.status === 'pass').length;
  return (
    <main id="main" className="wrap">
      <header className="pt-14 sm:pt-24">
        <p className="eyebrow">{verified.label}</p>
        <h1 className="section-title mt-5 max-w-[52rem] text-[clamp(2.6rem,6.4vw,5rem)]">{verified.heading}</h1>
        <div className="mt-8 grid max-w-[64rem] gap-4 text-lg leading-relaxed text-ink-2 md:grid-cols-2 md:gap-10">
          {verified.lede.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </header>

      {!truth ? (
        <p className="mt-14 flex items-start gap-3 rounded-lg border border-dashed border-rule px-5 py-5 text-ink-2 sm:px-6">
          <span className="mt-[0.55em] size-2 shrink-0 rounded-full bg-muted" aria-hidden="true" />
          <span>
            {verified.unavailable} {verified.unavailableMore}
          </span>
        </p>
      ) : (
        <>
          <div className="mt-14 flex flex-col gap-3 border-t border-ink pt-6 sm:mt-20 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-serif text-3xl text-ink">
              {passing} {verified.of} {rows.length} {verified.passing}
            </p>
            <p className="text-sm text-muted">
              {verified.latestRun} <time dateTime={truth.generatedAt}>{utcStamp(truth.generatedAt)}</time>
              <span aria-hidden="true"> · </span>
              <a href={truth.runUrl} className="link text-ink-2">
                {verified.viewLatestRun}
              </a>
            </p>
          </div>
          <ol aria-label={verified.listLabel} className="mt-6 border-t border-rule">
            {rows.map((r) => (
              <Row key={r.slug} row={r} />
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">{verified.staleNote}</p>
        </>
      )}
    </main>
  );
}

function Row({ row }: { row: ClaimRow }) {
  const { verified } = copy;
  const nameId = `claim-${row.slug}`;
  return (
    <li
      aria-labelledby={nameId}
      className="grid gap-x-8 gap-y-3 border-b border-rule py-7 md:grid-cols-[7.5rem_minmax(0,1fr)_12.5rem_auto] md:items-baseline"
    >
      <StatusPill status={row.status} />
      <div>
        <h2 id={nameId} className="text-base font-semibold tracking-tight text-ink">
          {row.url ? (
            <a href={row.url} className="link">
              {row.name}
            </a>
          ) : (
            row.name
          )}
        </h2>
        <p className="mt-2 max-w-[40rem] font-serif text-xl leading-snug text-ink">{row.testedClaim}</p>
      </div>
      <p className="text-sm text-muted">
        <span className="sr-only">{verified.lastRun}: </span>
        {row.finishedAt && <time dateTime={row.finishedAt}>{utcStamp(row.finishedAt)}</time>}
      </p>
      <p className="text-sm">
        {row.runUrl && (
          <a href={row.runUrl} className="link inline-flex items-center gap-1 text-ink-2">
            {verified.viewRun}
            <ArrowUpRightIcon />
          </a>
        )}
      </p>
    </li>
  );
}

const PILL: Record<ClaimStatus, string> = {
  pass: 'bg-proof-wash text-proof',
  fail: 'bg-fail-wash text-fail',
  stale: 'bg-stale-wash text-stale',
  missing: 'bg-rule/50 text-muted',
};

function StatusPill({ status }: { status: ClaimStatus }) {
  return (
    <p>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs tracking-wide ${PILL[status]}`}
      >
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {copy.verified.status[status]}
      </span>
    </p>
  );
}
