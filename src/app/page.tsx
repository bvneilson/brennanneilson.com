import { HomePage } from '../components/home-page.tsx';
import { resume } from '../content/resume-source.ts';
import { fetchStats, fetchTruthResults } from '../lib/site-data.ts';

// Rendered per request, never cached: cards and tiles are judged against the results as they
// are right now, so a failed walk hides its card on the next page view (R32).
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [truth, stats] = await Promise.all([fetchTruthResults(), fetchStats()]);
  return <HomePage truth={truth} stats={stats} resume={resume} now={new Date()} />;
}
