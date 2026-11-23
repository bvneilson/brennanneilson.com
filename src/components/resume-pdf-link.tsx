import type { ReactNode } from 'react';
import { RESUME_PDF_FILENAME, RESUME_PDF_PATH } from '../content/site.ts';
import { DownloadIcon } from './icons.tsx';

/**
 * The resume PDF. A plain <a>, never next/link: next/link would prefetch the PDF as if it were a
 * page, and the site walk fails on that failed request.
 */
export function ResumePdfLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a href={RESUME_PDF_PATH} download={RESUME_PDF_FILENAME} className={className}>
      {children}
      <DownloadIcon />
    </a>
  );
}
