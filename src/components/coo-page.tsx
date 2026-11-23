import Link from 'next/link';
import { coo } from '../content/coo.ts';
import type { Stats } from '../content/types.ts';
import { visibleStats } from '../lib/visibility.ts';
import { ArrowRightIcon, CheckIcon } from './icons.tsx';
import { Notice } from './notice.tsx';
import { StatTile } from './proof-strip.tsx';

/**
 * The COO case study: what it is, how an order moves through it, its live numbers, and two
 * incidents with their fixes. No screenshots of the COO's own screens (R35): the diagram is real
 * text, and the numbers are the home page's tiles, which hide when their source goes stale.
 */
export function CooPage({ stats, now }: { stats: Stats | null; now: Date }) {
  return (
    <main id="main">
      <div className="wrap">
        <Intro />
      </div>
      <Diagram />
      <Numbers stats={stats} now={now} />
      <Incidents />
      <section aria-label={coo.closing.link} className="wrap pt-24 sm:pt-32">
        <div className="flex flex-col gap-4 border-t border-ink pt-8 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-serif text-[1.75rem] leading-snug text-ink sm:text-[2.1rem]">{coo.closing.body}</p>
          <Link href="/verified" className="link inline-flex shrink-0 items-center gap-2 font-medium">
            {coo.closing.link}
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Intro() {
  const words = coo.heading.split(' ');
  const last = words.pop();
  return (
    <header className="pt-14 sm:pt-24">
      <p className="eyebrow">{coo.label}</p>
      <h1 className="display mt-6 sm:mt-8">
        {words.join(' ')} <span className="italic">{last}</span>
      </h1>
      <div className="mt-10 grid max-w-[64rem] gap-4 text-lg leading-relaxed text-ink-2 sm:mt-12 md:grid-cols-2 md:gap-10 sm:text-xl sm:leading-relaxed">
        {coo.lede.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
        <p className="eyebrow shrink-0">{coo.stackLabel}</p>
        <ul className="flex flex-wrap gap-2">
          {coo.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function Diagram() {
  const { diagram } = coo;
  return (
    <section aria-labelledby="diagram-heading" className="band mt-24 py-20 sm:mt-32 sm:py-28">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow text-band-muted">{diagram.label}</p>
            <h2 id="diagram-heading" className="section-title mt-5 text-band-ink">
              {diagram.heading}
            </h2>
          </div>
          <p className="max-w-[34rem] self-end text-lg leading-relaxed text-band-muted lg:col-span-5 lg:col-start-8">
            {diagram.intro}
          </p>
        </div>
        <ol aria-label={diagram.listLabel} className="flow mt-14 sm:mt-20">
          {diagram.steps.map((step, i) => {
            const isVerify = step.name === 'Verify';
            return (
              <li key={step.name} className={isVerify ? 'is-verify' : undefined}>
                <span className="flow-node" aria-hidden="true">
                  {isVerify && <CheckIcon />}
                </span>
                <p className="flow-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="flow-name">{step.name}</h3>
                <p className="flow-body">{step.body}</p>
              </li>
            );
          })}
        </ol>
        <div className="trust mt-12 sm:mt-16">
          <h3 className="eyebrow text-band-proof">{diagram.trustLabel}</h3>
          <ul className="mt-6 grid gap-6 md:grid-cols-3 md:gap-10">
            {diagram.trust.map((t) => (
              <li key={t} className="trust-item">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Numbers({ stats, now }: { stats: Stats | null; now: Date }) {
  const { numbers } = coo;
  const shown = visibleStats(stats, now);
  return (
    <section aria-labelledby="numbers-heading" className="wrap pt-24 sm:pt-32">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow">{numbers.label}</p>
          <h2 id="numbers-heading" className="section-title mt-5">
            {numbers.heading}
          </h2>
        </div>
        <p className="max-w-[34rem] self-end text-lg leading-relaxed text-ink-2 lg:col-span-5 lg:col-start-8">
          {numbers.intro}
        </p>
      </div>
      {shown.length === 0 ? (
        <Notice>{numbers.unavailable}</Notice>
      ) : (
        <ul className="mt-12 grid gap-x-10 gap-y-2 sm:mt-16 md:grid-cols-3">
          {shown.map((s, i) => (
            <li key={s.metric} className="rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
              <StatTile stat={s} now={now} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Incidents() {
  const { incidents } = coo;
  return (
    <section aria-labelledby="incidents-heading" className="wrap pt-24 sm:pt-32">
      <p className="eyebrow">{incidents.label}</p>
      <h2 id="incidents-heading" className="section-title mt-5 max-w-[48rem]">
        {incidents.heading}
      </h2>
      <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
        {incidents.stories.map((story, i) => {
          const id = `incident-${i + 1}`;
          return (
            <article key={id} aria-labelledby={id} className="incident">
              {story.when && <p className="font-mono text-xs text-muted">{story.when}</p>}
              <h3 id={id} className="incident-title">
                {story.title}
              </h3>
              <div className="mt-5 space-y-4 leading-relaxed text-ink-2">
                {story.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="incident-fix">
                <p className="eyebrow text-proof">{incidents.fixLabel}</p>
                <p className="mt-3">{story.fix}</p>
                {story.later && <p className="mt-3">{story.later}</p>}
              </div>
              <p className="incident-lesson">
                <span className="eyebrow">{incidents.lessonLabel}</span>
                <span className="font-serif text-2xl text-ink italic">{story.lesson}</span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
