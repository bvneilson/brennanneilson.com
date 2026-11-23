import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = resolve('ops/flagship-runner.sh')
const GIT_ENV: Record<string, string> = {
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com',
  GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com',
}

let root: string
let home: string
let origin: string
let work: string
let runner: string
let npmLog: string

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, env: { ...process.env, ...GIT_ENV }, stdio: ['ignore', 'pipe', 'pipe'] }).toString()

function fakeNode(version: string) {
  const bin = join(home, '.nvm/versions/node', version, 'bin')
  mkdirSync(bin, { recursive: true })
  writeFileSync(join(bin, 'node'), '#!/bin/sh\nexit 0\n')
  writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "npm $* from ${version}" >> "${npmLog}"\n`)
  chmodSync(join(bin, 'node'), 0o755)
  chmodSync(join(bin, 'npm'), 0o755)
}

function run(extra: Record<string, string> = {}, homeDir = home) {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '', HOME: homeDir, ...GIT_ENV,
    FLAGSHIP_RUNNER_DIR: runner, FLAGSHIP_RUNNER_DRY_RUN: '1', ...extra,
  }
  return spawnSync('bash', [SCRIPT], { encoding: 'utf8', env: { ...env, NODE_ENV: 'test' } })
}

function pushToOrigin(file: string, content: string, message: string) {
  writeFileSync(join(work, file), content)
  git(work, 'add', file)
  git(work, 'commit', '-q', '-m', message)
  git(work, 'push', '-q', 'origin', 'main')
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'runner-test-'))
  home = join(root, 'home')
  origin = join(root, 'origin.git')
  work = join(root, 'work')
  runner = join(root, 'runner')
  npmLog = join(root, 'npm.log')
  mkdirSync(home)
  git(root, 'init', '-q', '--bare', '-b', 'main', origin)
  git(root, 'clone', '-q', origin, work)
  git(work, 'checkout', '-q', '-b', 'main')
  pushToOrigin('package-lock.json', '{"v":1}\n', 'init')
  git(root, 'clone', '-q', origin, runner)
  mkdirSync(join(runner, 'node_modules'))
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('ops/flagship-runner.sh', () => {
  it('picks the highest v24 by version sort, not lexical order', () => {
    fakeNode('v24.9.0')
    fakeNode('v24.18.0')
    fakeNode('v22.30.0')
    const r = run()
    expect(r.status).toBe(0)
    expect(r.stdout).toContain(`node=${join(home, '.nvm/versions/node/v24.18.0/bin/node')}`)
    expect(r.stdout).toContain(`script=${join(runner, 'scripts/publish-stats.ts')}`)
  })

  it('exits non-zero with a clear message when no v24 exists', () => {
    fakeNode('v22.30.0')
    const empty = join(root, 'empty-home')
    mkdirSync(empty)
    for (const h of [home, empty]) {
      const r = run({}, h)
      expect(r.status).not.toBe(0)
      expect(r.stderr).toContain('no Node 24 found')
    }
  })

  it('skips npm ci when the lockfile did not change', () => {
    fakeNode('v24.18.0')
    pushToOrigin('other.txt', 'x\n', 'other')
    const r = run()
    expect(r.status).toBe(0)
    expect(git(runner, 'log', '-1', '--format=%s').trim()).toBe('other')
    expect(existsSync(npmLog)).toBe(false)
  })

  it('runs npm ci when the pull changes the lockfile', () => {
    fakeNode('v24.18.0')
    pushToOrigin('package-lock.json', '{"v":2}\n', 'bump lock')
    const r = run()
    expect(r.status).toBe(0)
    expect(readFileSync(npmLog, 'utf8')).toBe('npm ci from v24.18.0\n')
  })

  it('runs npm ci when node_modules is missing, and SKIP_PULL leaves the clone alone', () => {
    fakeNode('v24.18.0')
    rmSync(join(runner, 'node_modules'), { recursive: true })
    pushToOrigin('other.txt', 'x\n', 'other')
    const r = run({ FLAGSHIP_RUNNER_SKIP_PULL: '1' })
    expect(r.status).toBe(0)
    expect(git(runner, 'log', '-1', '--format=%s').trim()).toBe('init')
    expect(readFileSync(npmLog, 'utf8')).toBe('npm ci from v24.18.0\n')
  })
})
