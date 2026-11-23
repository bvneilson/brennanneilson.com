import type { Metadata } from 'next';
import { ResumePage } from '../../components/resume-page.tsx';
import { copy } from '../../content/copy.ts';
import { resume, resumeSourceHash } from '../../content/resume-source.ts';

// Per request, like home: the resume hides itself 120 days after its last review, with no rebuild.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: copy.resume.title,
  description: copy.resume.description,
};

export default async function Resume() {
  return <ResumePage resume={resume} sourceHash={await resumeSourceHash} now={new Date()} />;
}
