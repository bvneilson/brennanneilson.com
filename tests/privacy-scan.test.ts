import { describe, expect, it } from 'vitest'
import { hashTerm } from '../scripts/privacy-hash.ts'
import { scanText } from '../scripts/privacy-scan.ts'

const deny = new Set([hashTerm('zebra quartz'), hashTerm('moon-base-9'), hashTerm('Quokka')])
// Assembled at runtime so this test file passes its own scan.
const fakeToken = 'gh' + 'p_' + 'a'.repeat(36)
const fakePhone = ['801', '555', '0142'].join('-')
const banzai = 'Ban' + 'zai'

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
    const resume = `## Experience\n### ${banzai}, Engineer\nworked at ${banzai}`
    expect(scanText('src/content/resume.md', resume, deny)).toEqual([
      { path: 'src/content/resume.md', line: 3, kind: 'banzai-outside-role-line' },
    ])
    expect(scanText('src/content/other.md', `### ${banzai}`, deny)).toEqual([
      { path: 'src/content/other.md', line: 1, kind: 'banzai-outside-role-line' },
    ])
  })

  it('never includes matched text in findings', () => {
    const text = `${fakeToken} ${fakePhone} zebra quartz ${banzai}`
    const out = JSON.stringify(scanText('a.md', text, deny))
    for (const leak of [fakeToken, fakePhone, 'zebra', 'quartz', banzai]) {
      expect(out).not.toContain(leak)
    }
  })
})
