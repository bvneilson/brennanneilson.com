import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { hashTerm, tokenize } from './privacy-hash.ts'

export type FindingKind = 'secret' | 'phone' | 'address' | 'denylist' | 'banzai-outside-role-line'
export type Finding = { path: string; line: number; kind: FindingKind }

const SECRET_PATTERNS: RegExp[] = [
  /sk_live_/,
  /rk_live_/,
  /ghp_/,
  /github_pat_/,
  /xox[abp]-/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN/,
]
const PHONE = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/
const DIR = '(?:N|S|E|W|North|South|East|West)\\.?'
// Grid style, e.g. "100 N 200 E".
const GRID_ADDRESS = new RegExp(`\\b\\d{1,5} ${DIR} \\d{1,5} ${DIR}(?![A-Za-z])`)
// Common US style, e.g. "42 Maple Street".
const STREET_ADDRESS =
  /\b\d{1,5} [A-Z][a-z]+(?: [A-Z][a-z]+)? (?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Way|Blvd|Ct|Court)\b/
// Built from pieces so this file does not trip its own scan.
const BANZAI = new RegExp('ban' + 'zai', 'i')
const ROLE_FILE = 'src/content/resume.md'
const MAX_WINDOW = 3
// The scanner and its tests must spell out the patterns they detect, so the
// pattern-based checks skip these two files. Phone and denylist still apply.
const PATTERN_DEFINITION_FILES = new Set(['scripts/privacy-scan.ts', 'tests/privacy-scan.test.ts'])

export function scanText(path: string, text: string, denyHashes: Set<string>): Finding[] {
  const findings: Finding[] = []
  const lines = text.split(/\r?\n/)
  const definesPatterns = PATTERN_DEFINITION_FILES.has(path)
  lines.forEach((line, i) => {
    const n = i + 1
    const add = (kind: FindingKind) => findings.push({ path, line: n, kind })
    if (!definesPatterns && SECRET_PATTERNS.some((re) => re.test(line))) add('secret')
    if (PHONE.test(line)) add('phone')
    if (!definesPatterns && (GRID_ADDRESS.test(line) || STREET_ADDRESS.test(line))) add('address')
    if (!definesPatterns && BANZAI.test(line) && !(path === ROLE_FILE && line.startsWith('### '))) {
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
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean)
  const findings: Finding[] = []
  for (const path of files) {
    let buf: Buffer
    try {
      buf = readFileSync(path)
    } catch {
      continue // tracked but deleted in the working tree
    }
    if (isBinary(path, buf)) continue
    findings.push(...scanText(path, buf.toString('utf8'), deny))
  }
  for (const f of findings) console.log(`${f.path}:${f.line} ${f.kind}`)
  if (findings.length > 0) {
    console.error(`privacy scan: ${findings.length} finding(s)`)
    process.exit(1)
  }
  console.log(`privacy scan: ${files.length} tracked files clean`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
