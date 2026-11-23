export type ResumeFreshness = 'current' | 'review-due' | 'hidden';

const DAY_MS = 24 * 3600_000;
const REVIEW_DUE_AFTER_MS = 90 * DAY_MS;
const HIDDEN_AFTER_MS = 120 * DAY_MS;

export function resumeFreshness(reviewedAt: string, now: Date): ResumeFreshness {
  const t = Date.parse(reviewedAt);
  if (Number.isNaN(t)) return 'hidden';
  const age = now.getTime() - t;
  if (age >= HIDDEN_AFTER_MS) return 'hidden';
  if (age >= REVIEW_DUE_AFTER_MS) return 'review-due';
  return 'current';
}
