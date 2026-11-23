import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { hashTerm, tokenize } from './privacy-hash.ts'

export type FindingKind = 'secret' | 'phone' | 'address' | 'denylist' | 'banzai-outside-role-line'
export type Finding = { path: string; line: number; kind: FindingKind }

// Literals are split so this file does not trip its own scan. Never add a
// whole-file exemption: the self-scan doubles as a live regression test.
const SECRET_PATTERNS: RegExp[] = [
  new RegExp('sk' + '_live_'),
  new RegExp('rk' + '_live_'),
  new RegExp('gh' + 'p_'),
  new RegExp('github' + '_pat_'),
  /xox[abp]-/,
  /AKIA[0-9A-Z]{16}/,
  new RegExp('-----' + 'BEGIN'),
]
const PHONE = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/
const DIR = '(?:N|S|E|W|North|South|East|West)\\.?'
// Grid style: number, direction, number, direction.
const GRID_ADDRESS = new RegExp(`\\b\\d{1,5} ${DIR} \\d{1,5} ${DIR}(?![A-Za-z])`)
// Common US style: number, capitalized name, street suffix.
const STREET_ADDRESS =
  /\b\d{1,5} [A-Z][a-z]+(?: [A-Z][a-z]+)? (?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Way|Blvd|Ct|Court)\b/
const EMPLOYER_NAME = new RegExp('ban' + 'zai', 'i')
// The finding-kind identifier contains the name by contract. Only that exact
// identifier is ignored by the name check, nothing else on the line.
const KIND_IDENTIFIER = new RegExp('ban' + 'zai-outside-role-line', 'gi')
const ROLE_FILE = 'src/content/resume.md'
const MAX_WINDOW = 3

export function scanText(path: string, text: string, denyHashes: Set<string>): Finding[] {
  const findings: Finding[] = []
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    const n = i + 1
    const add = (kind: FindingKind) => findings.push({ path, line: n, kind })
    if (SECRET_PATTERNS.some((re) => re.test(line))) add('secret')
    if (PHONE.test(line)) add('phone')
    if (GRID_ADDRESS.test(line) || STREET_ADDRESS.test(line)) add('address')
    if (EMPLOYER_NAME.test(line.replace(KIND_IDENTIFIER, '')) && !(path === ROLE_FILE && line.startsWith('### '))) {
      add('banzai-outside-role-line')
    }
    if (denyHashes.size > 0) {
      const tokens = tokenize(line)
      let hit = false
      for (let s = 0; s < tokens.length && !hit; s++) {
        for (let w = 1; w <= MAX_WINDOW && s + w <= tokens.length; w++) {
          if (denyHashes.has(hashTerm(tokens.slice(s, s + w).join(' ')))) {
            hit = true
            break
          }
        }
      }
      if (hit) add('denylist')
    }
  })
  return findings
}

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.pdf',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.webm', '.zip',
])

function isBinary(path: string, buf: Buffer): boolean {
  return BINARY_EXT.has(extname(path).toLowerCase()) || buf.includes(0)
}

export function loadDenyHashes(file: string): Set<string> {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { hashes: string[] }
  return new Set(raw.hashes)
}

function main(): void {
  const deny = loadDenyHashes(new URL('./privacy-denylist.json', import.meta.url).pathname)
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean)
  const findings: Finding[] = []
  let readErrors = 0
  for (const path of files) {
    let buf: Buffer
    try {
      buf = readFileSync(join(root, path))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue // tracked but deleted
      console.log(`${path}: read-error`)
      readErrors++
      continue
    }
    if (isBinary(path, buf)) continue
    findings.push(...scanText(path, buf.toString('utf8'), deny))
  }
  for (const f of findings) console.log(`${f.path}:${f.line} ${f.kind}`)
  if (findings.length > 0 || readErrors > 0) {
    console.error(`privacy scan: ${findings.length} finding(s), ${readErrors} read error(s)`)
    process.exit(1)
  }
  console.log(`privacy scan: ${files.length} tracked files clean`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
