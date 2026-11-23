import { describe, expect, it } from 'vitest'
import { StatsSchema } from '../src/content/types.ts'
import { buildStats, collectCounts, parseConfig, since7d, substituteQuery } from '../scripts/publish-stats.ts'

const NOW = new Date('2026-11-23T12:00:00.000Z')
const CFG = [
  { metric: 'a', label: 'A label', query: 'repo:x/y is:pr' },
  { metric: 'b', label: 'B label', query: 'user:u merged:>={{since7d}}' },
]

describe('buildStats', () => {
  it('stamps asOf = now and passes StatsSchema', () => {
    const s = buildStats([{ metric: 'a', label: 'A', value: 5 }], NOW)
    expect(StatsSchema.safeParse(s).success).toBe(true)
    expect(s.stats[0]).toEqual({ metric: 'a', label: 'A', value: 5, asOf: NOW.toISOString(), source: 'GitHub search API' })
    expect(s.generatedAt).toBe(NOW.toISOString())
  })
})

describe('parseConfig', () => {
  it('accepts a valid config', () => {
    expect(parseConfig(JSON.stringify(CFG))).toHaveLength(2)
  })
  it('rejects an entry missing label, without echoing the query', () => {
    const bad = JSON.stringify([{ metric: 'a', query: 'repo:secret/thing' }])
    expect(() => parseConfig(bad)).toThrow(/missing "label"/)
    expect(() => parseConfig(bad)).not.toThrow(/secret/)
  })
  it('rejects empty or non-array config', () => {
    expect(() => parseConfig('[]')).toThrow()
    expect(() => parseConfig('{}')).toThrow()
  })
})

describe('{{since7d}}', () => {
  it('is exactly now minus 7 x 24h, as an ISO datetime', () => {
    expect(since7d(new Date('2026-11-23T12:34:56.789Z'))).toBe('2026-11-16T12:34:56Z')
    const now = new Date('2026-11-23T12:00:00Z')
    expect(Date.parse(since7d(now))).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  })
  it('crosses month and year boundaries', () => {
    expect(since7d(new Date('2026-12-03T10:00:00Z'))).toBe('2026-11-26T10:00:00Z')
    expect(since7d(new Date('2026-03-05T00:30:00Z'))).toBe('2026-02-26T00:30:00Z')
    expect(substituteQuery('merged:>={{since7d}}', new Date('2027-01-02T00:00:00Z'))).toBe('merged:>=2026-12-26T00:00:00Z')
  })
})

describe('collectCounts failure behavior', () => {
  it('returns counts when every query succeeds', () => {
    const out = collectCounts(CFG, (q) => (q.includes('2026-11-16T12:00:00Z') ? 7 : 1059), NOW)
    expect(out.map((c) => c.value)).toEqual([1059, 7])
  })
  it('throws (publishes nothing) if any query fails, naming the metric but not the query', () => {
    const run = (q: string) => {
      if (q.startsWith('repo:')) throw new Error('boom ' + q)
      return 3
    }
    expect(() => collectCounts(CFG, run, NOW)).toThrow('query failed for metric a')
    expect(() => collectCounts(CFG, run, NOW)).not.toThrow(/repo:x/)
  })
  it.each([Number.NaN, -1, 1.5, Infinity])('rejects invalid count %s', (bad) => {
    expect(() => collectCounts(CFG, () => bad, NOW)).toThrow(/invalid count for metric a/)
  })
})
