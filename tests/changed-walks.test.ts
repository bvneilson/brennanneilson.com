import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// The PR gate fails closed: a script error must be a non-zero exit, never an empty walk list.
const script = resolve('.github/scripts/changed-walks.sh');
const dir = mkdtempSync(join(tmpdir(), 'changed-walks-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const git = (...args: string[]) =>
  execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });

function repo() {
  git('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'truth'));
  mkdirSync(join(dir, 'src/content'), { recursive: true });
  for (const f of ['truth/site.spec.ts', 'truth/a.spec.ts', 'truth/b.spec.ts', 'src/content/projects.ts'])
    writeFileSync(join(dir, f), '// base\n');
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
}

const run = (base: string, out: string) =>
  spawnSync('bash', [script, base], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: out } });

describe('changed-walks.sh', () => {
  repo();
  it('exits non-zero when the base ref is missing (fails closed)', () => {
    const out = join(dir, 'out-missing');
    const r = run('no-such-branch', out);
    expect(r.status).not.toBe(0);
  });
  it('a changed spec blocks only its own walk', () => {
    git('switch', '-q', '-c', 'pr1');
    writeFileSync(join(dir, 'truth/a.spec.ts'), '// changed\n');
    git('commit', '-q', '-am', 'a');
    const out = join(dir, 'out1');
    expect(run('main', out).status).toBe(0);
    expect(readFileSync(out, 'utf8')).toBe('blocking=truth/a.spec.ts\nother=truth/b.spec.ts\n');
  });
  it('a projects.ts change blocks every product walk', () => {
    writeFileSync(join(dir, 'src/content/projects.ts'), '// changed\n');
    git('commit', '-q', '-am', 'p');
    const out = join(dir, 'out2');
    expect(run('main', out).status).toBe(0);
    expect(readFileSync(out, 'utf8')).toBe('blocking=truth/a.spec.ts truth/b.spec.ts\nother=\n');
  });
});
