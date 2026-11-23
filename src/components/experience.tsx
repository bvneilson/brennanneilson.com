import Link from 'next/link';
import { copy } from '../content/copy.ts';
import { RESUME_PATH } from '../content/site.ts';
import { longDate } from '../lib/format.ts';
import { experienceOf, type Resume } from '../lib/resume.ts';
import { resumeFreshness } from '../lib/resume-freshness.ts';
import { ArrowRightIcon } from './icons.tsx';
import { ResumePdfLink } from './resume-pdf-link.tsx';

/**
 * The roles from resume.md, newest first, with the date the resume was last reviewed. Hidden once
 * that review is 120 days old (spec §5): stale experience is not shown at all.
 */
export function Experience({ resume, now }: { resume: Resume; now: Date }) {
  if (resumeFreshness(resume.reviewedAt, now) === 'hidden') return null;
  const { experience } = copy;
  return (
    <section id="experience" aria-labelledby="experience-heading" className="wrap scroll-mt-8 pt-24 sm:pt-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">{experience.label}</p>
          <h2 id="experience-heading" className="section-title mt-5">
            {experience.heading}
          </h2>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-ink-2">{experience.body}</p>
          <p className="mt-6 font-mono text-xs text-muted">
            {experience.reviewed} <time dateTime={resume.reviewedAt}>{longDate(resume.reviewedAt)}</time>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link href={RESUME_PATH} className="link inline-flex items-center gap-2 font-medium">
              {experience.fullResume}
              <ArrowRightIcon />
            </Link>
            <ResumePdfLink className="link inline-flex items-center gap-2 text-ink-2">{experience.pdf}</ResumePdfLink>
          </div>
        </div>
        <ol className="border-t border-ink lg:col-span-7">
          {experienceOf(resume).map((e) => (
            <li key={`${e.title}-${e.when}`} className="role-row">
              <p className="role-org">{e.title}</p>
              {e.subtitle && <p className="role-title">{e.subtitle}</p>}
              {e.when && <p className="role-when">{e.when}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
