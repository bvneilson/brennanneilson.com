import { HomePage } from '../components/home-page.tsx';
import { fetchStats, fetchTruthResults } from '../lib/site-data.ts';

// Cards and tiles are judged at request time, at most an hour apart, never at build time.
export const revalidate = 3600;

export default async function Home() {
  const [truth, stats] = await Promise.all([fetchTruthResults(), fetchStats()]);
  return <HomePage truth={truth} stats={stats} now={new Date()} />;
}
