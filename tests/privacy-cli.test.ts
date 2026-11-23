import { spawnSync, execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SCRIPTS = resolve(import.meta.dirname, '../scripts')
// Assembled at runtime so no real-looking token is committed.
const fakeToken = 'gh' + 'p_' + 'b'.repeat(36)

let base: string
beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), 'privacy cli '))
})
afterAll(() => rmSync(base, { recursive: true, force: true }))

/** A throwaway git repo (path contains spaces) holding a copy of the scan scripts. */
function makeRepo(name: string, opts: { file: string; denylist?: string | null }): string {
  const repo = join(base, name)
  mkdirSync(join(repo, 'scripts'), { recursive: true })
  for (const f of ['privacy-scan.ts', 'privacy-hash.ts', 'privacy-denylist.json']) {
    copyFileSync(join(SCRIPTS, f), join(repo, 'scripts', f))
  }
  if (opts.denylist === null) rmSync(join(repo, 'scripts/privacy-denylist.json'))
  else if (opts.denylist !== undefined) writeFileSync(join(repo, 'scripts/privacy-denylist.json'), opts.denylist)
  writeFileSync(join(repo, 'notes.md'), opts.file)
  execFileSync('git', ['init', '-q'], { cwd: repo })
  execFileSync('git', ['add', '-A'], { cwd: repo })
  return repo
}

function scan(repo: string) {
  const r = spawnSync('node', ['scripts/privacy-scan.ts'], { cwd: repo, encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('privacy scan CLI', () => {
  it('exits 0 on a clean repo whose path contains a space', () => {
    const r = scan(makeRepo('clean repo', { file: 'nothing to see\n' }))
    expect(r.out).toContain('tracked files clean')
    expect(r.code).toBe(0)
  })

  it('exits 1 on a planted secret, even when the path contains a space', () => {
    const r = scan(makeRepo('secret repo', { file: `key ${fakeToken}\n` }))
    expect(r.out).toContain('notes.md:1 secret')
    expect(r.code).toBe(1)
  })

  it('exits 1 on an empty denylist', () => {
    const r = scan(makeRepo('empty deny', { file: 'ok\n', denylist: JSON.stringify({ hashes: [] }) }))
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/denylist/i)
  })

  it('exits 1 on a missing denylist', () => {
    const r = scan(makeRepo('missing deny', { file: 'ok\n', denylist: null }))
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/denylist/i)
  })

  it('exits 1 on a malformed denylist', () => {
    const r = scan(makeRepo('bad deny', { file: 'ok\n', denylist: '{not json' }))
    expect(r.code).toBe(1)
  })

  it('exits 1 on a denylist with too few entries or a non-hex entry', () => {
    const short = Array.from({ length: 10 }, (_, i) => String(i).padStart(64, '0'))
    expect(scan(makeRepo('short deny', { file: 'ok\n', denylist: JSON.stringify({ hashes: short }) })).code).toBe(1)
    const bad = Array.from({ length: 300 }, (_, i) => String(i).padStart(64, '0'))
    bad[5] = 'nothex'
    expect(scan(makeRepo('nonhex deny', { file: 'ok\n', denylist: JSON.stringify({ hashes: bad }) })).code).toBe(1)
  })
})
