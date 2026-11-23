import type { Metadata } from 'next';
import { CooPage } from '../../components/coo-page.tsx';
import { coo } from '../../content/coo.ts';
import { fetchStats } from '../../lib/site-data.ts';

// Per request, like home: a live number older than 7 days comes off on the next view (R32).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: coo.meta.title,
  description: coo.meta.description,
};

export default async function Coo() {
  return <CooPage stats={await fetchStats()} now={new Date()} />;
}
