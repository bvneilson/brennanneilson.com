import Link from 'next/link';
import { copy } from '../content/copy.ts';
import type { Stat, VisibleProject } from '../content/types.ts';
import { formatCount, timeAgo, utcStamp } from '../lib/format.ts';
import { CheckIcon } from './icons.tsx';
import { RelativeTime } from './relative-time.tsx';

/**
 * Live numbers. Each tile shows a value and how fresh it is. Its source and exact time sit in the
 * tile's last line, which hover or focus reveals (and touch screens always show). Hidden stats and
 * an empty work grid simply drop their tiles: no tile ever shows a default or cached number.
 */
export function ProofStrip({ stats, projects, now }: { stats: Stat[]; projects: VisibleProject[]; now: Date }) {
  // By time, not by string: timestamps may carry an offset, so text order isn't time order.
  const lastRun = projects.map((p) => p.verifiedAt).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
  if (stats.length === 0 && !lastRun) return null;
  return (
    <section aria-labelledby="proof-heading" className="mt-16 sm:mt-20">
      <h2 id="proof-heading" className="sr-only">
        {copy.proof.heading}
      </h2>
      <ul className="grid gap-x-10 gap-y-2 md:grid-cols-3">
        {stats.map((s, i) => (
          <li key={s.metric} className="rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
            <StatTile stat={s} now={now} />
          </li>
        ))}
        {lastRun && (
          <li className="rise" style={{ animationDelay: `${120 + stats.length * 90}ms` }}>
            <div data-tile className="tile">
              <p className="tile-value flex items-baseline gap-3">
                {projects.length}
                <CheckIcon className="size-[0.5em] translate-y-[-0.1em] text-proof" />
              </p>
              <p className="tile-label">{projects.length === 1 ? copy.proof.productOne : copy.proof.productMany}</p>
              <p className="tile-meta">
                {copy.proof.lastRun}{' '}
                <RelativeTime iso={lastRun} initial={timeAgo(lastRun, now)} title={utcStamp(lastRun)} />
              </p>
              <p className="tile-reveal">
                {copy.proof.source} {copy.proof.productsSource}{' '}
                <Link href="/verified" className="link">
                  {copy.proof.productsLink}
                </Link>
              </p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}

/**
 * One live number: its value, its label from the data, how fresh it is, and (on hover, focus or a
 * touch screen) its source and exact time. Callers pass only stats that `visibleStats` kept.
 */
export function StatTile({ stat, now }: { stat: Stat; now: Date }) {
  return (
    <div data-tile tabIndex={0} className="tile">
      <p className="tile-value">{formatCount(stat.value)}</p>
      <p className="tile-label">{stat.label}</p>
      <p className="tile-meta">
        {copy.proof.updated} <RelativeTime iso={stat.asOf} initial={timeAgo(stat.asOf, now)} />
      </p>
      <p className="tile-reveal">
        {copy.proof.source} {stat.source} · <time dateTime={stat.asOf}>{utcStamp(stat.asOf)}</time>
      </p>
    </div>
  );
}
