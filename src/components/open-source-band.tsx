import { copy } from '../content/copy.ts';
import { ArrowUpRightIcon } from './icons.tsx';

/** The open-sourced COO piece. Renders nothing until its repo exists. */
export function OpenSourceBand({ repo }: { repo: string | null }) {
  if (!repo) return null;
  const { openSource } = copy;
  return (
    <section aria-labelledby="open-source-heading" className="wrap pt-24 sm:pt-32">
      <div className="flex flex-col gap-6 border-y border-rule py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <h2 id="open-source-heading" className="eyebrow shrink-0">
          {openSource.label}
        </h2>
        <p className="max-w-[40rem] text-lg leading-relaxed text-ink-2">{openSource.body}</p>
        <a href={repo} className="link inline-flex shrink-0 items-center gap-1.5 font-medium">
          {openSource.link}
          <ArrowUpRightIcon />
        </a>
      </div>
    </section>
  );
}
