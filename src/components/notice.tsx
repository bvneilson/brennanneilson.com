import type { ReactNode } from 'react';

/** A quiet dashed note that stands in for content that isn't available, such as cards or tiles. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mt-12 flex items-start gap-3 rounded-lg border border-dashed border-rule px-5 py-5 text-ink-2 sm:mt-16 sm:px-6">
      <span className="mt-[0.55em] size-2 shrink-0 rounded-full bg-muted" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
