import { describe, expect, it } from 'vitest'
import { hashTerm } from '../scripts/privacy-hash.ts'
import { scanText } from '../scripts/privacy-scan.ts'

const deny = new Set([hashTerm('zebra quartz'), hashTerm('moon-base-9'), hashTerm('Quokka')])
// Assembled at runtime so this test file passes its own scan.
const fakeToken = 'gh' + 'p_' + 'a'.repeat(36)
const fakePhone = ['801', '555', '0142'].join('-')
const ban = 'ban'
const employer = 'Ban' + 'zai'

describe('scanText', () => {
  it('reports a token and a phone number with their lines', () => {
    const text = `ok\nkey ${fakeToken}\nfine\ncall ${fakePhone} now`
    expect(scanText('a.md', text, deny)).toEqual([
      { path: 'a.md', line: 2, kind: 'secret' },
      { path: 'a.md', line: 4, kind: 'phone' },
    ])
  })

  it('finds a denylisted 2-word term case-insensitively', () => {
    expect(scanText('a.md', 'x\nI saw a ZEBRA   Quartz today', deny)).toEqual([
      { path: 'a.md', line: 2, kind: 'denylist' },
    ])
  })

  it('finds a hyphenated term as one token and a 1-word term amid punctuation', () => {
    expect(scanText('a.md', 'see github.com/me/Moon-Base-9.', deny)).toHaveLength(1)
    expect(scanText('a.md', '"quokka!"', deny)).toHaveLength(1)
  })

  it('does not match partial words or split hyphen parts', () => {
    expect(scanText('a.md', 'zebra moon-base quokkas quartz', deny)).toEqual([])
  })

  it('allows the banned name only on a ### role line in the resume', () => {
    const resume = `## Experience\n### ${employer}, Engineer\nworked at ${employer}`
    expect(scanText('src/content/resume.md', resume, deny)).toEqual([
      { path: 'src/content/resume.md', line: 3, kind: 'banzai-outside-role-line' },
    ])
    expect(scanText('src/content/other.md', `### ${employer}`, deny)).toEqual([
      { path: 'src/content/other.md', line: 1, kind: 'banzai-outside-role-line' },
    ])
  })

  it('never includes matched text in findings', () => {
    const text = `${fakeToken} ${fakePhone} zebra quartz ${employer}`
    const out = JSON.stringify(scanText('a.md', text, deny))
    for (const leak of [fakeToken, fakePhone, 'zebra', 'quartz', employer]) {
      expect(out).not.toContain(leak)
    }
  })

  it('flags grid and street addresses without echoing them', () => {
    const grid = ['100', 'N', '200', 'E'].join(' ')
    const street = ['42', 'Maple', 'Street'].join(' ')
    const spelled = ['12', 'West', '300', 'South'].join(' ')
    const text = `${grid}\nlive at ${street}.\n${spelled}`
    const out = scanText('a.md', text, deny)
    expect(out.map((f) => [f.line, f.kind])).toEqual([[1, 'address'], [2, 'address'], [3, 'address']])
    expect(JSON.stringify(out)).not.toContain('Maple')
  })

  it('does not flag ordinary numeric prose', () => {
    expect(scanText('a.md', 'Node 24 runs\n3 products, 4 walks\nTop 10 Best Practices', deny)).toEqual([])
  })

  it('ignores only the kind identifier, not a real name beside it', () => {
    const kind = ban + 'zai-outside-role-line'
    expect(scanText('a.ts', `kind: '${kind}'`, deny)).toEqual([])
    expect(scanText('a.ts', `${kind} ${employer}`, deny)).toHaveLength(1)
  })
})
