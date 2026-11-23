import { copy } from '../content/copy.ts';
import type { VisibleProject } from '../content/types.ts';
import { shortDate, utcStamp } from '../lib/format.ts';
import { ArrowUpRightIcon, CheckIcon } from './icons.tsx';

/** A typographic card shaped like a receipt: the claim on top, its proof torn off below. */
export function ProjectCard({ project }: { project: VisibleProject }) {
  const nameId = `card-${project.slug}`;
  const host = new URL(project.url).host;
  return (
    <article aria-labelledby={nameId} className="receipt group">
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">{project.tags.join(' · ')}</p>
        <h3 id={nameId} className="mt-5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {project.name}
        </h3>
        <p className="mt-1 font-mono text-xs break-all text-muted">{host}</p>
        <p className="claim mt-6 font-serif text-[1.375rem] leading-snug text-ink sm:text-[1.625rem]">{project.claim}</p>
      </div>
      <div className="receipt-stub">
        <a href={project.runUrl} className="proof-mark" title={utcStamp(project.verifiedAt)}>
          <CheckIcon className="size-[1.15em]" />
          <span>
            {copy.work.verified} <time dateTime={project.verifiedAt}>{shortDate(project.verifiedAt)}</time>
          </span>
          <span className="sr-only">, {copy.work.viewRun}</span>
        </a>
        <a href={project.url} className="visit-link">
          {copy.work.visit}{' '}
          <span className="sr-only">{project.name}</span>
          <ArrowUpRightIcon />
        </a>
      </div>
    </article>
  );
}
