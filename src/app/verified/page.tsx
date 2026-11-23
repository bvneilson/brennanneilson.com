import type { Metadata } from 'next';
import { VerifiedPage } from '../../components/verified-page.tsx';
import { copy } from '../../content/copy.ts';
import { fetchTruthResults } from '../../lib/site-data.ts';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: copy.verified.title,
  description: copy.verified.description,
};

export default async function Verified() {
  return <VerifiedPage truth={await fetchTruthResults()} now={new Date()} />;
}
