import Link from 'next/link';
import { copy } from '../content/copy.ts';
import { ArrowRightIcon, CheckIcon } from './icons.tsx';

/** The COO in one band: what it does, the path an order takes, and the rule it runs on. */
export function CooTeaser({ caseStudyHref }: { caseStudyHref: string | null }) {
  const { coo } = copy;
  return (
    <section id="coo" aria-labelledby="coo-heading" className="band mt-24 py-20 sm:mt-32 sm:py-28">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow text-band-muted">{coo.label}</p>
            <h2 id="coo-heading" className="section-title mt-5 text-band-ink">
              {coo.heading}
            </h2>
            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-band-muted">{coo.body}</p>
            {caseStudyHref && (
              <Link href={caseStudyHref} className="link mt-8 inline-flex items-center gap-2 text-band-ink">
                {coo.cta}
                <ArrowRightIcon />
              </Link>
            )}
          </div>
          <figure className="self-end lg:col-span-5">
            <blockquote className="border-l-2 border-band-proof pl-6 font-serif text-[1.75rem] leading-snug text-band-ink italic sm:text-[2.1rem]">
              <p>{coo.quote}</p>
            </blockquote>
          </figure>
        </div>
        <ol aria-label={coo.stepsLabel} className="pipeline mt-16 sm:mt-20">
          {coo.steps.map((step, i) => {
            const isVerify = step === 'verify';
            return (
              <li key={step} className={isVerify ? 'is-verify' : undefined}>
                <span className="pipeline-node" aria-hidden="true">
                  {isVerify && <CheckIcon />}
                </span>
                <span className="pipeline-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pipeline-label">{step}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
