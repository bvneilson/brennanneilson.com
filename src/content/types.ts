import { z } from 'zod';

/**
 * An ISO 8601 datetime (Z or an offset). A malformed timestamp fails the whole file, so the fetch
 * returns null and the page fails closed, never guessing how fresh something is (R33).
 */
const Timestamp = z.iso.datetime({ offset: true });

export const ProjectSchema = z.object({
  slug: z.string(),
  name: z.string(),
  url: z.string(),
  claim: z.string(),
  tags: z.array(z.string()),
  screenshot: z.string().optional(),
  /** RegExp sources for write requests the nightly walk may allow. */
  allowWrites: z.array(z.string()).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ClaimResultSchema = z.object({
  slug: z.string(),
  claim: z.string(),
  status: z.enum(['pass', 'fail']),
  finishedAt: Timestamp,
  runUrl: z.string(),
});
export type ClaimResult = z.infer<typeof ClaimResultSchema>;

export const TruthResultsSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: Timestamp,
  runUrl: z.string(),
  results: z.array(ClaimResultSchema),
});
export type TruthResults = z.infer<typeof TruthResultsSchema>;

export const StatSchema = z.object({
  metric: z.string(),
  label: z.string(),
  value: z.number(),
  asOf: Timestamp,
  source: z.string(),
});
export type Stat = z.infer<typeof StatSchema>;

export const StatsSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: Timestamp,
  stats: z.array(StatSchema),
});
export type Stats = z.infer<typeof StatsSchema>;

export type VisibleProject = Project & { verifiedAt: string; runUrl: string };
