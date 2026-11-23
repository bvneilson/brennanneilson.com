import Link from 'next/link';
import { copy } from '../content/copy.ts';
import type { VisibleProject } from '../content/types.ts';
import { ArrowRightIcon } from './icons.tsx';
import { Notice } from './notice.tsx';
import { ProjectCard } from './project-card.tsx';

/**
 * Cards for projects with a fresh, passing walk, and nothing else. If the results can't be read at
 * all (`available` false) or nothing passes, it says so in place of the cards and never falls
 * back to unverified ones.
 */
export function WorkGrid({ projects, available }: { projects: VisibleProject[]; available: boolean }) {
  const { work } = copy;
  return (
    <section id="work" aria-labelledby="work-heading" className="wrap scroll-mt-8 pt-24 sm:pt-32">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">{work.label}</p>
          <h2 id="work-heading" className="section-title mt-5">
            {work.heading}
          </h2>
        </div>
        <p className="max-w-[34rem] self-end text-lg leading-relaxed text-ink-2 lg:col-span-6 lg:col-start-7">
          {work.intro}
        </p>
      </div>
      {!available ? (
        <Notice>
          {work.unavailable} {work.unavailableMore}
        </Notice>
      ) : projects.length === 0 ? (
        <Notice>
          {work.empty}{' '}
          <Link href="/verified" className="link inline-flex items-center gap-1.5">
            {work.emptyLink}
            <ArrowRightIcon />
          </Link>
        </Notice>
      ) : (
        <ul className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-2 md:gap-6">
          {projects.map((p) => (
            <li key={p.slug} className="flex">
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
