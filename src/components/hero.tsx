import { copy } from '../content/copy.ts';
import { siteName } from '../content/site.ts';

/**
 * Name, the headline, and the one-line who-and-where. The headline's period is a status light:
 * green and pulsing only while at least one project has a fresh, passing walk.
 */
export function Hero({ live }: { live: boolean }) {
  const words = copy.hero.headline.split(' ');
  const last = words.pop();
  return (
    <header className="pt-14 sm:pt-24">
      <p className="eyebrow">{copy.hero.role}</p>
      <h1 className="mt-6 sm:mt-8">
        <span className="block text-lg font-semibold tracking-tight text-ink-2 sm:text-xl">{siteName}</span>
        <span className="display mt-3 block">
          {words.join(' ')} <span className="italic">{last}</span>
          <span className="live-dot" data-live={live} aria-hidden="true" />
        </span>
      </h1>
      <div className="mt-8 max-w-[38rem] space-y-4 text-[1.0625rem] leading-relaxed text-ink-2 sm:mt-10 sm:text-xl sm:leading-relaxed">
        {copy.hero.lede.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </header>
  );
}
