import { projects } from '../content/projects.ts';
import { COO_CASE_STUDY_PATH, OPEN_SOURCE_REPO } from '../content/site.ts';
import type { Stats, TruthResults } from '../content/types.ts';
import { visibleProjects, visibleStats } from '../lib/visibility.ts';
import { Contact } from './contact.tsx';
import { CooTeaser } from './coo-teaser.tsx';
import { Hero } from './hero.tsx';
import { OpenSourceBand } from './open-source-band.tsx';
import { ProofStrip } from './proof-strip.tsx';
import { WorkGrid } from './work-grid.tsx';

/** The home page, from already-fetched data. `now` decides what is fresh enough to show. */
export function HomePage({ truth, stats, now }: { truth: TruthResults | null; stats: Stats | null; now: Date }) {
  const shown = visibleProjects(projects, truth, now);
  return (
    <main id="main">
      <div className="wrap">
        <Hero live={shown.length > 0} />
        <ProofStrip stats={visibleStats(stats, now)} projects={shown} now={now} />
      </div>
      <CooTeaser caseStudyHref={COO_CASE_STUDY_PATH} />
      <WorkGrid projects={shown} available={truth !== null} />
      <OpenSourceBand repo={OPEN_SOURCE_REPO} />
      <Contact />
    </main>
  );
}
