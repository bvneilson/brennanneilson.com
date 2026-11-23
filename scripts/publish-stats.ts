import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { StatsSchema } from '../src/content/types.ts'
import type { Stats } from '../src/content/types.ts'

export type MetricConfig = { metric: string; label: string; query: string }
export type Count = { metric: string; label: string; value: number }
export type QueryRunner = (query: string) => number

const SOURCE = 'GitHub search API'
const DAY_MS = 24 * 60 * 60 * 1000

export function buildStats(counts: Count[], now: Date): Stats {
  const asOf = now.toISOString()
  return StatsSchema.parse({
    schemaVersion: 1,
    generatedAt: asOf,
    stats: counts.map((c) => ({ metric: c.metric, label: c.label, value: c.value, asOf, source: SOURCE })),
  })
}

/** Parse the private config. Errors name the entry index, never the query text. */
export function parseConfig(text: string): MetricConfig[] {
  const raw: unknown = JSON.parse(text)
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('config must be a non-empty array')
  return raw.map((entry, i) => {
    for (const key of ['metric', 'label', 'query'] as const) {
      const v = (entry as Record<string, unknown> | null)?.[key]
      if (typeof v !== 'string' || v.trim() === '') throw new Error(`config entry ${i} is missing "${key}"`)
    }
    const e = entry as MetricConfig
    return { metric: e.metric, label: e.label, query: e.query }
  })
}

/** ISO datetime (UTC, whole seconds), exactly 7 x 24h before `now`. */
export function since7d(now: Date): string {
  return new Date(now.getTime() - 7 * DAY_MS).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function substituteQuery(query: string, now: Date): string {
  return query.replaceAll('{{since7d}}', since7d(now))
}

/**
 * All-or-nothing: if any metric fails or returns a bad value this throws, and the
 * caller publishes nothing. The previously published file keeps its true asOf and
 * ages out on the site after 7 days. Errors carry the metric name only, because
 * queries name private repos.
 */
export function collectCounts(config: MetricConfig[], run: QueryRunner, now: Date): Count[] {
  return config.map((c) => {
    let value: number
    try {
      value = run(substituteQuery(c.query, now))
    } catch {
      throw new Error(`query failed for metric ${c.metric}`)
    }
    if (!Number.isInteger(value) || value < 0) throw new Error(`invalid count for metric ${c.metric}`)
    return { metric: c.metric, label: c.label, value }
  })
}

export const ghRunner: QueryRunner = (query) => {
  let out: string
  try {
    out = execFileSync(
      'gh',
      ['api', '-X', 'GET', 'search/issues', '-f', `q=${query}`, '--jq', '.total_count'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000 },
    )
  } catch {
    // Swallow the original error: its message contains the argv, and so the query.
    throw new Error('gh failed')
  }
  return /^\d+$/.test(out.trim()) ? Number(out.trim()) : Number.NaN
}

function git(dir: string, args: string[]): void {
  execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'] })
}

export function publish(stats: Stats, cloneDir: string): void {
  writeFileSync(join(cloneDir, 'stats.json'), JSON.stringify(stats, null, 2) + '\n')
  git(cloneDir, ['add', 'stats.json'])
  git(cloneDir, ['commit', '-q', '-m', `stats ${stats.generatedAt}`, '--only', 'stats.json'])
  git(cloneDir, ['push', '-q', 'origin', 'site-stats'])
}

function main(): void {
  const now = new Date()
  const config = parseConfig(readFileSync(join(homedir(), '.config/flagship/stats-config.json'), 'utf8'))
  const stats = buildStats(collectCounts(config, ghRunner, now), now)
  publish(stats, join(homedir(), 'flagship-stats'))
  for (const s of stats.stats) console.log(`${stats.generatedAt} ${s.metric}=${s.value}`)
}

if (import.meta.main) {
  try {
    main()
  } catch (e) {
    // Message only. Never the stack or the error object: child-process errors embed argv.
    console.error(`${new Date().toISOString()} publish skipped: ${e instanceof Error ? e.message.split('\n')[0] : 'unknown error'}`)
    process.exit(1)
  }
}
